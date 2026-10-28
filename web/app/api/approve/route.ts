import seed from "@/seed.json";
import { validateCapture, type Plan, type Subscription } from "@/lib/state-machine";
import { captureOutstandingBalance } from "@/lib/paypal-mock";
import { createPayPalClient, type PayPalCaptureResult } from "@/lib/paypal";
import { ledger, proposals, recovered, type LedgerEvent } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const proposalId = body?.proposalId;

  if (!proposalId || typeof proposalId !== "string") {
    return Response.json({ error: "proposalId is required" }, { status: 400 });
  }

  const proposal = proposals[proposalId];

  if (!proposal) {
    return Response.json({ error: "proposal not found" }, { status: 404 });
  }

  const requiredToken = process.env.APPROVER_TOKEN;
  if (requiredToken) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${requiredToken}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (proposal.status !== "AWAITING_APPROVAL") {
    return Response.json(
      { error: `proposal is ${proposal.status}`, proposal },
      { status: 409 },
    );
  }

  const subscription = (seed.subscriptions as Subscription[]).find(
    (item) => item.id === proposal.subscriptionId,
  );
  const plan = subscription
    ? (seed.plans as Record<string, Plan>)[subscription.plan_id]
    : undefined;

  if (!subscription || !plan) {
    proposal.status = "FAILED";
    return Response.json({ error: "subscription not found" }, { status: 404 });
  }

  const validation = validateCapture({
    status: subscription.status,
    outstanding: proposal.outstanding,
    amount: proposal.amount,
    currency: proposal.currency,
    subCurrency: subscription.currency,
    note: proposal.note,
  });

  if (!validation.ok) {
    proposal.status = "FAILED";
    const failure: LedgerEvent = {
      id: crypto.randomUUID(),
      type: "failure",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: { issue: validation.issue, field: validation.field },
    };
    ledger.push(failure);
    return Response.json({ error: validation.issue, proposal, ledger: [failure] }, { status: 422 });
  }

  const configured = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
  const paypalClient = configured
    ? createPayPalClient({
        baseUrl: process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com",
        clientId: process.env.PAYPAL_CLIENT_ID as string,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET as string,
      })
    : null;

  proposal.status = "EXECUTED";
  let capture: PayPalCaptureResult;

  try {
    capture = paypalClient
      ? await paypalClient.captureOutstanding(subscription.id, {
          amount: proposal.amount,
          currency: proposal.currency,
          note: proposal.note,
          requestId: proposal.requestId,
        })
      : captureOutstandingBalance({
          subscriptionId: subscription.id,
          amount: proposal.amount,
          currency: proposal.currency,
          note: proposal.note,
          requestId: proposal.requestId,
          scenario: body?.scenario,
        });
  } catch (error) {
    proposal.status = "PENDING_VERIFICATION";
    const failure: LedgerEvent = {
      id: crypto.randomUUID(),
      type: "failure",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: {
        error: error instanceof Error ? error.message : String(error),
        uncertain: true,
      },
    };
    ledger.push(failure);
    return Response.json(
      { error: "PayPal outcome uncertain", pendingVerification: true, proposal, ledger: [failure] },
      { status: 202 },
    );
  }

  const events: LedgerEvent[] = [
    {
      id: crypto.randomUUID(),
      type: "capture",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: capture.ok
        ? {
            captureId: capture.captureId,
            status: capture.status,
            requestId: proposal.requestId,
          }
        : {
            issue: capture.issue,
            httpStatus: capture.httpStatus,
            requestId: proposal.requestId,
            uncertain:
              capture.httpStatus === undefined || capture.httpStatus >= 500,
          },
    },
  ];

  if (!capture.ok) {
    const uncertain =
      capture.httpStatus === undefined || capture.httpStatus >= 500;
    proposal.status = uncertain ? "PENDING_VERIFICATION" : "FAILED";
    ledger.push(...events);
    return Response.json(
      {
        error: capture.issue,
        pendingVerification: uncertain,
        proposal,
        ledger: events,
      },
      { status: uncertain ? 202 : 422 },
    );
  }

  if (!paypalClient) {
    recovered[subscription.id] = true;
  }

  let verified = capture.status === "COMPLETED";
  let uncertain = false;

  if (verified && paypalClient) {
    try {
      const fresh = await paypalClient.getSubscription(subscription.id);
      const balance = Number(
        fresh?.billing_info?.outstanding_balance?.value ?? "NaN",
      );
      verified = balance === 0;

      if (verified && fresh?.status === "SUSPENDED") {
        const activation = await paypalClient.activateSubscription(
          subscription.id,
          "Outstanding balance recovered",
        );
        verified = activation.ok;
        if (!verified) {
          uncertain = true;
        }
      } else if (!verified) {
        uncertain = true;
      }
    } catch {
      verified = false;
      uncertain = true;
    }
  }

  proposal.status = verified
    ? "VERIFIED"
    : uncertain
      ? "PENDING_VERIFICATION"
      : "FAILED";
  events.push({
    id: crypto.randomUUID(),
    type: "verify",
    proposalId: proposal.id,
    at: new Date().toISOString(),
    detail: { captureId: capture.captureId, verified, uncertain },
  });
  ledger.push(...events);

  return Response.json(
    {
      proposal,
      capture,
      verified,
      pendingVerification: uncertain,
      ledger: events,
    },
    { status: verified ? 200 : uncertain ? 202 : 422 },
  );
}

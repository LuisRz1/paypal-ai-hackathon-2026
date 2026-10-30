import seed from "@/seed.json";
import { validateCapture, type Plan, type Subscription } from "@/lib/state-machine";
import { captureOutstandingBalance } from "@/lib/paypal-mock";
import { createPayPalClient, type PayPalCaptureResult } from "@/lib/paypal";
import { evaluatePolicy } from "@/lib/policy";
import { getActivePolicy } from "@/lib/policy-store";
import { consumeCapability, issueCapability } from "@/lib/capability";
import { decimalString } from "@/lib/integrity";
import {
  proposals,
  recovered,
  recoveryEvidence,
  recordLedger,
  type LedgerEvent,
} from "@/lib/store";
import {
  snapshotPayPalSubscription,
  snapshotSeedSubscription,
} from "@/lib/recovery-passport";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const proposalId = body?.proposalId;
  if (!proposalId || typeof proposalId !== "string") {
    return Response.json({ error: "proposalId is required" }, { status: 400 });
  }

  const requiredToken = process.env.APPROVER_TOKEN;
  if (
    requiredToken &&
    request.headers.get("authorization") !== `Bearer ${requiredToken}`
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (body?.confirmed !== true) {
    return Response.json(
      { error: "Explicit human confirmation is required" },
      { status: 400 },
    );
  }

  const proposal = proposals[proposalId];
  if (!proposal) {
    return Response.json({ error: "proposal not found" }, { status: 404 });
  }
  if (proposal.status !== "AWAITING_APPROVAL") {
    return Response.json(
      { error: `proposal is ${proposal.status}`, proposal },
      { status: 409 },
    );
  }

  const active = getActivePolicy();
  if (proposal.policyHash !== active.hash) {
    return Response.json(
      { error: "The active policy changed; create a new proposal", proposal },
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

  const currentAction = evaluatePolicy(subscription, plan, active.policy);
  if (
    currentAction.action !== "CAPTURE" ||
    proposal.amount !== subscription.outstanding_balance ||
    proposal.outstanding !== subscription.outstanding_balance ||
    proposal.currency !== subscription.currency
  ) {
    return Response.json(
      { error: "Subscription or policy state changed; create a new proposal", proposal },
      { status: 409 },
    );
  }

  const validation = validateCapture({
    status: subscription.status,
    outstanding: subscription.outstanding_balance,
    amount: proposal.amount,
    currency: proposal.currency,
    subCurrency: subscription.currency,
    note: proposal.note,
  });
  if (!validation.ok) {
    proposal.status = "FAILED";
    const failure = recordLedger({
      id: crypto.randomUUID(),
      type: "failure",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: { issue: validation.issue, field: validation.field },
    });
    return Response.json(
      { error: validation.issue, proposal, ledger: [failure] },
      { status: 422 },
    );
  }

  const hasClientId = Boolean(process.env.PAYPAL_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.PAYPAL_CLIENT_SECRET);
  if (hasClientId !== hasClientSecret) {
    return Response.json(
      { error: "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set together" },
      { status: 503 },
    );
  }

  const configured = hasClientId && hasClientSecret;
  const paypalClient = configured
    ? createPayPalClient({
        baseUrl: process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com",
        clientId: process.env.PAYPAL_CLIENT_ID as string,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET as string,
      })
    : null;

  const binding = {
    proposalId: proposal.id,
    subscriptionId: subscription.id,
    amount: decimalString(proposal.amount),
    currency: proposal.currency,
    policyHash: proposal.policyHash,
    requestId: proposal.requestId,
  };
  const issued = issueCapability(binding);
  const consumed = consumeCapability(issued.token, binding);
  if (!consumed.ok) {
    return Response.json(
      { error: consumed.error, proposal },
      { status: consumed.error === "EXPIRED_CAPABILITY" ? 410 : 409 },
    );
  }

  const approvedAt = new Date().toISOString();
  const approvedBy =
    typeof body?.approvedBy === "string" && body.approvedBy.trim()
      ? body.approvedBy.trim().slice(0, 80)
      : "Demo merchant";
  proposal.status = "EXECUTED";
  proposal.approvedAt = approvedAt;
  proposal.approvedBy = approvedBy;
  proposal.capabilityHash = consumed.capabilityHash;
  recoveryEvidence[proposal.id] = {
    proposalId: proposal.id,
    createdAt: approvedAt,
    environment: configured ? "sandbox" : "mock",
    policy: {
      id: active.id,
      hash: active.hash,
      name: active.policy.name,
      document: active.policy,
    },
    subscriptionBefore: snapshotSeedSubscription(subscription),
    approval: {
      approvedBy,
      approvedAt,
      capabilityHash: consumed.capabilityHash,
      requestId: proposal.requestId,
    },
    verified: false,
    pendingVerification: false,
  };
  const approvalEvent = recordLedger({
    id: crypto.randomUUID(),
    type: "approval",
    proposalId: proposal.id,
    at: approvedAt,
    detail: {
      approvedBy,
      approvedAt,
      capabilityHash: consumed.capabilityHash,
      policyHash: proposal.policyHash,
      requestId: proposal.requestId,
    },
  });

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
          scenario: typeof body?.scenario === "string" ? body.scenario : undefined,
        });
  } catch (error) {
    proposal.status = "PENDING_VERIFICATION";
    recoveryEvidence[proposal.id].pendingVerification = true;
    recoveryEvidence[proposal.id].capture = {
      error: error instanceof Error ? error.message : String(error),
      uncertain: true,
    };
    const failure = recordLedger({
      id: crypto.randomUUID(),
      type: "failure",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: {
        error: error instanceof Error ? error.message : String(error),
        uncertain: true,
      },
    });
    return Response.json(
      {
        error: "PayPal outcome uncertain",
        pendingVerification: true,
        proposal,
        ledger: [approvalEvent, failure],
        evidenceUrl: `/api/evidence/${proposal.id}`,
      },
      { status: 202 },
    );
  }

  recoveryEvidence[proposal.id].capture = { ...capture };
  const captureEvent = recordLedger({
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
          uncertain: capture.httpStatus === undefined || capture.httpStatus >= 500,
        },
  });

  if (!capture.ok) {
    const uncertain = capture.httpStatus === undefined || capture.httpStatus >= 500;
    proposal.status = uncertain ? "PENDING_VERIFICATION" : "FAILED";
    recoveryEvidence[proposal.id].pendingVerification = uncertain;
    return Response.json(
      {
        error: capture.issue,
        pendingVerification: uncertain,
        proposal,
        ledger: [approvalEvent, captureEvent],
        evidenceUrl: `/api/evidence/${proposal.id}`,
      },
      { status: uncertain ? 202 : 422 },
    );
  }

  let verified = capture.status === "COMPLETED";
  let uncertain = false;
  if (verified && !paypalClient) {
    recovered[subscription.id] = true;
    recoveryEvidence[proposal.id].readback = {
      ...snapshotSeedSubscription(subscription),
      status: "ACTIVE",
      outstanding_balance: 0,
      failed_payments_count: 0,
      source: "mock",
    };
    if (subscription.status === "SUSPENDED") {
      recoveryEvidence[proposal.id].activation = {
        ok: true,
        status: "ACTIVE",
        source: "mock",
      };
    }
  }

  if (verified && paypalClient) {
    try {
      const fresh = await paypalClient.getSubscription(subscription.id);
      recoveryEvidence[proposal.id].readback = snapshotPayPalSubscription(fresh);
      const balance = Number(fresh?.billing_info?.outstanding_balance?.value ?? "NaN");
      verified = balance === 0;

      if (verified && fresh?.status === "SUSPENDED") {
        const activation = await paypalClient.activateSubscription(
          subscription.id,
          "Outstanding balance recovered",
        );
        recoveryEvidence[proposal.id].activation = { ...activation };
        verified = activation.ok;
        if (!verified) uncertain = true;
      } else if (!verified) {
        uncertain = true;
      }
    } catch {
      verified = false;
      uncertain = true;
    }
  }

  proposal.status = verified ? "VERIFIED" : uncertain ? "PENDING_VERIFICATION" : "FAILED";
  recoveryEvidence[proposal.id].verified = verified;
  recoveryEvidence[proposal.id].pendingVerification = uncertain;
  const verifyEvent = recordLedger({
    id: crypto.randomUUID(),
    type: "verify",
    proposalId: proposal.id,
    at: new Date().toISOString(),
    detail: { captureId: capture.captureId, verified, uncertain },
  });
  const events: LedgerEvent[] = [approvalEvent, captureEvent, verifyEvent];

  return Response.json(
    {
      proposal,
      capture,
      verified,
      pendingVerification: uncertain,
      ledger: events,
      evidenceUrl: `/api/evidence/${proposal.id}`,
    },
    { status: verified ? 200 : uncertain ? 202 : 422 },
  );
}

import seed from "@/seed.json";
import { validateCapture, type Plan, type Subscription } from "@/lib/state-machine";
import { captureOutstandingBalance } from "@/lib/paypal-mock";
import { ledger, proposals, type LedgerEvent } from "@/lib/store";

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

  proposal.status = "EXECUTED";
  const capture = captureOutstandingBalance({
    subscriptionId: subscription.id,
    amount: proposal.amount,
    currency: proposal.currency,
    note: proposal.note,
    requestId: proposal.requestId,
    scenario: body?.scenario,
  });

  const events: LedgerEvent[] = [
    {
      id: crypto.randomUUID(),
      type: "capture",
      proposalId: proposal.id,
      at: new Date().toISOString(),
      detail: capture.ok
        ? { captureId: capture.captureId, status: capture.status, requestId: proposal.requestId }
        : { issue: capture.issue, requestId: proposal.requestId },
    },
  ];

  if (!capture.ok) {
    proposal.status = "FAILED";
    ledger.push(...events);
    return Response.json({ error: capture.issue, proposal, ledger: events }, { status: 422 });
  }

  const verified = capture.status === "COMPLETED";
  proposal.status = verified ? "VERIFIED" : "FAILED";
  events.push({
    id: crypto.randomUUID(),
    type: "verify",
    proposalId: proposal.id,
    at: new Date().toISOString(),
    detail: { captureId: capture.captureId, verified },
  });
  ledger.push(...events);

  return Response.json({ proposal, capture, verified, ledger: events });
}

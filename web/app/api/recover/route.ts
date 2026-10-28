import seed from "@/seed.json";
import { nextAction, type Plan, type Subscription } from "@/lib/state-machine";
import { ledger, proposals, type LedgerEvent, type Proposal } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const subscriptionId = body?.subscriptionId;

  if (!subscriptionId || typeof subscriptionId !== "string") {
    return Response.json({ error: "subscriptionId is required" }, { status: 400 });
  }

  const subscription = (seed.subscriptions as Subscription[]).find(
    (item) => item.id === subscriptionId,
  );

  if (!subscription) {
    return Response.json({ error: "subscription not found" }, { status: 404 });
  }

  const plan = (seed.plans as Record<string, Plan>)[subscription.plan_id];
  const action = nextAction(subscription, plan);

  if (action.action !== "CAPTURE") {
    return Response.json(
      { error: `No capture proposed for ${subscriptionId}`, action },
      { status: 409 },
    );
  }

  const pending = Object.values(proposals).find(
    (item) =>
      item.subscriptionId === subscriptionId && item.status === "AWAITING_APPROVAL",
  );
  if (pending) {
    return Response.json(
      { error: "a proposal is already awaiting approval", proposal: pending },
      { status: 409 },
    );
  }

  const createdAt = new Date().toISOString();
  const proposal: Proposal = {
    id: crypto.randomUUID(),
    subscriptionId,
    action: action.action,
    amount: action.amount ?? 0,
    currency: subscription.currency,
    note: "Outstanding balance recovered",
    outstanding: subscription.outstanding_balance,
    status: "AWAITING_APPROVAL",
    requestId: crypto.randomUUID(),
    createdAt,
  };

  proposals[proposal.id] = proposal;

  const proposalEvent: LedgerEvent = {
    id: crypto.randomUUID(),
    type: "proposal",
    proposalId: proposal.id,
    at: createdAt,
    detail: {
      subscriptionId,
      amount: proposal.amount,
      currency: proposal.currency,
      requestId: proposal.requestId,
    },
  };
  ledger.push(proposalEvent);

  return Response.json({ proposal, action });
}

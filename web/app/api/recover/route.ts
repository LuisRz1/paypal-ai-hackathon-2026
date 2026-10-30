import seed from "@/seed.json";
import { evaluatePolicy } from "@/lib/policy";
import { getActivePolicy } from "@/lib/policy-store";
import type { Plan, Subscription } from "@/lib/state-machine";
import { proposals, recovered, recordLedger } from "@/lib/store";

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
  if (recovered[subscriptionId]) {
    return Response.json(
      { error: "subscription already recovered in this mock session" },
      { status: 409 },
    );
  }

  const active = getActivePolicy();
  const plan = (seed.plans as Record<string, Plan>)[subscription.plan_id];
  const action = evaluatePolicy(subscription, plan, active.policy);
  if (action.action !== "CAPTURE") {
    return Response.json(
      { error: `No capture proposed for ${subscriptionId}`, action },
      { status: 409 },
    );
  }

  const pending = Object.values(proposals).find(
    (item) =>
      item.subscriptionId === subscriptionId &&
      ["AWAITING_APPROVAL", "EXECUTED", "PENDING_VERIFICATION"].includes(item.status),
  );
  if (pending) {
    return Response.json(
      { error: "an active proposal already exists", proposal: pending },
      { status: 409 },
    );
  }

  const createdAt = new Date().toISOString();
  const proposal = {
    id: crypto.randomUUID(),
    subscriptionId,
    action: action.action,
    amount: action.amount ?? 0,
    currency: subscription.currency,
    note: "Outstanding balance recovered",
    outstanding: subscription.outstanding_balance,
    status: "AWAITING_APPROVAL" as const,
    requestId: crypto.randomUUID(),
    policyHash: active.hash,
    createdAt,
  };
  proposals[proposal.id] = proposal;

  recordLedger({
    id: crypto.randomUUID(),
    type: "proposal",
    proposalId: proposal.id,
    at: createdAt,
    detail: {
      subscriptionId,
      amount: proposal.amount,
      currency: proposal.currency,
      requestId: proposal.requestId,
      policyHash: active.hash,
      policyRuleId: action.policyRuleId,
    },
  });

  return Response.json({ proposal, action });
}

import seed from "@/seed.json";
import { evaluatePolicy } from "@/lib/policy";
import { getActivePolicy } from "@/lib/policy-store";
import type { Action, Plan, Subscription } from "@/lib/state-machine";

export async function GET() {
  const active = getActivePolicy();
  const subscriptions = seed.subscriptions as Subscription[];
  const plans = seed.plans as Record<string, Plan>;
  const decisions: Record<string, Action> = {};

  for (const subscription of subscriptions) {
    decisions[subscription.id] = evaluatePolicy(
      subscription,
      plans[subscription.plan_id],
      active.policy,
    );
  }

  return Response.json({
    ...seed,
    decisions,
    meta: {
      source: "seed",
      environment:
        process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
          ? "sandbox"
          : "mock",
      generatedAt: new Date().toISOString(),
      policy: {
        id: active.id,
        hash: active.hash,
        name: active.policy.name,
        source: active.source,
      },
    },
  }, {
    headers: { "cache-control": "no-store" },
  });
}

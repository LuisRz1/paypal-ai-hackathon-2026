import seed from "@/seed.json";
import { nextAction, type Plan, type Subscription } from "@/lib/state-machine";

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
  return Response.json({
    subscriptionId,
    action: nextAction(subscription, plan),
    subscription,
  });
}

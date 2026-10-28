import seed from "@/seed.json";
import { explainFailure } from "@/lib/explain";
import type { Subscription } from "@/lib/state-machine";

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

  return Response.json({
    subscriptionId,
    explanation: explainFailure(subscription.last_failed_payment?.reason_code ?? null),
  });
}

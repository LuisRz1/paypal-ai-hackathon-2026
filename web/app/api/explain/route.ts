import seed from "@/seed.json";
import { createExplainer } from "@/lib/explain-llm";
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

  const explainer = createExplainer({
    apiKey: process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  });
  const explanation = await explainer.explain(subscription);

  return Response.json({ subscriptionId, explanation });
}

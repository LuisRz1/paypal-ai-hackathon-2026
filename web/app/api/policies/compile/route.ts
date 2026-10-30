import { compilePolicyIntent } from "@/lib/policy-compiler";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const intent = body?.intent;
  if (typeof intent !== "string" || intent.trim().length < 10 || intent.length > 1_000) {
    return Response.json(
      { error: "intent must contain between 10 and 1000 characters" },
      { status: 400 },
    );
  }

  const compiled = await compilePolicyIntent(intent.trim(), {
    apiKey: process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    model: process.env.LLM_MODEL,
  });
  return Response.json(compiled);
}

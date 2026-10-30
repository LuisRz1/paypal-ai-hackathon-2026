import { activatePolicy } from "@/lib/policy-store";
import { recordLedger } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.signed !== true) {
    return Response.json(
      { error: "Explicit policy review and signature are required" },
      { status: 400 },
    );
  }

  const source = body?.source === "llm" ? "llm" : "deterministic";
  const result = activatePolicy({
    policy: body?.policy,
    intent: typeof body?.intent === "string" ? body.intent.slice(0, 1_000) : "",
    source,
  });
  if (!result.ok) {
    return Response.json(
      { error: result.errors[0], details: result.errors, simulation: result.simulation },
      { status: 422 },
    );
  }

  recordLedger({
    id: crypto.randomUUID(),
    type: "policy",
    proposalId: "",
    at: result.active.activatedAt as string,
    detail: {
      policyId: result.active.id,
      policyHash: result.active.hash,
      simulationHash: result.active.simulationHash,
      simulatedCases: result.simulation.total,
    },
  });

  return Response.json({ active: result.active, simulation: result.simulation });
}

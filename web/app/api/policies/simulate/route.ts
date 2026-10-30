import { validatePolicy } from "@/lib/policy";
import { simulatePolicy } from "@/lib/simulation";
import { sha256 } from "@/lib/integrity";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validatePolicy(body?.policy);
  if (!validated.ok) {
    return Response.json({ error: "invalid policy", details: validated.errors }, { status: 400 });
  }

  const simulation = simulatePolicy(validated.policy);
  return Response.json({ simulation, policyHash: sha256(validated.policy) });
}

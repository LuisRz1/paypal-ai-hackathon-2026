import { evidencePublicKey, verifyRecoveryPassport } from "@/lib/evidence";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "passport is required" }, { status: 400 });
  }
  const verification = verifyRecoveryPassport(body, evidencePublicKey().keyId);
  return Response.json(verification);
}

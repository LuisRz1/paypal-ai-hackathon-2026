import { buildRecoveryPassport } from "@/lib/recovery-passport";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  const { proposalId } = await params;
  const passport = buildRecoveryPassport(proposalId);
  if (!passport) {
    return Response.json({ error: "recovery evidence not found" }, { status: 404 });
  }
  return Response.json({ passport }, {
    headers: { "cache-control": "no-store" },
  });
}

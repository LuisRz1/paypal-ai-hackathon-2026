import { ledger } from "@/lib/store";

export async function GET() {
  const events = [...ledger].sort((a, b) => a.at.localeCompare(b.at));

  return Response.json({ count: events.length, events });
}

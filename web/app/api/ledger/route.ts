import { ledger } from "@/lib/store";

export async function GET() {
  return Response.json({ count: ledger.length, events: ledger });
}

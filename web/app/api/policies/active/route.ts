import { getActivePolicy } from "@/lib/policy-store";

export async function GET() {
  return Response.json({ active: getActivePolicy() }, {
    headers: { "cache-control": "no-store" },
  });
}

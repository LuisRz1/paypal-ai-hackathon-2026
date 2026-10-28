import seed from "@/seed.json";

export async function GET() {
  const payload = {
    ...seed,
    meta: {
      source: "seed",
      environment: "sandbox",
      generatedAt: new Date().toISOString(),
    },
  };

  return Response.json(payload, {
    headers: { "cache-control": "no-store" },
  });
}

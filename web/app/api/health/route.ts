import { ledger } from "@/lib/store";

export async function GET() {
  const checks = {
    paypalConfigured: Boolean(
      process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
    ),
    webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    allowUnverifiedWebhooks: process.env.ALLOW_UNVERIFIED_WEBHOOKS === "true",
    llmConfigured: Boolean(
      process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
    ),
    ledgerEvents: ledger.length,
    environment:
      process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com",
  };

  return Response.json({
    status: checks.paypalConfigured ? "sandbox" : "mock",
    checks,
  });
}

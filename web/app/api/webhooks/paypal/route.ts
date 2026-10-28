import { createPayPalClient } from "@/lib/paypal";
import { ledger, type LedgerEvent } from "@/lib/store";

const globalWebhooks = globalThis as unknown as {
  __recoverWebhookEvents?: Record<string, true>;
};
const seen = (globalWebhooks.__recoverWebhookEvents ??= {} as Record<string, true>);

export async function POST(request: Request) {
  const raw = await request.text();
  let event: { id?: string; event_type?: string; resource?: { id?: string } };

  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (!event.id || typeof event.id !== "string") {
    return Response.json({ error: "event id is required" }, { status: 400 });
  }
  if (seen[event.id]) {
    return Response.json({ duplicate: true });
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (webhookId) {
    const client = createPayPalClient({
      baseUrl: process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com",
      clientId: process.env.PAYPAL_CLIENT_ID as string,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET as string,
    });
    const valid = await client.verifyWebhook(request.headers, event);
    if (!valid) {
      return Response.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (process.env.ALLOW_UNVERIFIED_WEBHOOKS !== "true") {
    return Response.json(
      { error: "webhook verification is not configured" },
      { status: 503 },
    );
  }

  seen[event.id] = true;

  const entry: LedgerEvent = {
    id: crypto.randomUUID(),
    type: "webhook",
    proposalId: "",
    at: new Date().toISOString(),
    detail: {
      eventId: event.id,
      eventType: event.event_type,
      resourceId: event.resource?.id,
    },
  };
  ledger.push(entry);

  return Response.json({ received: true });
}

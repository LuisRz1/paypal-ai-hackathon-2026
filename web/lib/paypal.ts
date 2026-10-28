export interface PayPalConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  allowLocal?: boolean;
  fetchImpl?: typeof fetch;
}

export interface PayPalCaptureResult {
  ok: boolean;
  captureId?: string;
  status?: string;
  issue?: string;
  debugId?: string;
  httpStatus?: number;
}

const SANDBOX_HOST = "api-m.sandbox.paypal.com";

export function createPayPalClient(config: PayPalConfig) {
  const base = new URL(config.baseUrl);
  const local =
    config.allowLocal &&
    (base.hostname === "127.0.0.1" || base.hostname === "localhost");
  const isSandbox = base.protocol === "https:" && base.hostname === SANDBOX_HOST;

  if (!local && !isSandbox) {
    throw new Error(`Refusing non-sandbox PayPal base: ${config.baseUrl}`);
  }

  const doFetch = config.fetchImpl ?? fetch;
  let cached: { token: string; expiresAt: number } | null = null;

  async function accessToken(): Promise<string> {
    if (cached && Date.now() < cached.expiresAt - 60_000) {
      return cached.token;
    }

    const response = await doFetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers: {
        authorization: `Basic ${Buffer.from(
          `${config.clientId}:${config.clientSecret}`,
        ).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `PayPal auth failed: ${response.status} ${payload?.error ?? "unknown"}`,
      );
    }

    cached = {
      token: payload.access_token,
      expiresAt: Date.now() + Number(payload.expires_in ?? 0) * 1000,
    };
    return cached.token;
  }

  async function request(
    path: string,
    init: RequestInit = {},
    options: { retry5xx?: boolean } = {},
  ) {
    const retry5xx = options.retry5xx ?? ((init.method ?? "GET") === "GET");

    let response = await doFetch(`${config.baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(10_000),
      headers: {
        ...(init.headers ?? {}),
        authorization: `Bearer ${await accessToken()}`,
      },
    });
    let attempt = 0;

    while (
      (response.status === 429 || (retry5xx && response.status >= 500)) &&
      attempt < 2
    ) {
      attempt += 1;
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 250 * 2 ** (attempt - 1));
      await promise;
      response = await doFetch(`${config.baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(10_000),
        headers: {
          ...(init.headers ?? {}),
          authorization: `Bearer ${await accessToken()}`,
        },
      });
    }

    const text = await response.text();
    const body = text ? JSON.parse(text) : {};
    return { response, body };
  }

  async function getSubscription(id: string) {
    const { response, body } = await request(
      `/v1/billing/subscriptions/${encodeURIComponent(id)}`,
    );
    if (!response.ok) {
      throw new Error(`PayPal get subscription failed: ${response.status}`);
    }
    return body;
  }

  async function captureOutstanding(
    id: string,
    input: {
      amount: number;
      currency: string;
      note: string;
      requestId: string;
    },
  ): Promise<PayPalCaptureResult> {
    const { response, body } = await request(
      `/v1/billing/subscriptions/${encodeURIComponent(id)}/capture`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "paypal-request-id": input.requestId,
        },
        body: JSON.stringify({
          note: input.note,
          capture_type: "OUTSTANDING_BALANCE",
          amount: {
            value: input.amount.toFixed(2),
            currency_code: input.currency,
          },
        }),
      },
      { retry5xx: false },
    );

    if (!response.ok) {
      return {
        ok: false,
        issue: body?.details?.[0]?.issue ?? body?.name ?? "UNKNOWN",
        debugId: body?.debug_id,
        httpStatus: response.status,
      };
    }

    return { ok: true, captureId: body?.id, status: body?.status };
  }

  async function activateSubscription(id: string, reason: string) {
    const { response, body } = await request(
      `/v1/billing/subscriptions/${encodeURIComponent(id)}/activate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      },
      { retry5xx: false },
    );

    return response.ok
      ? { ok: true }
      : {
          ok: false,
          issue: body?.details?.[0]?.issue ?? body?.name ?? "UNKNOWN",
        };
  }

  async function verifyWebhook(headers: Headers, event: unknown) {
    const { response, body } = await request(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          auth_algo: headers.get("paypal-auth-algo"),
          cert_url: headers.get("paypal-cert-url"),
          transmission_id: headers.get("paypal-transmission-id"),
          transmission_sig: headers.get("paypal-transmission-sig"),
          transmission_time: headers.get("paypal-transmission-time"),
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        }),
      },
      { retry5xx: true },
    );

    return response.ok && body?.verification_status === "SUCCESS";
  }

  return { getSubscription, captureOutstanding, activateSubscription, verifyWebhook };
}

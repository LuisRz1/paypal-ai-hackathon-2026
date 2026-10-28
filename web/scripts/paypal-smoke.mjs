import http from "node:http";
import assert from "node:assert/strict";
import { createPayPalClient } from "../lib/paypal.ts";

const requests = [];
let retryCount = 0;
let captureFailCount = 0;

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    requests.push({ method: req.method, url: req.url, body, headers: req.headers });
    res.setHeader("content-type", "application/json");

    if (req.url === "/v1/oauth2/token") {
      res.end(JSON.stringify({ access_token: "token-1", expires_in: 3600 }));
      return;
    }
    if (req.url === "/v1/billing/subscriptions/SUB-RETRY") {
      retryCount += 1;
      if (retryCount === 1) {
        res.statusCode = 500;
        res.end(JSON.stringify({ name: "INTERNAL_SERVER_ERROR" }));
        return;
      }
      res.end(JSON.stringify({ id: "SUB-RETRY", status: "ACTIVE" }));
      return;
    }
    if (req.url === "/v1/billing/subscriptions/SUB-1") {
      res.end(
        JSON.stringify({
          id: "SUB-1",
          status: "SUSPENDED",
          billing_info: { outstanding_balance: { value: "49.00", currency_code: "USD" } },
        }),
      );
      return;
    }
    if (req.url === "/v1/billing/subscriptions/SUB-CAPTURE-FAIL/capture") {
      captureFailCount += 1;
      res.statusCode = 500;
      res.end(JSON.stringify({ name: "INTERNAL_SERVER_ERROR" }));
      return;
    }
    if (req.url === "/v1/billing/subscriptions/SUB-1/capture") {
      res.end(JSON.stringify({ id: "CAP-1", status: "COMPLETED" }));
      return;
    }
    if (req.url === "/v1/billing/subscriptions/SUB-1/activate") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.url === "/v1/notifications/verify-webhook-signature") {
      res.end(JSON.stringify({ verification_status: "SUCCESS" }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ name: "RESOURCE_NOT_FOUND" }));
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const client = createPayPalClient({
  baseUrl: `http://127.0.0.1:${port}`,
  clientId: "client",
  clientSecret: "secret",
  allowLocal: true,
});

const subscription = await client.getSubscription("SUB-1");
assert.equal(subscription.status, "SUSPENDED");

const retried = await client.getSubscription("SUB-RETRY");
assert.equal(retried.status, "ACTIVE");
assert.equal(retryCount, 2);

const capture = await client.captureOutstanding("SUB-1", {
  amount: 49,
  currency: "USD",
  note: "Outstanding balance recovered",
  requestId: "req-1",
});
assert.deepEqual(capture, { ok: true, captureId: "CAP-1", status: "COMPLETED" });

const captureRequest = requests.find((item) => item.url.endsWith("/capture"));
assert.equal(captureRequest.headers["paypal-request-id"], "req-1");
const captureBody = JSON.parse(captureRequest.body);
assert.equal(captureBody.capture_type, "OUTSTANDING_BALANCE");
assert.equal(captureBody.amount.value, "49.00");

const activation = await client.activateSubscription("SUB-1", "Outstanding balance recovered");
assert.deepEqual(activation, { ok: true });

const failedCapture = await client.captureOutstanding("SUB-CAPTURE-FAIL", {
  amount: 49,
  currency: "USD",
  note: "Outstanding balance recovered",
  requestId: "req-fail",
});
assert.equal(failedCapture.ok, false);
assert.equal(captureFailCount, 1);

const verified = await client.verifyWebhook(
  new Headers({
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-cert-url": "https://example.test/cert",
    "paypal-transmission-id": "tx-1",
    "paypal-transmission-sig": "sig",
    "paypal-transmission-time": "2026-10-28T00:00:00Z",
  }),
  { id: "WH-1", event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED" },
);
assert.equal(verified, true);

server.close();
console.log("paypal client smoke: ok");
console.log(
  requests.map((item) => `${item.method} ${item.url}`).join("\n"),
);

import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./sandbox-check.mjs", import.meta.url));

let server;
let baseUrl;
const captureBodies = [];

before(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      res.setHeader("content-type", "application/json");

      if (req.url === "/v1/oauth2/token") {
        res.end(JSON.stringify({ access_token: "token-1", expires_in: 3600 }));
        return;
      }
      if (req.url === "/v1/billing/subscriptions/SUB-1") {
        res.end(
          JSON.stringify({
            id: "SUB-1",
            status: "SUSPENDED",
            billing_info: {
              outstanding_balance: { value: "49.00", currency_code: "USD" },
              failed_payments_count: 2,
              last_failed_payment: {
                amount: { value: "49.00", currency_code: "USD" },
                time: "2026-10-20T10:00:00Z",
                reason_code: "PAYMENT_DENIED",
                next_payment_retry_time: null,
              },
            },
          }),
        );
        return;
      }
      if (req.url === "/v1/billing/subscriptions/SUB-ZERO") {
        res.end(
          JSON.stringify({
            id: "SUB-ZERO",
            status: "SUSPENDED",
            billing_info: {
              outstanding_balance: { value: "0.00", currency_code: "USD" },
              failed_payments_count: 2,
            },
          }),
        );
        return;
      }
      if (req.url === "/v1/billing/subscriptions/SUB-1/capture") {
        captureBodies.push(body);
        res.end(JSON.stringify({ id: "CAP-1", status: "COMPLETED" }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ name: "RESOURCE_NOT_FOUND" }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function run(overrides = {}) {
  const env = {
    ...process.env,
    PAYPAL_API_BASE: baseUrl,
    PAYPAL_ALLOW_LOCAL: "true",
    PAYPAL_CLIENT_ID: "client",
    PAYPAL_CLIENT_SECRET: "secret",
    ...overrides,
  };

  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--experimental-strip-types", scriptPath, ...(env.ARGS ?? [])],
      { cwd: env.CWD ?? process.cwd(), env },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("dry run prints the subscription snapshot", async () => {
  captureBodies.length = 0;
  const result = await run({ SUBSCRIPTION_ID: "SUB-1" });

  assert.equal(result.code, 0);
  const snapshot = JSON.parse(result.stdout.slice(0, result.stdout.indexOf("\nDry run")));
  assert.equal(snapshot.subscriptionId, "SUB-1");
  assert.equal(snapshot.status, "SUSPENDED");
  assert.equal(snapshot.outstandingBalance, "49.00");
  assert.equal(captureBodies.length, 0);
});

test("execute captures the exact balance and saves evidence", async () => {
  captureBodies.length = 0;
  const dir = await mkdtemp(join(tmpdir(), "recover-sandbox-"));
  const result = await run({
    SUBSCRIPTION_ID: "SUB-1",
    CWD: dir,
    ARGS: ["--execute", "--save"],
  });

  assert.equal(result.code, 0);
  assert.equal(captureBodies.length, 1);
  const body = JSON.parse(captureBodies[0]);
  assert.equal(body.capture_type, "OUTSTANDING_BALANCE");
  assert.equal(body.amount.value, "49.00");
  assert.equal(body.amount.currency_code, "USD");

  const files = await readdir(join(dir, "docs/evidence"));
  assert.equal(files.length, 1);
  await rm(dir, { recursive: true, force: true });
});

test("zero balance refuses to capture", async () => {
  captureBodies.length = 0;
  const result = await run({ SUBSCRIPTION_ID: "SUB-ZERO", ARGS: ["--execute"] });

  assert.equal(result.code, 2);
  assert.match(result.stderr, /Nothing to capture/);
  assert.equal(captureBodies.length, 0);
});

test("unknown subscription fails", async () => {
  const result = await run({ SUBSCRIPTION_ID: "NOPE" });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /get subscription failed: 404/);
});

test("live host is refused", async () => {
  const result = await run({
    SUBSCRIPTION_ID: "SUB-1",
    PAYPAL_API_BASE: "https://api-m.paypal.com",
  });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /Refusing non-sandbox PayPal base/);
});

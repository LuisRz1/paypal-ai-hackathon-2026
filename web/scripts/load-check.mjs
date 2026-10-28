import assert from "node:assert/strict";

// Run against a freshly started server: the mock recovery state is in memory.
const base = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const token = process.env.APPROVER_TOKEN ?? "secret";

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((p / 100) * (sorted.length - 1))];
}

async function timed(fn) {
  const start = performance.now();
  const result = await fn();
  return { ...result, ms: performance.now() - start };
}

function countStatuses(results) {
  const counts = {};
  for (const result of results) {
    counts[result.status] = (counts[result.status] ?? 0) + 1;
  }
  return counts;
}

const health = await Promise.all(
  Array.from({ length: 50 }, () =>
    timed(async () => {
      const response = await fetch(`${base}/api/health`);
      return { status: response.status };
    }),
  ),
);

const seed = await Promise.all(
  Array.from({ length: 50 }, () =>
    timed(async () => {
      const response = await fetch(`${base}/api/seed`);
      return { status: response.status };
    }),
  ),
);

const recoveries = await Promise.all(
  Array.from({ length: 20 }, () =>
    timed(async () => {
      const response = await fetch(`${base}/api/recover`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId: "SUB-1002" }),
      });
      const body = await response.json();
      return { status: response.status, proposalId: body.proposal?.id };
    }),
  ),
);

const winner = recoveries.find((result) => result.status === 200);
assert.ok(winner?.proposalId, "expected one proposal to win");

const approvals = await Promise.all(
  Array.from({ length: 20 }, () =>
    timed(async () => {
      const response = await fetch(`${base}/api/approve`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ proposalId: winner.proposalId }),
      });
      const body = await response.json();
      return { status: response.status, state: body.proposal?.status };
    }),
  ),
);

const eventId = `WH-LOAD-${Date.now()}`;
const webhooks = await Promise.all(
  Array.from({ length: 50 }, () =>
    timed(async () => {
      const response = await fetch(`${base}/api/webhooks/paypal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          event_type: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
        }),
      });
      const body = await response.json();
      return {
        status: response.status,
        received: body.received === true,
        duplicate: body.duplicate === true,
      };
    }),
  ),
);

const ledger = await (await fetch(`${base}/api/ledger`)).json();
const webhookEvents = ledger.events.filter(
  (event) => event.detail?.eventId === eventId,
);

const healthMs = health.map((result) => result.ms);
const seedMs = seed.map((result) => result.ms);
const recoverMs = recoveries.map((result) => result.ms);
const approveMs = approvals.map((result) => result.ms);
const webhookMs = webhooks.map((result) => result.ms);

console.log(JSON.stringify({
  health: { statuses: countStatuses(health), p50: percentile(healthMs, 50), p95: percentile(healthMs, 95) },
  seed: { statuses: countStatuses(seed), p50: percentile(seedMs, 50), p95: percentile(seedMs, 95) },
  recover: { statuses: countStatuses(recoveries), p50: percentile(recoverMs, 50), p95: percentile(recoverMs, 95) },
  approve: { statuses: countStatuses(approvals), p50: percentile(approveMs, 50), p95: percentile(approveMs, 95) },
  webhook: { statuses: countStatuses(webhooks), received: webhooks.filter((r) => r.received).length, duplicate: webhooks.filter((r) => r.duplicate).length, p50: percentile(webhookMs, 50), p95: percentile(webhookMs, 95) },
  ledgerWebhookEvents: webhookEvents.length,
}, null, 2));

assert.equal(recoveries.filter((result) => result.status === 200).length, 1);
assert.equal(approvals.filter((result) => result.status === 200).length, 1);
assert.equal(webhooks.filter((result) => result.received).length, 1);
assert.equal(webhookEvents.length, 1);

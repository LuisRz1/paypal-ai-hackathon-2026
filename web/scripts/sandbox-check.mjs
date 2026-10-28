import { createPayPalClient } from "../lib/paypal.ts";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const save = args.includes("--save");
const subscriptionId =
  process.env.SUBSCRIPTION_ID ?? args.find((arg) => !arg.startsWith("--"));

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const baseUrl = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

if (!clientId || !clientSecret) {
  console.error("Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.");
  process.exit(1);
}
if (!subscriptionId) {
  console.error("Missing SUBSCRIPTION_ID (env or first positional arg).");
  process.exit(1);
}

const client = createPayPalClient({
  baseUrl,
  clientId,
  clientSecret,
  allowLocal: process.env.PAYPAL_ALLOW_LOCAL === "true",
});

const subscription = await client.getSubscription(subscriptionId);
const balance = subscription?.billing_info?.outstanding_balance;
const snapshot = {
  at: new Date().toISOString(),
  environment: baseUrl,
  subscriptionId: subscription?.id,
  status: subscription?.status,
  outstandingBalance: balance?.value ?? null,
  currency: balance?.currency_code ?? null,
  failedPayments: subscription?.billing_info?.failed_payments_count ?? null,
  lastFailedPayment: subscription?.billing_info?.last_failed_payment ?? null,
};

console.log(JSON.stringify(snapshot, null, 2));

if (!execute) {
  console.log("\nDry run. Add --execute to capture the outstanding balance.");
  process.exit(0);
}
if (!balance || Number(balance.value) <= 0) {
  console.error("Nothing to capture: outstanding balance is zero or missing.");
  process.exit(2);
}

const capture = await client.captureOutstanding(subscriptionId, {
  amount: Number(balance.value),
  currency: balance.currency_code,
  note: "Outstanding balance recovered",
  requestId: crypto.randomUUID(),
});
console.log(JSON.stringify({ capture }, null, 2));

if (save) {
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("docs/evidence", { recursive: true });
  const path = `docs/evidence/sandbox-${snapshot.at.replace(/[:.]/g, "-")}.json`;
  await writeFile(path, JSON.stringify({ snapshot, capture }, null, 2));
  console.log(`Saved ${path}`);
}

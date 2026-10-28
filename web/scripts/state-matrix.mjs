import { nextAction } from "../lib/state-machine.ts";

const statuses = ["ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"];
const balances = [0, 19, 49];
const failures = [0, 1, 2, 3];
const thresholds = [0, 1, 2];
const currencies = ["USD", "EUR"];

let cases = 0;
const violations = [];

for (const status of statuses) {
  for (const outstanding_balance of balances) {
    for (const failed_payments_count of failures) {
      for (const threshold of thresholds) {
        for (const currency of currencies) {
          cases += 1;
          const subscription = {
            id: "SUB-M",
            customer: "Matrix",
            plan_id: "P-M",
            status,
            currency,
            failed_payments_count,
            outstanding_balance,
            next_billing_time: null,
            last_failed_payment: null,
          };
          const plan = { payment_failure_threshold: threshold, currency: "USD" };
          const action = nextAction(subscription, plan);

          if (status === "CANCELLED" && action.action !== "NONE") {
            violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
          }
          if (status === "EXPIRED" && action.action !== "ESCALATE") {
            violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
          }
          if (currency !== "USD" && status !== "CANCELLED" && status !== "EXPIRED" && action.action !== "BLOCK") {
            violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
          }
          if (action.action === "CAPTURE") {
            if (outstanding_balance <= 0) violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
            if (currency !== "USD") violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
            if (!["ACTIVE", "SUSPENDED"].includes(status)) violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
            if (action.amount !== outstanding_balance) violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
          }
          if (status === "SUSPENDED" && outstanding_balance === 0 && currency === "USD" && action.action !== "ACTIVATE") {
            violations.push({ status, outstanding_balance, failed_payments_count, threshold, currency, action });
          }
        }
      }
    }
  }
}

console.log(`cases: ${cases}`);
console.log(`violations: ${violations.length}`);
for (const violation of violations.slice(0, 10)) {
  console.log(JSON.stringify(violation));
}

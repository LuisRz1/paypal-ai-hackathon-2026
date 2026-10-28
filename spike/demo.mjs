import fs from "node:fs";
import assert from "node:assert/strict";
import { nextAction } from "./state_machine.mjs";

const seed = JSON.parse(fs.readFileSync(new URL("./seed.json", import.meta.url), "utf8"));

const expected = {
  "SUB-1001": "NONE",
  "SUB-1002": "CAPTURE",
  "SUB-1003": "WAIT",
  "SUB-1004": "ESCALATE",
};

console.log("id        status     outstanding  action    reason");
console.log("---------------------------------------------------------");
for (const sub of seed.subscriptions) {
  const plan = seed.plans[sub.plan_id];
  const result = nextAction(sub, plan);
  console.log(
    `${sub.id.padEnd(9)} ${sub.status.padEnd(10)} $${String(sub.outstanding_balance).padEnd(11)} ${result.action.padEnd(9)} ${result.reason}`,
  );
  assert.equal(result.action, expected[sub.id], `${sub.id} action`);
}

console.log("\nDemo path: SUB-1002 -> CAPTURE $49 -> after capture SUSPENDED/0 -> ACTIVATE");
console.log("All seed assertions passed.");

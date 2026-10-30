import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_POLICY } from "./policy.ts";
import { simulatePolicy } from "./simulation.ts";

test("baseline simulation executes all 288 cases without violations", () => {
  const result = simulatePolicy(DEFAULT_POLICY);
  assert.equal(result.total, 288);
  assert.equal(result.passed, 288);
  assert.equal(result.violations.length, 0);
  assert.equal(result.cases.length, 288);
  assert.ok(result.invariants.every((invariant) => invariant.failed === 0));
  assert.equal(Object.values(result.actionCounts).reduce((sum, count) => sum + count, 0), 288);
});

test("capture ceiling escalates rather than exceeding the merchant limit", () => {
  const result = simulatePolicy({ ...DEFAULT_POLICY, maxCaptureAmount: 20 });
  assert.equal(result.violations.length, 0);
  assert.ok(result.actionCounts.ESCALATE > 0);
  assert.ok(
    result.cases.every(
      (entry) => entry.action.action !== "CAPTURE" || entry.action.amount <= 20,
    ),
  );
});

test("an explicit no-capture mandate suppresses every capture safely", () => {
  const result = simulatePolicy({
    ...DEFAULT_POLICY,
    rules: [
      {
        id: "no-capture",
        reason: "Merchant prohibited capture",
        action: "BLOCK",
        when: { outstanding: "POSITIVE" },
      },
    ],
  });
  assert.equal(result.actionCounts.CAPTURE, 0);
  assert.equal(result.violations.length, 0);
});

test("simulation reports attempted unsafe custom captures", () => {
  const result = simulatePolicy({
    ...DEFAULT_POLICY,
    rules: [
      {
        id: "unsafe-capture",
        reason: "Attempt to capture everywhere",
        action: "CAPTURE",
        when: {},
      },
    ],
  });
  assert.ok(result.violations.length > 0);
  assert.ok(result.violations.some((violation) => violation.code === "CAPTURE_ZERO_BALANCE"));
  assert.ok(result.violations.some((violation) => violation.code === "CAPTURE_NOT_BASELINE"));
  assert.ok(result.cases.filter((entry) => !entry.passed).every((entry) => entry.action.action === "BLOCK"));
});

test("terminal-state safety cannot be overridden by custom rules", () => {
  const result = simulatePolicy({
    ...DEFAULT_POLICY,
    rules: [
      {
        id: "terminal-capture",
        reason: "Attempt terminal capture",
        action: "CAPTURE",
        when: { status: ["CANCELLED", "EXPIRED"] },
      },
    ],
  });
  assert.equal(result.violations.length, 0);
  assert.ok(
    result.cases
      .filter((entry) => entry.subscription.status === "CANCELLED")
      .every((entry) => entry.action.action === "NONE"),
  );
  assert.ok(
    result.cases
      .filter((entry) => entry.subscription.status === "EXPIRED")
      .every((entry) => entry.action.action === "ESCALATE"),
  );
});

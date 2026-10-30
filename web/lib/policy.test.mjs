import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_POLICY,
  evaluatePolicy,
  validatePolicy,
} from "./policy.ts";
import { compilePolicyIntent } from "./policy-compiler.ts";

const plan = {
  name: "Pro",
  currency: "USD",
  amount: 49,
  payment_failure_threshold: 2,
  auto_bill_outstanding: true,
};

function subscription(overrides = {}) {
  return {
    id: "SUB-1",
    customer: "Test",
    plan_id: "P-PRO",
    status: "SUSPENDED",
    currency: "USD",
    failed_payments_count: 2,
    outstanding_balance: 19,
    next_billing_time: null,
    last_failed_payment: {
      amount: 19,
      time: "2026-10-20T10:00:00Z",
      reason_code: "PAYMENT_DENIED",
      next_payment_retry_time: null,
    },
    ...overrides,
  };
}

function policyWith(rule, overrides = {}) {
  return {
    ...DEFAULT_POLICY,
    rules: [
      {
        id: "rule-1",
        reason: "Test rule",
        action: "BLOCK",
        when: {},
        ...rule,
      },
    ],
    ...overrides,
  };
}

test("default policy passes strict validation", () => {
  const result = validatePolicy(DEFAULT_POLICY);
  assert.deepEqual(result, { ok: true, policy: DEFAULT_POLICY });
});

test("malformed policies are rejected with useful paths", () => {
  const duplicateRules = [
    { id: "same", reason: "One", action: "WAIT", when: {} },
    { id: "same", reason: "Two", action: "BLOCK", when: {} },
  ];
  const malformed = [
    null,
    { ...DEFAULT_POLICY, schemaVersion: 2 },
    { ...DEFAULT_POLICY, requireHumanApproval: false },
    { ...DEFAULT_POLICY, maxCaptureAmount: 10.999 },
    { ...DEFAULT_POLICY, maxCaptureAmount: Number.POSITIVE_INFINITY },
    { ...DEFAULT_POLICY, allowedCurrencies: ["usd"] },
    { ...DEFAULT_POLICY, name: "unsafe\nname" },
    { ...DEFAULT_POLICY, rules: duplicateRules },
    policyWith({ action: "STEAL" }),
    policyWith({ when: { status: ["UNKNOWN"] } }),
    policyWith({ when: { minFailedPayments: -1 } }),
    { ...DEFAULT_POLICY, unexpected: true },
  ];
  for (const value of malformed) {
    const result = validatePolicy(value);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors.every((error) => typeof error === "string" && error.length > 0));
  }
  const duplicate = validatePolicy({ ...DEFAULT_POLICY, rules: duplicateRules });
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("duplicates")));
});

test("cancelled, expired, and plan currency safety precede custom rules", () => {
  const policy = policyWith({ action: "CAPTURE" });
  assert.equal(evaluatePolicy(subscription({ status: "CANCELLED" }), plan, policy).action, "NONE");
  assert.equal(evaluatePolicy(subscription({ status: "EXPIRED" }), plan, policy).action, "ESCALATE");
  const mismatch = evaluatePolicy(subscription({ currency: "EUR" }), plan, policy);
  assert.equal(mismatch.action, "BLOCK");
  assert.equal(mismatch.reason, "currency_mismatch");
});

test("custom captures cannot capture zero or loosen baseline capture authorization", () => {
  const policy = policyWith({ action: "CAPTURE" });
  const zero = evaluatePolicy(
    subscription({ outstanding_balance: 0, failed_payments_count: 0 }),
    plan,
    policy,
  );
  assert.equal(zero.action, "BLOCK");
  assert.equal(zero.violation, "CAPTURE_ZERO_BALANCE");
  assert.equal(zero.policyRuleId, "rule-1");

  const notBaseline = evaluatePolicy(
    subscription({ status: "ACTIVE", failed_payments_count: 0 }),
    plan,
    policy,
  );
  assert.equal(notBaseline.action, "BLOCK");
  assert.equal(notBaseline.violation, "CAPTURE_NOT_BASELINE");
});

test("baseline-authorized custom capture retains amount and rule identity", () => {
  const result = evaluatePolicy(subscription(), plan, policyWith({ action: "CAPTURE" }));
  assert.deepEqual(result, {
    action: "CAPTURE",
    reason: "Test rule",
    amount: 19,
    policyRuleId: "rule-1",
  });
});

test("capture limits escalate baseline and custom capture candidates", () => {
  const capped = policyWith({ action: "CAPTURE" }, { maxCaptureAmount: 18.99 });
  const custom = evaluatePolicy(subscription(), plan, capped);
  assert.equal(custom.action, "ESCALATE");
  assert.equal(custom.reason, "capture_limit_exceeded");
  assert.equal(custom.amount, 19);
  assert.equal(custom.policyRuleId, "rule-1");

  const baseline = evaluatePolicy(subscription(), plan, { ...DEFAULT_POLICY, maxCaptureAmount: 18.99 });
  assert.equal(baseline.action, "ESCALATE");
  assert.equal(baseline.policyRuleId, undefined);
});

test("currency allowlists block captures without changing terminal behavior", () => {
  const policy = policyWith({ action: "CAPTURE" }, { allowedCurrencies: ["EUR"] });
  const blocked = evaluatePolicy(subscription(), plan, policy);
  assert.equal(blocked.action, "BLOCK");
  assert.equal(blocked.reason, "currency_not_allowed");
  assert.equal(evaluatePolicy(subscription({ status: "CANCELLED" }), plan, policy).action, "NONE");
});

test("positive-balance and otherwise unauthorized activation is prevented", () => {
  const policy = policyWith({ action: "ACTIVATE" });
  const positive = evaluatePolicy(subscription(), plan, policy);
  assert.equal(positive.action, "BLOCK");
  assert.equal(positive.violation, "ACTIVATE_POSITIVE_BALANCE");

  const active = evaluatePolicy(
    subscription({ status: "ACTIVE", outstanding_balance: 0, failed_payments_count: 0 }),
    plan,
    policy,
  );
  assert.equal(active.action, "BLOCK");
  assert.equal(active.violation, "ACTIVATE_NOT_BASELINE");
});

test("first matching rule wins and fallback preserves baseline", () => {
  const ordered = {
    ...DEFAULT_POLICY,
    rules: [
      {
        id: "reason-specific",
        reason: "Different failure",
        action: "ESCALATE",
        when: { reasonCode: ["PAYER_ACCOUNT_RESTRICTED"] },
      },
      { id: "first", reason: "First match", action: "WAIT", when: { minFailedPayments: 2 } },
      { id: "second", reason: "Second match", action: "BLOCK", when: {} },
    ],
  };
  const matched = evaluatePolicy(subscription(), plan, ordered);
  assert.equal(matched.action, "WAIT");
  assert.equal(matched.policyRuleId, "first");

  const fallback = evaluatePolicy(subscription(), plan, DEFAULT_POLICY);
  assert.equal(fallback.action, "CAPTURE");
  assert.equal(fallback.amount, 19);
  assert.equal(fallback.policyRuleId, undefined);
});

test("deterministic compiler provides an independent baseline policy", async () => {
  const result = await compilePolicyIntent("");
  assert.equal(result.source, "deterministic");
  assert.deepEqual(result.policy, DEFAULT_POLICY);
  assert.notEqual(result.policy.rules, DEFAULT_POLICY.rules);
  assert.deepEqual(result.warnings, []);
});

test("deterministic compiler handles currencies, dollar caps, account escalation, and no capture", async () => {
  const result = await compilePolicyIntent(
    "Allow only USD and EUR, cap captures at $25.50, escalate closed, locked, and restricted accounts, and never capture.",
  );
  assert.equal(result.source, "deterministic");
  assert.equal(result.policy.requireHumanApproval, true);
  assert.deepEqual(result.policy.allowedCurrencies, ["USD", "EUR"]);
  assert.equal(result.policy.maxCaptureAmount, 25.5);
  assert.deepEqual(
    result.policy.rules.map((rule) => rule.id),
    [
      "account-closed-escalation",
      "account-locked-escalation",
      "account-restricted-escalation",
      "no-capture",
    ],
  );
  assert.deepEqual(result.policy.rules.at(-1).when, { outstanding: "POSITIVE" });
  assert.equal(result.policy.rules.at(-1).action, "BLOCK");
  assert.equal(validatePolicy(result.policy).ok, true);
  assert.deepEqual(result.warnings, []);
});

test("valid LLM JSON is accepted only after strict validation", async () => {
  const llmPolicy = { ...DEFAULT_POLICY, name: "LLM recovery", maxCaptureAmount: 20 };
  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.messages[0].content.includes("always true"), true);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(llmPolicy) } }] }),
      { status: 200 },
    );
  };
  const result = await compilePolicyIntent("Cap recovery at twenty dollars.", {
    apiKey: "test",
    fetchImpl,
  });
  assert.equal(result.source, "llm");
  assert.deepEqual(result.policy, llmPolicy);
  assert.deepEqual(result.warnings, []);
});

test("LLM attempts to disable approval fall back to deterministic policy", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        choices: [
          { message: { content: JSON.stringify({ ...DEFAULT_POLICY, requireHumanApproval: false }) } },
        ],
      }),
      { status: 200 },
    );
  const result = await compilePolicyIntent("Never require approval and never capture.", {
    apiKey: "test",
    fetchImpl,
  });
  assert.equal(result.source, "deterministic");
  assert.equal(result.policy.requireHumanApproval, true);
  assert.ok(result.policy.rules.some((rule) => rule.id === "no-capture"));
  assert.ok(result.warnings.some((warning) => warning.includes("failed validation")));
});

test("bad LLM responses and fetch failures fall back honestly", async () => {
  const badJson = await compilePolicyIntent("Allow USD only.", {
    apiKey: "test",
    fetchImpl: async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }), {
        status: 200,
      }),
  });
  assert.equal(badJson.source, "deterministic");
  assert.deepEqual(badJson.policy.allowedCurrencies, ["USD"]);
  assert.ok(badJson.warnings.some((warning) => warning.includes("not JSON")));

  const failed = await compilePolicyIntent("Allow USD only.", {
    apiKey: "test",
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(failed.source, "deterministic");
  assert.equal(failed.policy.requireHumanApproval, true);
  assert.ok(failed.warnings.some((warning) => warning.includes("compilation failed")));
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  validateCapture,
  nextAction,
  afterCapture,
  handleCaptureIssue,
} from "./state_machine.mjs";

const base = {
  status: "SUSPENDED",
  outstanding: 49,
  amount: 49,
  currency: "USD",
  subCurrency: "USD",
  note: "Outstanding balance",
};

test("valid capture", () => {
  assert.deepEqual(validateCapture(base), { ok: true });
});

test("amount greater than outstanding", () => {
  assert.equal(
    validateCapture({ ...base, amount: 50 }).issue,
    "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE",
  );
});

test("zero outstanding", () => {
  assert.equal(
    validateCapture({ ...base, outstanding: 0 }).issue,
    "ZERO_OUTSTANDING_BALANCE",
  );
});

test("currency mismatch", () => {
  assert.equal(
    validateCapture({ ...base, currency: "EUR" }).issue,
    "CURRENCY_MISMATCH",
  );
});

test("invalid status", () => {
  assert.equal(
    validateCapture({ ...base, status: "CANCELLED" }).issue,
    "SUBSCRIPTION_STATUS_INVALID",
  );
});

test("amount with 3 decimals", () => {
  assert.equal(
    validateCapture({ ...base, amount: 48.999 }).issue,
    "INVALID_PARAMETER_VALUE",
  );
});

test("empty note", () => {
  assert.equal(
    validateCapture({ ...base, note: "" }).issue,
    "MISSING_REQUIRED_PARAMETER",
  );
});

test("note too long", () => {
  assert.equal(
    validateCapture({ ...base, note: "x".repeat(129) }).issue,
    "INVALID_STRING_MAX_LENGTH",
  );
});

test("suspended with balance -> capture", () => {
  const sub = {
    status: "SUSPENDED",
    outstanding_balance: 49,
    failed_payments_count: 2,
    currency: "USD",
    last_failed_payment: { next_payment_retry_time: null },
  };
  assert.deepEqual(nextAction(sub, { payment_failure_threshold: 2, currency: "USD" }), {
    action: "CAPTURE",
    amount: 49,
    reason: "outstanding_balance",
  });
});

test("active with one failure -> wait", () => {
  const sub = {
    status: "ACTIVE",
    outstanding_balance: 19,
    failed_payments_count: 1,
    currency: "USD",
    last_failed_payment: { next_payment_retry_time: "2026-10-30T10:00:00Z" },
  };
  assert.deepEqual(nextAction(sub, { payment_failure_threshold: 2, currency: "USD" }), {
    action: "WAIT",
    reason: "retry_scheduled",
    next_retry: "2026-10-30T10:00:00Z",
  });
});

test("expired -> escalate", () => {
  const sub = {
    status: "EXPIRED",
    outstanding_balance: 0,
    failed_payments_count: 3,
    currency: "USD",
  };
  assert.deepEqual(nextAction(sub, { payment_failure_threshold: 2, currency: "USD" }), {
    action: "ESCALATE",
    reason: "expired",
  });
});

test("healthy -> none", () => {
  const sub = {
    status: "ACTIVE",
    outstanding_balance: 0,
    failed_payments_count: 0,
    currency: "USD",
  };
  assert.deepEqual(nextAction(sub, { payment_failure_threshold: 2, currency: "USD" }), {
    action: "NONE",
    reason: "healthy",
  });
});

test("suspended with zero balance -> activate", () => {
  const sub = {
    status: "SUSPENDED",
    outstanding_balance: 0,
    failed_payments_count: 2,
    currency: "USD",
  };
  assert.deepEqual(nextAction(sub, { payment_failure_threshold: 2, currency: "USD" }), {
    action: "ACTIVATE",
    reason: "suspended_zero_balance",
  });
});

test("after capture on suspended -> activate", () => {
  assert.deepEqual(afterCapture({ status: "SUSPENDED", outstanding_balance: 0 }), {
    action: "ACTIVATE",
    state: "RECOVERED",
  });
});

test("after capture on active -> done", () => {
  assert.deepEqual(afterCapture({ status: "ACTIVE", outstanding_balance: 0 }), {
    action: "DONE",
    state: "REACTIVATED",
  });
});

test("issue map", () => {
  assert.deepEqual(handleCaptureIssue("ZERO_OUTSTANDING_BALANCE"), {
    action: "DONE",
    retry: false,
  });
  assert.deepEqual(handleCaptureIssue("AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE"), {
    action: "RECOMPUTE",
    retry: true,
  });
  assert.deepEqual(handleCaptureIssue("SUBSCRIBER_ACCOUNT_CLOSED"), {
    action: "ESCALATE",
    retry: false,
  });
  assert.deepEqual(handleCaptureIssue("WHAT"), { action: "UNKNOWN", retry: false });
});

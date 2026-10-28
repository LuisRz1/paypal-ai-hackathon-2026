// Pure state machine for the Recover flow. No PayPal calls, no I/O.
// This is the first executable artifact: it lets us test the rules before UI or sandbox.

export const CAPTURE_STATUSES = new Set(["ACTIVE", "SUSPENDED", "EXPIRED"]);

export function validateCapture({
  status,
  outstanding,
  amount,
  currency,
  subCurrency,
  note,
}) {
  if (!note || note.length === 0) {
    return { ok: false, issue: "MISSING_REQUIRED_PARAMETER", field: "note" };
  }
  if (note.length > 128) {
    return { ok: false, issue: "INVALID_STRING_MAX_LENGTH", field: "note" };
  }
  if (!CAPTURE_STATUSES.has(status)) {
    return { ok: false, issue: "SUBSCRIPTION_STATUS_INVALID" };
  }
  if (outstanding <= 0) {
    return { ok: false, issue: "ZERO_OUTSTANDING_BALANCE" };
  }
  if (currency !== subCurrency) {
    return { ok: false, issue: "CURRENCY_MISMATCH" };
  }
  if (amount > outstanding) {
    return { ok: false, issue: "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE" };
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, issue: "INVALID_PARAMETER_VALUE", field: "amount" };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
    return { ok: false, issue: "INVALID_PARAMETER_VALUE", field: "amount" };
  }
  return { ok: true };
}

export function nextAction(sub, plan) {
  const threshold = plan.payment_failure_threshold ?? 0;

  if (sub.status === "CANCELLED") return { action: "NONE", reason: "cancelled" };
  if (sub.status === "EXPIRED") return { action: "ESCALATE", reason: "expired" };
  if (sub.currency !== plan.currency) return { action: "BLOCK", reason: "currency_mismatch" };

  if (sub.outstanding_balance > 0 && threshold > 0 && sub.failed_payments_count >= threshold) {
    return { action: "CAPTURE", amount: sub.outstanding_balance, reason: "outstanding_balance" };
  }
  if (sub.status === "SUSPENDED" && sub.outstanding_balance > 0) {
    return { action: "CAPTURE", amount: sub.outstanding_balance, reason: "suspended_with_balance" };
  }
  if (sub.status === "SUSPENDED" && sub.outstanding_balance === 0) {
    return { action: "ACTIVATE", reason: "suspended_zero_balance" };
  }
  if (sub.failed_payments_count > 0) {
    return {
      action: "WAIT",
      reason: "retry_scheduled",
      next_retry: sub.last_failed_payment?.next_payment_retry_time ?? null,
    };
  }
  return { action: "NONE", reason: "healthy" };
}

export function afterCapture({ status, outstanding_balance }) {
  if (status === "ACTIVE" && outstanding_balance === 0) {
    return { action: "DONE", state: "REACTIVATED" };
  }
  if (status === "SUSPENDED" && outstanding_balance === 0) {
    return { action: "ACTIVATE", state: "RECOVERED" };
  }
  if (status === "EXPIRED") return { action: "ESCALATE", state: "EXPIRED" };
  return { action: "VERIFY", state: "UNKNOWN" };
}

const ISSUE_MAP = {
  ZERO_OUTSTANDING_BALANCE: { action: "DONE", retry: false },
  AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE: { action: "RECOMPUTE", retry: true },
  CURRENCY_MISMATCH: { action: "BLOCK", retry: false },
  SUBSCRIPTION_STATUS_INVALID: { action: "REFRESH", retry: false },
  SUBSCRIBER_ACCOUNT_LOCKED: { action: "ESCALATE", retry: false },
  SUBSCRIBER_ACCOUNT_CLOSED: { action: "ESCALATE", retry: false },
  SUBSCRIBER_ACCOUNT_RESTRICTED: { action: "ESCALATE", retry: false },
  USER_ACCOUNT_CLOSED: { action: "ESCALATE", retry: false },
  MISSING_REQUIRED_PARAMETER: { action: "BUG", retry: false },
  INVALID_PARAMETER_VALUE: { action: "BUG", retry: false },
  INVALID_STRING_MAX_LENGTH: { action: "BUG", retry: false },
};

export function handleCaptureIssue(issue) {
  return ISSUE_MAP[issue] ?? { action: "UNKNOWN", retry: false };
}

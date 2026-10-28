export type SubscriptionStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export interface Subscription {
  id: string;
  customer: string;
  plan_id: string;
  status: SubscriptionStatus;
  currency: string;
  failed_payments_count: number;
  outstanding_balance: number;
  next_billing_time: string | null;
  last_failed_payment: {
    amount: number;
    time: string;
    reason_code: string;
    next_payment_retry_time: string | null;
  } | null;
}

export interface Plan {
  name: string;
  currency: string;
  amount: number;
  payment_failure_threshold: number;
  auto_bill_outstanding: boolean;
}

export interface Action {
  action: "NONE" | "WAIT" | "CAPTURE" | "ACTIVATE" | "ESCALATE" | "BLOCK";
  reason: string;
  amount?: number;
  next_retry?: string | null;
}

export function nextAction(sub: Subscription, plan: Plan): Action {
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

export function validateCapture({
  status,
  outstanding,
  amount,
  currency,
  subCurrency,
  note,
}: {
  status: SubscriptionStatus;
  outstanding: number;
  amount: number;
  currency: string;
  subCurrency: string;
  note: string;
}): { ok: boolean; issue?: string; field?: string } {
  if (!note || note.length === 0) return { ok: false, issue: "MISSING_REQUIRED_PARAMETER", field: "note" };
  if (note.length > 128) return { ok: false, issue: "INVALID_STRING_MAX_LENGTH", field: "note" };
  if (!["ACTIVE", "SUSPENDED", "EXPIRED"].includes(status)) return { ok: false, issue: "SUBSCRIPTION_STATUS_INVALID" };
  if (outstanding <= 0) return { ok: false, issue: "ZERO_OUTSTANDING_BALANCE" };
  if (currency !== subCurrency) return { ok: false, issue: "CURRENCY_MISMATCH" };
  if (amount > outstanding) return { ok: false, issue: "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, issue: "INVALID_PARAMETER_VALUE", field: "amount" };
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) return { ok: false, issue: "INVALID_PARAMETER_VALUE", field: "amount" };
  return { ok: true };
}

export function afterCapture({
  status,
  outstanding_balance,
}: {
  status: SubscriptionStatus;
  outstanding_balance: number;
}): { action: string; state: string } {
  if (status === "ACTIVE" && outstanding_balance === 0) return { action: "DONE", state: "REACTIVATED" };
  if (status === "SUSPENDED" && outstanding_balance === 0) return { action: "ACTIVATE", state: "RECOVERED" };
  if (status === "EXPIRED") return { action: "ESCALATE", state: "EXPIRED" };
  return { action: "VERIFY", state: "UNKNOWN" };
}

export interface CaptureResult {
  ok: boolean;
  captureId?: string;
  status?: string;
  issue?: string;
}

export function captureOutstandingBalance(input: {
  subscriptionId: string;
  amount: number;
  currency: string;
  note: string;
  requestId: string;
  scenario?: string;
}): CaptureResult {
  const scenario = input.scenario;

  if (scenario === "ZERO_OUTSTANDING_BALANCE") {
    return { ok: false, issue: "ZERO_OUTSTANDING_BALANCE" };
  }
  if (scenario === "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE") {
    return { ok: false, issue: "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE" };
  }
  if (scenario === "CURRENCY_MISMATCH") {
    return { ok: false, issue: "CURRENCY_MISMATCH" };
  }
  if (scenario === "SUBSCRIPTION_STATUS_INVALID") {
    return { ok: false, issue: "SUBSCRIPTION_STATUS_INVALID" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_CLOSED") {
    return { ok: false, issue: "SUBSCRIBER_ACCOUNT_CLOSED" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_LOCKED") {
    return { ok: false, issue: "SUBSCRIBER_ACCOUNT_LOCKED" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_RESTRICTED") {
    return { ok: false, issue: "SUBSCRIBER_ACCOUNT_RESTRICTED" };
  }
  if (scenario === "USER_ACCOUNT_CLOSED") {
    return { ok: false, issue: "USER_ACCOUNT_CLOSED" };
  }

  // A deterministic id keeps a retry of the same proposal idempotent in the mock.
  return {
    ok: true,
    captureId: `CAP-${input.requestId.slice(0, 8)}`,
    status: "COMPLETED",
  };
}

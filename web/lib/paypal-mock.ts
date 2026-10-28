export interface CaptureResult {
  ok: boolean;
  captureId?: string;
  status?: string;
  issue?: string;
  httpStatus?: number;
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

  if (scenario === "UNCERTAIN") {
    return { ok: false, issue: "TIMEOUT", httpStatus: 500 };
  }
  if (scenario === "ZERO_OUTSTANDING_BALANCE") {
    return { ok: false, httpStatus: 422, issue: "ZERO_OUTSTANDING_BALANCE" };
  }
  if (scenario === "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE") {
    return { ok: false, httpStatus: 422, issue: "AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE" };
  }
  if (scenario === "CURRENCY_MISMATCH") {
    return { ok: false, httpStatus: 422, issue: "CURRENCY_MISMATCH" };
  }
  if (scenario === "SUBSCRIPTION_STATUS_INVALID") {
    return { ok: false, httpStatus: 422, issue: "SUBSCRIPTION_STATUS_INVALID" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_CLOSED") {
    return { ok: false, httpStatus: 422, issue: "SUBSCRIBER_ACCOUNT_CLOSED" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_LOCKED") {
    return { ok: false, httpStatus: 422, issue: "SUBSCRIBER_ACCOUNT_LOCKED" };
  }
  if (scenario === "SUBSCRIBER_ACCOUNT_RESTRICTED") {
    return { ok: false, httpStatus: 422, issue: "SUBSCRIBER_ACCOUNT_RESTRICTED" };
  }
  if (scenario === "USER_ACCOUNT_CLOSED") {
    return { ok: false, httpStatus: 422, issue: "USER_ACCOUNT_CLOSED" };
  }

  // A deterministic id keeps a retry of the same proposal idempotent in the mock.
  return {
    ok: true,
    captureId: `CAP-${input.requestId.slice(0, 8)}`,
    status: "COMPLETED",
  };
}

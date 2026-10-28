import test from "node:test";
import assert from "node:assert/strict";
import { explainFailure } from "./explain.ts";

test("payment denied maps to capture", () => {
  const result = explainFailure("PAYMENT_DENIED");
  assert.equal(result.reasonCode, "PAYMENT_DENIED");
  assert.equal(result.recommendedAction, "CAPTURE");
});

test("payer restricted maps to escalate", () => {
  const result = explainFailure("PAYER_ACCOUNT_RESTRICTED");
  assert.equal(result.recommendedAction, "ESCALATE");
  assert.equal(result.confidence, "high");
});

test("sending limit maps to plan change", () => {
  const result = explainFailure("SENDING_LIMIT_EXCEEDED");
  assert.equal(result.recommendedAction, "CHANGE_PLAN");
});

test("internal error maps to wait", () => {
  const result = explainFailure("INTERNAL_SERVER_ERROR");
  assert.equal(result.recommendedAction, "WAIT");
});

test("unknown falls back safely", () => {
  const result = explainFailure(null);
  assert.equal(result.reasonCode, "UNKNOWN");
  assert.equal(result.recommendedAction, "ESCALATE");
  assert.equal(result.confidence, "low");
});

test("new code falls back safely", () => {
  const result = explainFailure("SOMETHING_NEW");
  assert.equal(result.reasonCode, "SOMETHING_NEW");
  assert.equal(result.recommendedAction, "ESCALATE");
});

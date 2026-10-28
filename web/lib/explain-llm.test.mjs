import test from "node:test";
import assert from "node:assert/strict";
import { createExplainer } from "./explain-llm.ts";

const subscription = {
  id: "SUB-1",
  customer: "Test",
  plan_id: "P-PRO",
  status: "SUSPENDED",
  currency: "USD",
  failed_payments_count: 2,
  outstanding_balance: 49,
  next_billing_time: null,
  last_failed_payment: {
    amount: 49,
    time: "2026-10-20T10:00:00Z",
    reason_code: "PAYMENT_DENIED",
    next_payment_retry_time: null,
  },
};

test("no key returns deterministic explanation", async () => {
  const explainer = createExplainer();
  const result = await explainer.explain(subscription);
  assert.equal(result.reasonCode, "PAYMENT_DENIED");
  assert.equal(result.recommendedAction, "CAPTURE");
});

test("valid model answer is merged", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Card was declined",
                likelyCause: "Issuer refusal",
                recommendedAction: "PAUSE",
                confidence: "medium",
                playbook: "Ask the buyer to update the funding source.",
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );

  const explainer = createExplainer({ apiKey: "test", fetchImpl });
  const result = await explainer.explain(subscription);
  assert.equal(result.summary, "Card was declined");
  assert.equal(result.recommendedAction, "PAUSE");
  assert.equal(result.reasonCode, "PAYMENT_DENIED");
});

test("invalid action falls back", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "x",
                likelyCause: "y",
                recommendedAction: "STEAL_MONEY",
                confidence: "certain",
                playbook: "z",
              }),
            },
          },
        ],
      }),
      { status: 200 },
    );

  const explainer = createExplainer({ apiKey: "test", fetchImpl });
  const result = await explainer.explain(subscription);
  assert.equal(result.recommendedAction, "CAPTURE");
  assert.equal(result.confidence, "medium");
});

test("bad JSON returns fallback", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: "not json" } }] }),
      { status: 200 },
    );

  const explainer = createExplainer({ apiKey: "test", fetchImpl });
  const result = await explainer.explain(subscription);
  assert.equal(result.summary, "PayPal declined the payment");
});

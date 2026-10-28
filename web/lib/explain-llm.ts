import { explainFailure, type Explanation, type RecoveryAction } from "./explain";
import type { Subscription } from "./state-machine";

const ACTIONS: Record<string, true> = {
  CAPTURE: true,
  WAIT: true,
  CHANGE_PLAN: true,
  PAUSE: true,
  ESCALATE: true,
};

const CONFIDENCE: Record<string, true> = {
  high: true,
  medium: true,
  low: true,
};

export interface ExplainerConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export function createExplainer(config: ExplainerConfig = {}) {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function explain(subscription: Subscription): Promise<Explanation> {
    const fallback = explainFailure(subscription.last_failed_payment?.reason_code ?? null);

    if (!config.apiKey) {
      return fallback;
    }

    try {
      const response = await fetchImpl(
        `${config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          signal: AbortSignal.timeout(8_000),
          body: JSON.stringify({
            model: config.model ?? "gpt-4o-mini",
            temperature: 0,
            max_tokens: 300,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are a PayPal subscription recovery analyst. Return JSON only with summary, likelyCause, recommendedAction (CAPTURE, WAIT, CHANGE_PLAN, PAUSE, ESCALATE), confidence (high, medium, low) and playbook. Do not invent amounts or payment states.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  reasonCode: fallback.reasonCode,
                  status: subscription.status,
                  outstandingBalance: subscription.outstanding_balance,
                  failedPayments: subscription.failed_payments_count,
                  currency: subscription.currency,
                }),
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        return fallback;
      }

      const payload = await response.json();
      const raw = payload?.choices?.[0]?.message?.content;
      if (typeof raw !== "string") {
        return fallback;
      }

      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const recommendedAction: RecoveryAction =
        typeof parsed.recommendedAction === "string" && ACTIONS[parsed.recommendedAction]
          ? (parsed.recommendedAction as RecoveryAction)
          : fallback.recommendedAction;
      const confidence: Explanation["confidence"] =
        typeof parsed.confidence === "string" && CONFIDENCE[parsed.confidence]
          ? (parsed.confidence as Explanation["confidence"])
          : fallback.confidence;

      return {
        reasonCode: fallback.reasonCode,
        summary:
          typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
        likelyCause:
          typeof parsed.likelyCause === "string"
            ? parsed.likelyCause
            : fallback.likelyCause,
        recommendedAction,
        confidence,
        playbook:
          typeof parsed.playbook === "string" ? parsed.playbook : fallback.playbook,
      };
    } catch {
      return fallback;
    }
  }

  return { explain };
}

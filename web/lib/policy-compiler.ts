import {
  DEFAULT_POLICY,
  validatePolicy,
  type RecoveryPolicy,
  type RecoveryPolicyRule,
} from "./policy";

export interface PolicyCompilerConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export interface PolicyCompilation {
  policy: RecoveryPolicy;
  source: "deterministic" | "llm";
  warnings: string[];
}

const KNOWN_CURRENCIES: Record<string, true> = {
  AUD: true,
  BRL: true,
  CAD: true,
  CHF: true,
  CZK: true,
  DKK: true,
  EUR: true,
  GBP: true,
  HKD: true,
  HUF: true,
  ILS: true,
  INR: true,
  JPY: true,
  MXN: true,
  MYR: true,
  NOK: true,
  NZD: true,
  PHP: true,
  PLN: true,
  SEK: true,
  SGD: true,
  THB: true,
  TWD: true,
  USD: true,
};

function compileDeterministic(intent: string): PolicyCompilation {
  const policy: RecoveryPolicy = {
    ...DEFAULT_POLICY,
    allowedCurrencies: null,
    rules: [],
  };
  const warnings: string[] = [];
  let recognized = false;

  if (/(?:currenc|allow|accept|support|only)/i.test(intent)) {
    const codes = intent.toUpperCase().match(/\b[A-Z]{3}\b/g) ?? [];
    const allowed = new Set<string>();
    for (const code of codes) {
      if (KNOWN_CURRENCIES[code]) allowed.add(code);
    }
    if (allowed.size > 0) {
      policy.allowedCurrencies = [...allowed];
      recognized = true;
    }
  }

  if (/(?:cap|limit|max(?:imum)?)/i.test(intent)) {
    const amountMatch =
      intent.match(/\$\s*(\d+(?:\.\d+)?|\.\d+)/) ??
      intent.match(/(\d+(?:\.\d+)?|\.\d+)\s*(?:USD|dollars?)/i);
    if (amountMatch) {
      recognized = true;
      const rawAmount = amountMatch[1];
      const amount = Number(rawAmount);
      if (
        /^(?:\d+|\d+\.\d{1,2}|\.\d{1,2})$/.test(rawAmount) &&
        Number.isFinite(amount) &&
        amount <= 1_000_000_000_000
      ) {
        policy.maxCaptureAmount = amount;
      } else {
        warnings.push("Ignored a capture limit that was out of bounds or had more than two decimals.");
      }
    } else {
      warnings.push("No dollar capture limit was recognized.");
    }
  }

  const escalationRules: RecoveryPolicyRule[] = [];
  if (/escalat|human\s+(?:review|approval)/i.test(intent)) {
    if (/closed/i.test(intent)) {
      escalationRules.push({
        id: "account-closed-escalation",
        reason: "Account closure requires human review",
        action: "ESCALATE",
        when: {
          reasonCode: [
            "SUBSCRIBER_ACCOUNT_CLOSED",
            "USER_ACCOUNT_CLOSED",
            "PAYER_ACCOUNT_CLOSED",
            "ACCOUNT_CLOSED",
          ],
        },
      });
    }
    if (/locked/i.test(intent)) {
      escalationRules.push({
        id: "account-locked-escalation",
        reason: "Account lock requires human review",
        action: "ESCALATE",
        when: {
          reasonCode: [
            "SUBSCRIBER_ACCOUNT_LOCKED",
            "USER_ACCOUNT_LOCKED",
            "PAYER_ACCOUNT_LOCKED",
            "ACCOUNT_LOCKED",
          ],
        },
      });
    }
    if (/restricted|limitation|limited/i.test(intent)) {
      escalationRules.push({
        id: "account-restricted-escalation",
        reason: "Account restriction requires human review",
        action: "ESCALATE",
        when: {
          reasonCode: [
            "PAYER_ACCOUNT_RESTRICTED",
            "PAYEE_ACCOUNT_RESTRICTED",
            "SUBSCRIBER_ACCOUNT_RESTRICTED",
            "USER_ACCOUNT_RESTRICTED",
            "ACCOUNT_RESTRICTED",
          ],
        },
      });
    }
  }
  if (escalationRules.length > 0) {
    policy.rules.push(...escalationRules);
    recognized = true;
  }

  const noCapture =
    /\b(?:never|do\s+not|don't|must\s+not|prohibit|forbid|disable|block|prevent)\b[^.;\n]{0,60}\bcaptur/i.test(
      intent,
    ) ||
    (/\bno[-\s]captures?\b/i.test(intent) && !/\bno[-\s]capture\s+(?:limit|cap|max)/i.test(intent));
  if (noCapture) {
    policy.rules.push({
      id: "no-capture",
      reason: "Capture disabled by explicit policy intent",
      action: "BLOCK",
      when: { outstanding: "POSITIVE" },
    });
    recognized = true;
  }

  if (intent.trim().length > 0 && !recognized) {
    warnings.push("No supported policy instructions were recognized; baseline behavior is unchanged.");
  }
  return { policy, source: "deterministic", warnings };
}

type ChatCompletion = {
  choices?: { message?: { content?: unknown } }[];
};

export async function compilePolicyIntent(
  intent: string,
  config: PolicyCompilerConfig = {},
): Promise<PolicyCompilation> {
  const deterministic = compileDeterministic(intent);
  if (!config.apiKey) return deterministic;

  const fallback = (warning: string): PolicyCompilation => ({
    policy: deterministic.policy,
    source: "deterministic",
    warnings: [...deterministic.warnings, warning],
  });

  try {
    const fetchImpl = config.fetchImpl ?? fetch;
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
          max_tokens: 1_800,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Compile the user's recovery intent into JSON only. Return exactly schemaVersion (1), name, requireHumanApproval (always true), maxCaptureAmount (number or null), allowedCurrencies (uppercase three-letter array or null), rules, and fallback (BASELINE). Each rule has id, reason, action (NONE, WAIT, CAPTURE, ACTIVATE, ESCALATE, or BLOCK), and when. The when object may contain status (ACTIVE, SUSPENDED, EXPIRED, CANCELLED array), outstanding (ZERO or POSITIVE), minFailedPayments (nonnegative integer), and reasonCode (uppercase string array). Rules are ordered. Never weaken baseline safety and never disable human approval. Do not use markdown or add fields.",
            },
            { role: "user", content: JSON.stringify({ intent }) },
          ],
        }),
      },
    );
    if (!response.ok) {
      return fallback(`LLM policy request failed with HTTP ${response.status}; using deterministic policy.`);
    }

    const payload = (await response.json()) as ChatCompletion;
    const raw = payload.choices?.[0]?.message?.content;
    if (typeof raw !== "string") {
      return fallback("LLM response contained no JSON policy; using deterministic policy.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fallback("LLM response was not JSON; using deterministic policy.");
    }
    const validated = validatePolicy(parsed);
    if (!validated.ok) {
      return fallback(
        `LLM policy failed validation (${validated.errors.join("; ")}); using deterministic policy.`,
      );
    }

    return { policy: validated.policy, source: "llm", warnings: [] };
  } catch {
    return fallback("LLM policy compilation failed; using deterministic policy.");
  }
}

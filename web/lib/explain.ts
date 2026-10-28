export type RecoveryAction =
  | "CAPTURE"
  | "WAIT"
  | "CHANGE_PLAN"
  | "PAUSE"
  | "ESCALATE";

export interface Explanation {
  reasonCode: string;
  summary: string;
  likelyCause: string;
  recommendedAction: RecoveryAction;
  confidence: "high" | "medium" | "low";
  playbook: string;
}

const EXPLANATIONS: Record<string, Omit<Explanation, "reasonCode">> = {
  PAYMENT_DENIED: {
    summary: "PayPal declined the payment",
    likelyCause: "The buyer's funding source was refused by the issuer.",
    recommendedAction: "CAPTURE",
    confidence: "medium",
    playbook: "Ask the buyer to confirm funds, then capture the outstanding balance.",
  },
  PAYER_CANNOT_PAY: {
    summary: "The payer cannot pay right now",
    likelyCause: "Temporary funding or account limitation on the payer side.",
    recommendedAction: "CAPTURE",
    confidence: "medium",
    playbook: "Retry the outstanding balance; if it fails again, offer a smaller plan.",
  },
  PAYER_ACCOUNT_RESTRICTED: {
    summary: "The payer account is restricted",
    likelyCause: "PayPal limited the buyer's account.",
    recommendedAction: "ESCALATE",
    confidence: "high",
    playbook: "Do not retry. Contact the buyer and document the limitation.",
  },
  PAYEE_ACCOUNT_RESTRICTED: {
    summary: "The merchant account is restricted",
    likelyCause: "The receiving business account cannot accept payments.",
    recommendedAction: "ESCALATE",
    confidence: "high",
    playbook: "Resolve the merchant account limitation before any retry.",
  },
  SENDING_LIMIT_EXCEEDED: {
    summary: "The payer exceeded a sending limit",
    likelyCause: "The transaction is above the buyer's PayPal sending limit.",
    recommendedAction: "CHANGE_PLAN",
    confidence: "medium",
    playbook: "Offer a lower-priced plan or split the amount.",
  },
  TRANSACTION_RECEIVING_LIMIT_EXCEEDED: {
    summary: "The merchant exceeded a receiving limit",
    likelyCause: "The business account reached its receiving limit.",
    recommendedAction: "ESCALATE",
    confidence: "high",
    playbook: "Resolve the receiving limit with PayPal before retrying.",
  },
  CURRENCY_MISMATCH: {
    summary: "Currency mismatch",
    likelyCause: "The capture currency differs from the subscription currency.",
    recommendedAction: "ESCALATE",
    confidence: "high",
    playbook: "Fix the plan currency; never capture with a different currency.",
  },
  INTERNAL_SERVER_ERROR: {
    summary: "PayPal had an internal error",
    likelyCause: "Transient provider failure.",
    recommendedAction: "WAIT",
    confidence: "medium",
    playbook: "Wait for the next retry; read the subscription before acting.",
  },
  UNKNOWN: {
    summary: "Unrecognized failure reason",
    likelyCause: "The reason code is missing or new.",
    recommendedAction: "ESCALATE",
    confidence: "low",
    playbook: "Do not guess. Escalate to a human with the raw PayPal payload.",
  },
};

export function explainFailure(reasonCode: string | null | undefined): Explanation {
  const key = reasonCode && reasonCode.length > 0 ? reasonCode : "UNKNOWN";
  const entry = EXPLANATIONS[key] ?? EXPLANATIONS.UNKNOWN;

  return { reasonCode: key, ...entry };
}

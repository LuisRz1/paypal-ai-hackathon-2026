import {
  evaluatePolicy,
  type PolicyAction,
  type PolicyEvaluation,
  type RecoveryPolicy,
} from "./policy";
import {
  nextAction,
  type Action,
  type Plan,
  type Subscription,
  type SubscriptionStatus,
} from "./state-machine";

export type SimulationInvariant =
  | "CANCELLED_SAFETY"
  | "EXPIRED_SAFETY"
  | "PLAN_CURRENCY_SAFETY"
  | "CAPTURE_SAFETY"
  | "ACTIVATE_SAFETY"
  | "POLICY_RULE_SAFETY";

export interface SimulationViolation {
  caseId: string;
  invariant: SimulationInvariant;
  code: string;
  message: string;
  policyRuleId?: string;
}

export interface SimulationCase {
  id: string;
  subscription: Subscription;
  plan: Plan;
  baseline: Action;
  action: PolicyEvaluation;
  passed: boolean;
  violations: SimulationViolation[];
}

export interface InvariantSummary {
  invariant: SimulationInvariant;
  description: string;
  total: number;
  passed: number;
  failed: number;
}

export interface SimulationResult {
  total: number;
  passed: number;
  actionCounts: Record<PolicyAction, number>;
  violations: SimulationViolation[];
  invariants: InvariantSummary[];
  cases: SimulationCase[];
}

const INVARIANT_DESCRIPTIONS: Record<SimulationInvariant, string> = {
  CANCELLED_SAFETY: "Cancelled subscriptions always remain NONE.",
  EXPIRED_SAFETY: "Expired subscriptions always ESCALATE.",
  PLAN_CURRENCY_SAFETY: "Non-terminal plan currency mismatches always BLOCK.",
  CAPTURE_SAFETY: "Captures are positive, baseline-authorized, balanced, and within policy limits.",
  ACTIVATE_SAFETY: "Only suspended subscriptions with zero balance may activate.",
  POLICY_RULE_SAFETY: "Unsafe custom-rule candidates are blocked and reported.",
};

export function simulatePolicy(policy: RecoveryPolicy): SimulationResult {
  const statuses: SubscriptionStatus[] = ["ACTIVE", "SUSPENDED", "EXPIRED", "CANCELLED"];
  const balances = [0, 19, 49];
  const failures = [0, 1, 2, 3];
  const thresholds = [0, 1, 2];
  const currencies = ["USD", "EUR"];
  const cases: SimulationCase[] = [];
  const violations: SimulationViolation[] = [];
  const actionCounts: Record<PolicyAction, number> = {
    NONE: 0,
    WAIT: 0,
    CAPTURE: 0,
    ACTIVATE: 0,
    ESCALATE: 0,
    BLOCK: 0,
  };
  const failedByInvariant: Record<SimulationInvariant, number> = {
    CANCELLED_SAFETY: 0,
    EXPIRED_SAFETY: 0,
    PLAN_CURRENCY_SAFETY: 0,
    CAPTURE_SAFETY: 0,
    ACTIVATE_SAFETY: 0,
    POLICY_RULE_SAFETY: 0,
  };
  let passed = 0;

  for (const status of statuses) {
    for (const outstanding_balance of balances) {
      for (const failed_payments_count of failures) {
        for (const threshold of thresholds) {
          for (const currency of currencies) {
            const subscription: Subscription = {
              id: "SUB-M",
              customer: "Matrix",
              plan_id: "P-M",
              status,
              currency,
              failed_payments_count,
              outstanding_balance,
              next_billing_time: null,
              last_failed_payment: null,
            };
            const plan: Plan = {
              name: "Matrix",
              payment_failure_threshold: threshold,
              currency: "USD",
              amount: 49,
              auto_bill_outstanding: true,
            };
            const baseline = nextAction(subscription, plan);
            const action = evaluatePolicy(subscription, plan, policy);
            const caseId = `case-${cases.length + 1}`;
            const caseViolations: SimulationViolation[] = [];
            const fail = (
              invariant: SimulationInvariant,
              code: string,
              message: string,
            ): void => {
              caseViolations.push({
                caseId,
                invariant,
                code,
                message,
                ...(action.policyRuleId ? { policyRuleId: action.policyRuleId } : {}),
              });
            };

            if (action.violation) {
              fail(
                "POLICY_RULE_SAFETY",
                action.violation,
                `Policy rule ${action.policyRuleId ?? "unknown"} attempted an unsafe action; it was blocked.`,
              );
            }
            if (status === "CANCELLED" && action.action !== "NONE") {
              fail("CANCELLED_SAFETY", "CANCELLED_NOT_NONE", "Cancelled subscription did not return NONE.");
            }
            if (status === "EXPIRED" && action.action !== "ESCALATE") {
              fail("EXPIRED_SAFETY", "EXPIRED_NOT_ESCALATE", "Expired subscription did not ESCALATE.");
            }
            if (
              currency !== plan.currency &&
              status !== "CANCELLED" &&
              status !== "EXPIRED" &&
              action.action !== "BLOCK"
            ) {
              fail(
                "PLAN_CURRENCY_SAFETY",
                "PLAN_CURRENCY_NOT_BLOCKED",
                "A non-terminal plan currency mismatch did not BLOCK.",
              );
            }

            if (action.action === "CAPTURE") {
              if (outstanding_balance <= 0) {
                fail("CAPTURE_SAFETY", "CAPTURE_ZERO_BALANCE", "A zero balance was captured.");
              }
              if (currency !== plan.currency) {
                fail("CAPTURE_SAFETY", "CAPTURE_CURRENCY_MISMATCH", "A mismatched currency was captured.");
              }
              if (status !== "ACTIVE" && status !== "SUSPENDED") {
                fail("CAPTURE_SAFETY", "CAPTURE_TERMINAL_STATUS", "A terminal subscription was captured.");
              }
              if (action.amount !== outstanding_balance) {
                fail("CAPTURE_SAFETY", "CAPTURE_AMOUNT_MISMATCH", "Capture amount differs from the balance.");
              }
              if (baseline.action !== "CAPTURE") {
                fail(
                  "CAPTURE_SAFETY",
                  "CAPTURE_NOT_BASELINE",
                  "Policy introduced a capture not authorized by baseline behavior.",
                );
              }
              if (policy.maxCaptureAmount !== null && outstanding_balance > policy.maxCaptureAmount) {
                fail("CAPTURE_SAFETY", "CAPTURE_LIMIT_EXCEEDED", "Capture exceeded maxCaptureAmount.");
              }
              if (policy.allowedCurrencies !== null && !policy.allowedCurrencies.includes(currency)) {
                fail("CAPTURE_SAFETY", "CAPTURE_CURRENCY_NOT_ALLOWED", "Capture used a disallowed currency.");
              }
            }

            if (action.action === "ACTIVATE") {
              if (status !== "SUSPENDED") {
                fail("ACTIVATE_SAFETY", "ACTIVATE_INVALID_STATUS", "A non-suspended subscription was activated.");
              }
              if (outstanding_balance !== 0) {
                fail("ACTIVATE_SAFETY", "ACTIVATE_POSITIVE_BALANCE", "A positive balance was activated.");
              }
              if (currency !== plan.currency) {
                fail("ACTIVATE_SAFETY", "ACTIVATE_CURRENCY_MISMATCH", "A mismatched currency was activated.");
              }
              if (policy.allowedCurrencies !== null && !policy.allowedCurrencies.includes(currency)) {
                fail("ACTIVATE_SAFETY", "ACTIVATE_CURRENCY_NOT_ALLOWED", "A disallowed currency was activated.");
              }
            }

            actionCounts[action.action] += 1;
            const failedInvariants = new Set<SimulationInvariant>();
            for (const violation of caseViolations) {
              violations.push(violation);
              if (!failedInvariants.has(violation.invariant)) {
                failedByInvariant[violation.invariant] += 1;
                failedInvariants.add(violation.invariant);
              }
            }
            if (caseViolations.length === 0) passed += 1;
            cases.push({
              id: caseId,
              subscription,
              plan,
              baseline,
              action,
              passed: caseViolations.length === 0,
              violations: caseViolations,
            });
          }
        }
      }
    }
  }

  const total = cases.length;
  return {
    total,
    passed,
    actionCounts,
    violations,
    invariants: (
      Object.keys(INVARIANT_DESCRIPTIONS) as SimulationInvariant[]
    ).map((invariant) => ({
      invariant,
      description: INVARIANT_DESCRIPTIONS[invariant],
      total,
      passed: total - failedByInvariant[invariant],
      failed: failedByInvariant[invariant],
    })),
    cases,
  };
}

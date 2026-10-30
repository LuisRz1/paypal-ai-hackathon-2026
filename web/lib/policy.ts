import {
  nextAction,
  type Action,
  type Plan,
  type Subscription,
  type SubscriptionStatus,
} from "./state-machine";

export type PolicyAction = Action["action"];

export interface RecoveryPolicyRule {
  id: string;
  reason: string;
  action: PolicyAction;
  when: {
    status?: SubscriptionStatus[];
    outstanding?: "ZERO" | "POSITIVE";
    minFailedPayments?: number;
    reasonCode?: string[];
  };
}

export interface RecoveryPolicy {
  schemaVersion: 1;
  name: string;
  requireHumanApproval: true;
  maxCaptureAmount: number | null;
  allowedCurrencies: string[] | null;
  rules: RecoveryPolicyRule[];
  fallback: "BASELINE";
}

export type PolicyViolation =
  | "CAPTURE_ZERO_BALANCE"
  | "CAPTURE_NOT_BASELINE"
  | "ACTIVATE_POSITIVE_BALANCE"
  | "ACTIVATE_NOT_BASELINE";

export interface PolicyEvaluation extends Action {
  policyRuleId?: string;
  /** A prevented custom-rule violation. The returned action is always safe. */
  violation?: PolicyViolation;
}

export type PolicyValidationResult =
  | { ok: true; policy: RecoveryPolicy }
  | { ok: false; errors: string[] };

export const DEFAULT_POLICY: RecoveryPolicy = {
  schemaVersion: 1,
  name: "Baseline recovery",
  requireHumanApproval: true,
  maxCaptureAmount: null,
  allowedCurrencies: null,
  rules: [],
  fallback: "BASELINE",
};

const ACTIONS: Record<string, true> = {
  NONE: true,
  WAIT: true,
  CAPTURE: true,
  ACTIVATE: true,
  ESCALATE: true,
  BLOCK: true,
};
const STATUSES: Record<string, true> = {
  ACTIVE: true,
  SUSPENDED: true,
  EXPIRED: true,
  CANCELLED: true,
};
const OUTSTANDING: Record<string, true> = { ZERO: true, POSITIVE: true };
const POLICY_KEYS: Record<string, true> = {
  schemaVersion: true,
  name: true,
  requireHumanApproval: true,
  maxCaptureAmount: true,
  allowedCurrencies: true,
  rules: true,
  fallback: true,
};
const RULE_KEYS: Record<string, true> = { id: true, reason: true, action: true, when: true };
const WHEN_KEYS: Record<string, true> = {
  status: true,
  outstanding: true,
  minFailedPayments: true,
  reasonCode: true,
};

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: Record<string, true>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed[key]) errors.push(`${path}.${key} is not allowed`);
  }
}

function isSafeString(value: unknown, maximumLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maximumLength &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validateStringArray(
  value: unknown,
  path: string,
  pattern: RegExp,
  maximumItems: number,
  errors: string[],
): void {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximumItems) {
    errors.push(`${path} must be a non-empty array with at most ${maximumItems} items`);
    return;
  }
  const seen = new Set<string>();
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || !pattern.test(item)) {
      errors.push(`${path}[${index}] is invalid`);
    } else if (seen.has(item)) {
      errors.push(`${path} contains duplicate ${item}`);
    }
    if (typeof item === "string") seen.add(item);
  }
}

export function validatePolicy(input: unknown): PolicyValidationResult {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["policy must be an object"] };
  }
  const value = input as Record<string, unknown>;
  hasOnlyKeys(value, POLICY_KEYS, "policy", errors);

  if (value.schemaVersion !== 1) errors.push("policy.schemaVersion must be 1");
  if (!isSafeString(value.name, 80)) {
    errors.push("policy.name must be a safe, trimmed string of 1-80 characters");
  }
  if (value.requireHumanApproval !== true) {
    errors.push("policy.requireHumanApproval must be true");
  }
  if (value.fallback !== "BASELINE") errors.push("policy.fallback must be BASELINE");

  if (value.maxCaptureAmount !== null) {
    if (
      typeof value.maxCaptureAmount !== "number" ||
      !Number.isFinite(value.maxCaptureAmount) ||
      value.maxCaptureAmount < 0 ||
      value.maxCaptureAmount > 1_000_000_000_000
    ) {
      errors.push("policy.maxCaptureAmount must be null or a finite number from 0 to 1 trillion");
    } else if (Number(value.maxCaptureAmount.toFixed(2)) !== value.maxCaptureAmount) {
      errors.push("policy.maxCaptureAmount must have at most two decimal places");
    }
  }

  if (value.allowedCurrencies !== null) {
    validateStringArray(value.allowedCurrencies, "policy.allowedCurrencies", /^[A-Z]{3}$/, 100, errors);
  }

  if (!Array.isArray(value.rules) || value.rules.length > 100) {
    errors.push("policy.rules must be an array with at most 100 rules");
  } else {
    const ruleIds = new Set<string>();
    for (const [index, entry] of (value.rules as unknown[]).entries()) {
      const path = `policy.rules[${index}]`;
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      const rule = entry as Record<string, unknown>;
      hasOnlyKeys(rule, RULE_KEYS, path, errors);

      if (typeof rule.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(rule.id)) {
        errors.push(`${path}.id must be a safe identifier of 1-64 characters`);
      } else if (ruleIds.has(rule.id)) {
        errors.push(`${path}.id duplicates ${rule.id}`);
      } else {
        ruleIds.add(rule.id);
      }
      if (!isSafeString(rule.reason, 240)) {
        errors.push(`${path}.reason must be a safe, trimmed string of 1-240 characters`);
      }
      if (typeof rule.action !== "string" || !ACTIONS[rule.action]) {
        errors.push(`${path}.action is not a known action`);
      }

      if (typeof rule.when !== "object" || rule.when === null || Array.isArray(rule.when)) {
        errors.push(`${path}.when must be an object`);
        continue;
      }
      const when = rule.when as Record<string, unknown>;
      hasOnlyKeys(when, WHEN_KEYS, `${path}.when`, errors);

      if (when.status !== undefined) {
        if (!Array.isArray(when.status) || when.status.length === 0 || when.status.length > 4) {
          errors.push(`${path}.when.status must be a non-empty status array`);
        } else {
          const statuses = new Set<string>();
          for (const [statusIndex, status] of (when.status as unknown[]).entries()) {
            if (typeof status !== "string" || !STATUSES[status]) {
              errors.push(`${path}.when.status[${statusIndex}] is invalid`);
            } else if (statuses.has(status)) {
              errors.push(`${path}.when.status contains duplicate ${status}`);
            }
            if (typeof status === "string") statuses.add(status);
          }
        }
      }
      if (
        when.outstanding !== undefined &&
        (typeof when.outstanding !== "string" || !OUTSTANDING[when.outstanding])
      ) {
        errors.push(`${path}.when.outstanding must be ZERO or POSITIVE`);
      }
      if (when.minFailedPayments !== undefined) {
        const minimum = when.minFailedPayments;
        if (
          typeof minimum !== "number" ||
          !Number.isSafeInteger(minimum) ||
          minimum < 0 ||
          minimum > 1_000_000
        ) {
          errors.push(`${path}.when.minFailedPayments must be an integer from 0 to 1,000,000`);
        }
      }
      if (when.reasonCode !== undefined) {
        validateStringArray(
          when.reasonCode,
          `${path}.when.reasonCode`,
          /^[A-Z0-9][A-Z0-9_]{0,63}$/,
          100,
          errors,
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, policy: value as unknown as RecoveryPolicy };
}

function ruleMatches(subscription: Subscription, rule: RecoveryPolicyRule): boolean {
  const { when } = rule;
  if (when.status && !when.status.includes(subscription.status)) return false;
  if (when.outstanding === "ZERO" && subscription.outstanding_balance !== 0) return false;
  if (when.outstanding === "POSITIVE" && subscription.outstanding_balance <= 0) return false;
  if (
    when.minFailedPayments !== undefined &&
    subscription.failed_payments_count < when.minFailedPayments
  ) {
    return false;
  }
  if (
    when.reasonCode &&
    (!subscription.last_failed_payment ||
      !when.reasonCode.includes(subscription.last_failed_payment.reason_code))
  ) {
    return false;
  }
  return true;
}

function prevented(rule: RecoveryPolicyRule, violation: PolicyViolation): PolicyEvaluation {
  return {
    action: "BLOCK",
    reason: `policy_${violation.toLowerCase()}`,
    policyRuleId: rule.id,
    violation,
  };
}

export function evaluatePolicy(
  subscription: Subscription,
  plan: Plan,
  policy: RecoveryPolicy,
): PolicyEvaluation {
  const baseline = nextAction(subscription, plan);

  // Terminal state and provider/plan currency protections are not policy-configurable.
  if (
    subscription.status === "CANCELLED" ||
    subscription.status === "EXPIRED" ||
    subscription.currency !== plan.currency
  ) {
    return baseline;
  }

  if (
    policy.allowedCurrencies !== null &&
    !policy.allowedCurrencies.includes(subscription.currency)
  ) {
    return { action: "BLOCK", reason: "currency_not_allowed" };
  }

  const rule = policy.rules.find((candidate) => ruleMatches(subscription, candidate));
  const candidate: Action = rule
    ? {
        action: rule.action,
        reason: rule.reason,
        ...(rule.action === "CAPTURE" ? { amount: subscription.outstanding_balance } : {}),
        ...(rule.action === "WAIT"
          ? { next_retry: subscription.last_failed_payment?.next_payment_retry_time ?? null }
          : {}),
      }
    : baseline;
  const policyRuleId = rule?.id;

  if (candidate.action === "CAPTURE") {
    if (rule && subscription.outstanding_balance <= 0) {
      return prevented(rule, "CAPTURE_ZERO_BALANCE");
    }
    if (rule && baseline.action !== "CAPTURE") {
      return prevented(rule, "CAPTURE_NOT_BASELINE");
    }
    if (
      policy.maxCaptureAmount !== null &&
      subscription.outstanding_balance > policy.maxCaptureAmount
    ) {
      return {
        action: "ESCALATE",
        reason: "capture_limit_exceeded",
        amount: subscription.outstanding_balance,
        ...(policyRuleId ? { policyRuleId } : {}),
      };
    }
    return {
      action: "CAPTURE",
      reason: candidate.reason,
      amount: subscription.outstanding_balance,
      ...(policyRuleId ? { policyRuleId } : {}),
    };
  }

  if (candidate.action === "ACTIVATE") {
    if (rule && subscription.outstanding_balance > 0) {
      return prevented(rule, "ACTIVATE_POSITIVE_BALANCE");
    }
    if (rule && baseline.action !== "ACTIVATE") {
      return prevented(rule, "ACTIVATE_NOT_BASELINE");
    }
  }

  return {
    ...candidate,
    ...(policyRuleId ? { policyRuleId } : {}),
  };
}

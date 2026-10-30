import {
  DEFAULT_POLICY,
  validatePolicy,
  type RecoveryPolicy,
} from "./policy";
import { simulatePolicy, type SimulationResult } from "./simulation";
import { sha256 } from "./integrity";

export interface ActivePolicy {
  id: string;
  hash: string;
  intent: string;
  source: "system" | "deterministic" | "llm";
  activatedAt: string | null;
  simulationHash: string;
  policy: RecoveryPolicy;
}

const globalPolicies = globalThis as unknown as {
  __recoverActivePolicy?: ActivePolicy;
  __recoverBaselinePolicy?: ActivePolicy;
};

export function getActivePolicy(): ActivePolicy {
  if (globalPolicies.__recoverActivePolicy) {
    return globalPolicies.__recoverActivePolicy;
  }
  if (globalPolicies.__recoverBaselinePolicy) {
    return globalPolicies.__recoverBaselinePolicy;
  }

  const simulation = simulatePolicy(DEFAULT_POLICY);
  const baseline: ActivePolicy = {
    id: "baseline",
    hash: sha256(DEFAULT_POLICY),
    intent: "Recover safe outstanding balances with mandatory human approval.",
    source: "system",
    activatedAt: null,
    simulationHash: sha256(simulation),
    policy: DEFAULT_POLICY,
  };
  globalPolicies.__recoverBaselinePolicy = baseline;
  return baseline;
}

export function activatePolicy(input: {
  policy: unknown;
  intent: string;
  source: "deterministic" | "llm";
}):
  | { ok: true; active: ActivePolicy; simulation: SimulationResult }
  | { ok: false; errors: string[]; simulation?: SimulationResult } {
  const validated = validatePolicy(input.policy);
  if (!validated.ok) {
    return { ok: false, errors: validated.errors };
  }

  const simulation = simulatePolicy(validated.policy);
  if (simulation.violations.length > 0) {
    return {
      ok: false,
      errors: ["Policy failed deterministic simulation"],
      simulation,
    };
  }

  const active: ActivePolicy = {
    id: `policy_${crypto.randomUUID()}`,
    hash: sha256(validated.policy),
    intent: input.intent,
    source: input.source,
    activatedAt: new Date().toISOString(),
    simulationHash: sha256(simulation),
    policy: validated.policy,
  };
  globalPolicies.__recoverActivePolicy = active;
  return { ok: true, active, simulation };
}

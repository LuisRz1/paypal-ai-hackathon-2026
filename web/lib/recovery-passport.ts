import { signRecoveryPassport, type RecoveryPassport } from "./evidence";
import {
  ledger,
  proposals,
  recoveryEvidence,
  type LedgerEvent,
  type Proposal,
  type RecoveryEvidence,
} from "./store";
import type { Subscription } from "./state-machine";

export type RecoveryPassportView = RecoveryPassport<{
  proposal: Proposal;
  recovery: RecoveryEvidence;
  ledger: LedgerEvent[];
}>;

export function snapshotSeedSubscription(
  subscription: Subscription,
): Record<string, unknown> {
  return {
    id: subscription.id,
    plan_id: subscription.plan_id,
    status: subscription.status,
    currency: subscription.currency,
    failed_payments_count: subscription.failed_payments_count,
    outstanding_balance: subscription.outstanding_balance,
    next_billing_time: subscription.next_billing_time,
    last_failed_payment: subscription.last_failed_payment,
  };
}

export function snapshotPayPalSubscription(
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return { unavailable: true };
  }
  const subscription = value as {
    id?: unknown;
    plan_id?: unknown;
    status?: unknown;
    billing_info?: {
      outstanding_balance?: unknown;
      last_payment?: unknown;
      next_billing_time?: unknown;
      failed_payments_count?: unknown;
    };
  };
  return {
    id: subscription.id,
    plan_id: subscription.plan_id,
    status: subscription.status,
    billing_info: {
      outstanding_balance: subscription.billing_info?.outstanding_balance,
      last_payment: subscription.billing_info?.last_payment,
      next_billing_time: subscription.billing_info?.next_billing_time,
      failed_payments_count: subscription.billing_info?.failed_payments_count,
    },
  };
}

export function buildRecoveryPassport(
  proposalId: string,
): RecoveryPassportView | null {
  const proposal = proposals[proposalId];
  const evidence = recoveryEvidence[proposalId];
  if (!proposal || !evidence) {
    return null;
  }

  return signRecoveryPassport({
    proposal: { ...proposal },
    recovery: {
      ...evidence,
      subscriptionBefore: { ...evidence.subscriptionBefore },
      capture: evidence.capture ? { ...evidence.capture } : undefined,
      readback: evidence.readback ? { ...evidence.readback } : undefined,
      activation: evidence.activation ? { ...evidence.activation } : undefined,
    },
    // Include the complete chain: filtering would remove the previous-hash links
    // that make the evidence independently verifiable.
    ledger: [...ledger],
  });
}

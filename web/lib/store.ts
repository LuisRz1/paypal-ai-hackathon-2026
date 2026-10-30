import type { RecoveryPolicy } from "./policy";
import {
  appendLedgerEvent,
  type EvidenceLedgerEvent,
} from "./evidence";

export type ProposalStatus =
  | "AWAITING_APPROVAL"
  | "EXECUTED"
  | "VERIFIED"
  | "PENDING_VERIFICATION"
  | "FAILED";

export interface Proposal {
  id: string;
  subscriptionId: string;
  action: string;
  amount: number;
  currency: string;
  note: string;
  outstanding: number;
  status: ProposalStatus;
  requestId: string;
  policyHash: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  capabilityHash?: string;
}

export interface LedgerEvent extends EvidenceLedgerEvent {
  type: "proposal" | "approval" | "policy" | "capture" | "verify" | "failure" | "webhook";
}

export interface RecoveryEvidence {
  proposalId: string;
  createdAt: string;
  environment: "mock" | "sandbox";
  policy: { id: string; hash: string; name: string; document: RecoveryPolicy };
  subscriptionBefore: Record<string, unknown>;
  approval: {
    approvedBy: string;
    approvedAt: string;
    capabilityHash: string;
    requestId: string;
  };
  capture?: Record<string, unknown>;
  readback?: Record<string, unknown>;
  activation?: Record<string, unknown>;
  verified: boolean;
  pendingVerification: boolean;
}

const globalStore = globalThis as unknown as {
  __recoverProposals?: Record<string, Proposal>;
  __recoverLedger?: LedgerEvent[];
  __recoverRecovered?: Record<string, true>;
  __recoverEvidence?: Record<string, RecoveryEvidence>;
};

export const proposals = (globalStore.__recoverProposals ??=
  Object.create(null) as Record<string, Proposal>);
export const ledger = (globalStore.__recoverLedger ??= [] as LedgerEvent[]);
export const recovered = (globalStore.__recoverRecovered ??=
  Object.create(null) as Record<string, true>);
export const recoveryEvidence = (globalStore.__recoverEvidence ??=
  Object.create(null) as Record<string, RecoveryEvidence>);

export function recordLedger(
  event: Omit<LedgerEvent, "sequence" | "previousHash" | "hash">,
): LedgerEvent {
  return appendLedgerEvent(ledger, event) as LedgerEvent;
}

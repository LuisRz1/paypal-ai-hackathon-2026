export type ProposalStatus = "AWAITING_APPROVAL" | "EXECUTED" | "VERIFIED" | "FAILED";

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
  createdAt: string;
}

export interface LedgerEvent {
  id: string;
  type: "proposal" | "capture" | "verify" | "failure" | "webhook";
  proposalId: string;
  at: string;
  detail: Record<string, unknown>;
}

const globalStore = globalThis as unknown as {
  __recoverProposals?: Record<string, Proposal>;
  __recoverLedger?: LedgerEvent[];
};

export const proposals = (globalStore.__recoverProposals ??= {} as Record<string, Proposal>);
export const ledger = (globalStore.__recoverLedger ??= [] as LedgerEvent[]);

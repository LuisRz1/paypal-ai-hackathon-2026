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
  __recoverRecovered?: Record<string, true>;
};

export const proposals = (globalStore.__recoverProposals ??=
  Object.create(null) as Record<string, Proposal>);
export const ledger = (globalStore.__recoverLedger ??= [] as LedgerEvent[]);
export const recovered = (globalStore.__recoverRecovered ??=
  Object.create(null) as Record<string, true>);

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Explanation } from "@/lib/explain";
import type { ActivePolicy } from "@/lib/policy-store";
import type { RecoveryPassportView } from "@/lib/recovery-passport";
import type { Action, Plan, Subscription } from "@/lib/state-machine";
import type { Proposal } from "@/lib/store";
import { Timeline } from "./timeline";

interface SeedResponse {
  plans: Record<string, Plan>;
  subscriptions: Subscription[];
  decisions: Record<string, Action>;
}

interface HealthResponse {
  status: "mock" | "sandbox";
  checks: { approverConfigured: boolean };
}

interface ApprovalResponse {
  proposal: Proposal;
  evidenceUrl?: string;
  error?: string;
}

export function RecoveryWorkspace({
  active,
  onEvidence,
}: {
  active: ActivePolicy | null;
  onEvidence: (passport: RecoveryPassportView) => void;
}) {
  const [seed, setSeed] = useState<SeedResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [approver, setApprover] = useState("Demo merchant");
  const [approverToken, setApproverToken] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [seedResponse, healthResponse] = await Promise.all([
        fetch("/api/seed", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" }),
      ]);
      const seedPayload = await seedResponse.json();
      const healthPayload = await healthResponse.json();
      if (!seedResponse.ok) throw new Error(seedPayload.error ?? "Could not load subscriptions");
      setSeed(seedPayload);
      setHealth(healthPayload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load recoveries");
    }
  }, []);

  useEffect(() => {
    setProposal(null);
    setExplanation(null);
    setConfirmed(false);
    void load();
  }, [active?.hash, load]);

  async function propose(subscriptionId: string) {
    setBusy(subscriptionId);
    setError(null);
    setProposal(null);
    setExplanation(null);
    setConfirmed(false);
    try {
      const response = await fetch("/api/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create proposal");
      setProposal(payload.proposal);

      const explainResponse = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const explainPayload = await explainResponse.json();
      if (explainResponse.ok) setExplanation(explainPayload.explanation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create proposal");
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!proposal || !confirmed) return;
    setBusy(proposal.id);
    setError(null);
    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(approverToken ? { authorization: `Bearer ${approverToken}` } : {}),
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          confirmed: true,
          approvedBy: approver,
        }),
      });
      const payload = (await response.json()) as ApprovalResponse;
      if (payload.proposal) setProposal(payload.proposal);
      if (payload.evidenceUrl) {
        const evidenceResponse = await fetch(payload.evidenceUrl, { cache: "no-store" });
        const evidencePayload = await evidenceResponse.json();
        if (!evidenceResponse.ok) throw new Error(evidencePayload.error ?? "Evidence unavailable");
        if (payload.proposal.status === "VERIFIED") {
          setCompleted((current) => [...current, payload.proposal.subscriptionId]);
        }
        onEvidence(evidencePayload.passport);
        return;
      }
      throw new Error(payload.error ?? "Approval failed");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approval failed");
    } finally {
      setBusy(null);
    }
  }

  const subscriptions = seed?.subscriptions ?? [];
  const outstanding = subscriptions.reduce((sum, item) => sum + item.outstanding_balance, 0);
  const captureReady = subscriptions.filter((item) => seed?.decisions[item.id]?.action === "CAPTURE").length;
  const suspended = subscriptions.filter((item) => item.status === "SUSPENDED").length;
  const selectedSubscription = proposal
    ? subscriptions.find((item) => item.id === proposal.subscriptionId)
    : undefined;

  return (
    <div className="stack">
      <div className="page-intro">
        <div>
          <h1>Recovery operations</h1>
          <p>Review PayPal-derived balances, investigate the failure and authorize one exact operation. No capture occurs at proposal time.</p>
        </div>
        <span className={`status-pill ${health?.status === "sandbox" ? "success" : "warning"}`}>
          {health?.status === "sandbox" ? "PayPal Sandbox" : "Mock provider"}
        </span>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-label">Needs attention</div>
          <div className="metric-value">{seed ? suspended : "—"}</div>
          <div className="metric-detail">Suspended subscriptions</div>
        </div>
        <div className="metric">
          <div className="metric-label">Outstanding</div>
          <div className="metric-value">{seed ? `$${outstanding.toFixed(2)}` : "—"}</div>
          <div className="metric-detail">Across the seeded portfolio</div>
        </div>
        <div className="metric">
          <div className="metric-label">Eligible proposals</div>
          <div className="metric-value">{seed ? captureReady : "—"}</div>
          <div className="metric-detail">Under the active policy</div>
        </div>
        <div className="metric">
          <div className="metric-label">Policy</div>
          <div className="metric-value" style={{ fontSize: 16 }}>{active?.policy.name ?? "Loading"}</div>
          <div className="metric-detail hash">{active?.hash.slice(0, 16) ?? "—"}…</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Subscriptions</h2>
            <p>Decisions are evaluated on the server using {active?.policy.name ?? "the active policy"}.</p>
          </div>
          <button className="button secondary" disabled={busy !== null} onClick={load}>Refresh</button>
        </div>
        {!seed ? (
          <div className="loading">Loading subscriptions and policy decisions…</div>
        ) : (
          <div className="table-wrap" role="region" aria-label="Subscription recovery cases" tabIndex={0}>
            <table>
              <thead>
                <tr><th>Subscription</th><th>Status</th><th>Outstanding</th><th>Policy decision</th><th><span className="sr-only">Action</span></th></tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => {
                  const decision = seed.decisions[subscription.id];
                  const isCompleted = completed.includes(subscription.id);
                  return (
                    <tr key={subscription.id}>
                      <td>
                        <span className="cell-title">{subscription.id}</span>
                        <span className="cell-subtitle">{subscription.customer} · {subscription.plan_id}</span>
                      </td>
                      <td><span className={`status-pill ${subscription.status === "ACTIVE" ? "success" : subscription.status === "SUSPENDED" ? "warning" : "danger"}`}>{isCompleted ? "VERIFIED" : subscription.status}</span></td>
                      <td><strong>{subscription.currency} {subscription.outstanding_balance.toFixed(2)}</strong></td>
                      <td>
                        <span className="cell-title mono">{isCompleted ? "NONE" : decision.action}</span>
                        <span className="cell-subtitle">{isCompleted ? "Recovered in this session" : decision.reason}</span>
                      </td>
                      <td>
                        <button
                          className="button secondary"
                          disabled={decision.action !== "CAPTURE" || isCompleted || busy !== null}
                          onClick={() => propose(subscription.id)}
                        >
                          {busy === subscription.id ? "Preparing…" : "Review recovery"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {proposal && selectedSubscription && (
        <section className="case-file" aria-live="polite">
          <div className="case-header">
            <div>
              <h2>{proposal.subscriptionId}</h2>
              <div className="muted small">Case {proposal.id}</div>
            </div>
            <span className={`status-pill ${proposal.status === "VERIFIED" ? "success" : "warning"}`}>{proposal.status}</span>
          </div>
          <div className="case-body">
            <div className="case-main">
              <div className="case-section">
                <h3>Recovery analysis</h3>
                {explanation ? (
                  <>
                    <p><strong>{explanation.summary}</strong></p>
                    <p>{explanation.likelyCause}</p>
                    <div className="notice small">{explanation.playbook}</div>
                  </>
                ) : (
                  <p className="muted">Investigating the failure reason…</p>
                )}
              </div>
              <div className="case-section">
                <h3>{health?.status === "sandbox" ? "PayPal-derived case facts" : "Mock PayPal case facts"}</h3>
                <div className="summary-row"><span>Subscription state</span><strong>{selectedSubscription.status}</strong></div>
                <div className="summary-row"><span>Failed payments</span><strong>{selectedSubscription.failed_payments_count}</strong></div>
                <div className="summary-row"><span>Outstanding balance</span><strong>{proposal.currency} {proposal.outstanding.toFixed(2)}</strong></div>
                <div className="summary-row"><span>Failure reason</span><strong>{selectedSubscription.last_failed_payment?.reason_code ?? "Not exposed"}</strong></div>
              </div>
            </div>

            <aside className="case-aside" aria-label="Capture approval">
              <div className="approval-mandate">
                <h3>Human authorization</h3>
                <p className="small">Approve one capture of the outstanding balance. This cannot be undone by Recover.</p>
                <div className="approval-amount">{proposal.currency} {proposal.amount.toFixed(2)}</div>
                <div className="small mono">OUTSTANDING_BALANCE</div>
                <div className="case-section">
                  <div className="field">
                    <label htmlFor="approver-name">Approver name</label>
                    <input id="approver-name" type="text" maxLength={80} value={approver} onChange={(event) => setApprover(event.target.value)} />
                  </div>
                  {health?.checks.approverConfigured && (
                    <div className="field" style={{ marginTop: 12 }}>
                      <label htmlFor="approver-token">Approver token</label>
                      <input id="approver-token" type="password" autoComplete="off" value={approverToken} onChange={(event) => setApproverToken(event.target.value)} />
                    </div>
                  )}
                  <div className="check-row">
                    <input id="confirm-capture" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                    <label htmlFor="confirm-capture">I authorize this exact capture and understand that {health?.status === "sandbox" ? "PayPal will charge the subscriber" : "this executes against the mock provider"}.</label>
                  </div>
                  <button
                    className="button"
                    style={{ width: "100%" }}
                    disabled={!confirmed || !approver.trim() || proposal.status !== "AWAITING_APPROVAL" || busy !== null}
                    onClick={approve}
                  >
                    {busy === proposal.id ? "Executing and verifying…" : "Approve and capture"}
                  </button>
                </div>
                <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>The AI cannot press this button. Approval creates a single-use capability bound to the amount, subscription, policy and request ID.</p>
              </div>
              <div className="case-section">
                <div className="summary-row"><span>Policy hash</span><strong className="hash">{proposal.policyHash.slice(0, 16)}…</strong></div>
                <div className="summary-row"><span>Request ID</span><strong className="hash">{proposal.requestId.slice(0, 18)}…</strong></div>
                <details style={{ marginTop: 16 }}>
                  <summary>Capture request</summary>
                  <pre tabIndex={0}>{JSON.stringify({ note: proposal.note, capture_type: "OUTSTANDING_BALANCE", amount: { value: proposal.amount.toFixed(2), currency_code: proposal.currency } }, null, 2)}</pre>
                </details>
              </div>
            </aside>
          </div>
        </section>
      )}

      {seed && (
        <section className="panel">
          <div className="panel-body">
            <Timeline subscriptions={seed.subscriptions} />
          </div>
        </section>
      )}
    </div>
  );
}

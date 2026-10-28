"use client";

import { useEffect, useState } from "react";
import { nextAction, type Plan, type Subscription } from "@/lib/state-machine";
import type { Explanation } from "@/lib/explain";
import type { LedgerEvent, Proposal } from "@/lib/store";
import { Timeline } from "./timeline";

interface Seed {
  plans: Record<string, Plan>;
  subscriptions: Subscription[];
}

interface Approval {
  proposal: Proposal;
  capture?: { captureId?: string; status?: string };
  verified?: boolean;
  ledger?: LedgerEvent[];
}

export default function Home() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seed")
      .then((response) => response.json())
      .then(setSeed)
      .catch(() => setSeed(null));
  }, []);

  async function refreshLedger() {
    const response = await fetch("/api/ledger");
    const payload = await response.json();
    setEvents(payload.events ?? []);
  }

  async function propose(subscriptionId: string) {
    setBusy(subscriptionId);
    setError(null);
    setApproval(null);
    setExplanation(null);
    try {
      const response = await fetch("/api/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setProposal(null);
        setError(payload.error ?? "Could not propose a recovery");
        return;
      }
      setProposal(payload.proposal);
      const explainResponse = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      const explainPayload = await explainResponse.json();
      setExplanation(explainPayload.explanation ?? null);
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!proposal) return;
    setBusy(proposal.id);
    setError(null);
    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Approval failed");
        setProposal(payload.proposal ?? proposal);
        await refreshLedger();
        return;
      }
      setApproval(payload);
      setProposal(payload.proposal);
      await refreshLedger();
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <h1>Recover</h1>
      <p className="subtitle">
        PayPal-native recovery for suspended subscriptions. The agent proposes; deterministic
        rules decide; a human approves; PayPal verifies. Sandbox and mock only.
      </p>

      {seed && <Timeline subscriptions={seed.subscriptions} />}

      {!seed ? (
        <p className="muted">Loading subscriptions…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Subscription</th>
                <th scope="col">Status</th>
                <th scope="col">Outstanding</th>
                <th scope="col">Next action</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
            {seed.subscriptions.map((subscription) => {
              const plan = seed.plans[subscription.plan_id];
              const action = nextAction(subscription, plan);
              return (
                <tr key={subscription.id}>
                  <td>
                    <strong>{subscription.id}</strong>
                    <div className="muted">{subscription.customer}</div>
                  </td>
                  <td>
                    <span className={`badge ${subscription.status}`}>{subscription.status}</span>
                  </td>
                  <td>
                    {subscription.currency} {subscription.outstanding_balance.toFixed(2)}
                  </td>
                  <td className="action">
                    {action.action}
                    <div className="muted">{action.reason}</div>
                  </td>
                  <td>
                    <button
                      disabled={action.action !== "CAPTURE" || busy !== null}
                      onClick={() => propose(subscription.id)}
                    >
                      {busy === subscription.id ? "Proposing…" : "Propose recovery"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      )}

      {error && <p className="bad">{error}</p>}

      {proposal && (
        <section className="result">
          <strong>Proposal {proposal.id}</strong>
          <div className="action">
            {proposal.action} {proposal.amount.toFixed(2)} {proposal.currency}
          </div>
          <div className="muted">
            {proposal.status} · request {proposal.requestId}
          </div>
          {explanation && (
            <div className="explain">
              <strong>{explanation.summary}</strong>
              <div>{explanation.likelyCause}</div>
              <div className="muted">
                Recommended: {explanation.recommendedAction} · {explanation.confidence}
              </div>
              <p>{explanation.playbook}</p>
            </div>
          )}
          <button
            onClick={approve}
            disabled={proposal.status !== "AWAITING_APPROVAL" || busy !== null}
          >
            {busy === proposal.id ? "Approving…" : "Approve recovery"}
          </button>
        </section>
      )}

      {approval && (
        <section className="result">
          <strong>Execution</strong>
          <div className="action">
            {approval.verified ? "VERIFIED" : "NOT VERIFIED"} · {approval.capture?.captureId}
          </div>
          <pre>{JSON.stringify(approval, null, 2)}</pre>
        </section>
      )}

      {events.length > 0 && (
        <section className="result">
          <strong>Ledger ({events.length})</strong>
          <pre>{JSON.stringify(events, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}

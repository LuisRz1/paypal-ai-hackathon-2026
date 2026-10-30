"use client";

import { useEffect, useState } from "react";
import type { PassportVerification } from "@/lib/evidence";
import type { RecoveryPassportView } from "@/lib/recovery-passport";

function text(value: unknown, fallback = "Not available"): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function balanceAfter(passport: RecoveryPassportView): string {
  const readback = passport.payload.recovery.readback;
  if (!readback) return "Pending read-back";
  if (typeof readback.outstanding_balance === "number") {
    return `${passport.payload.proposal.currency} ${readback.outstanding_balance.toFixed(2)}`;
  }
  const billing = readback.billing_info;
  if (billing && typeof billing === "object" && !Array.isArray(billing)) {
    const outstanding = (billing as Record<string, unknown>).outstanding_balance;
    if (outstanding && typeof outstanding === "object" && !Array.isArray(outstanding)) {
      return text((outstanding as Record<string, unknown>).value, "Pending read-back");
    }
  }
  return "Pending read-back";
}

export function EvidencePanel({
  passport,
  onBack,
}: {
  passport: RecoveryPassportView | null;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [verification, setVerification] = useState<PassportVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVerification(null);
    setError(null);
  }, [passport]);

  if (!passport) {
    return (
      <section className="empty-state">
        <h1>No recovery evidence selected</h1>
        <p>Complete a human-approved recovery to generate a signed, independently verifiable passport.</p>
        <button className="button" onClick={onBack}>Open recoveries</button>
      </section>
    );
  }

  const { proposal, recovery, ledger } = passport.payload;
  const captureId = text(recovery.capture?.captureId, "Not issued");
  const statusClass = recovery.verified ? "" : recovery.pendingVerification ? "pending" : "failed";
  const statusLabel = recovery.verified
    ? recovery.environment === "mock"
      ? "Verified by mock read-back"
      : "Verified by PayPal read-back"
    : recovery.pendingVerification
      ? "Outcome pending verification"
      : "Recovery not verified";
  const caseEvents = ledger.filter((event) => event.proposalId === proposal.id);

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/evidence/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(passport),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Verification failed");
      setVerification(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(passport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recover-${proposal.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stack">
      <div className="page-intro">
        <div>
          <h1>Recovery evidence</h1>
          <p>Signed proof of the mandate, exact human authorization, PayPal outcome and complete hash-chained ledger.</p>
        </div>
        <span className={`status-pill ${recovery.verified ? "success" : "warning"}`}>
          {recovery.environment.toUpperCase()}
        </span>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className={`receipt-hero ${statusClass}`} aria-live="polite">
        <div>
          <h2>{statusLabel}</h2>
          <p>{proposal.subscriptionId} · capture {captureId}</p>
        </div>
        <div className="receipt-amount">
          {proposal.currency} {proposal.amount.toFixed(2)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recovery receipt</h2>
            <p>Amounts originate from the subscription outstanding balance, never from the model.</p>
          </div>
          <span className={`status-pill ${proposal.status === "VERIFIED" ? "success" : "warning"}`}>
            {proposal.status}
          </span>
        </div>
        <div className="panel-body stack">
          <div className="receipt-grid">
            <div className="receipt-cell">
              <span>Balance before</span>
              <strong>{proposal.currency} {proposal.outstanding.toFixed(2)}</strong>
            </div>
            <div className="receipt-cell">
              <span>Balance after</span>
              <strong>{balanceAfter(passport)}</strong>
            </div>
            <div className="receipt-cell">
              <span>Approved by</span>
              <strong>{recovery.approval.approvedBy}</strong>
            </div>
            <div className="receipt-cell">
              <span>Approved at</span>
              <strong>{new Date(recovery.approval.approvedAt).toLocaleString()}</strong>
            </div>
            <div className="receipt-cell">
              <span>PayPal request ID</span>
              <strong className="mono small">{recovery.approval.requestId}</strong>
            </div>
            <div className="receipt-cell">
              <span>Policy</span>
              <strong>{recovery.policy.name}</strong>
            </div>
          </div>

          <div className="summary-row">
            <span>One-time capability hash</span>
            <strong className="hash">{recovery.approval.capabilityHash}</strong>
          </div>
          <div className="summary-row">
            <span>Policy hash</span>
            <strong className="hash">{recovery.policy.hash}</strong>
          </div>
        </div>
        <div className="panel-footer">
          <span className="muted small">Ed25519 · {passport.keyId.slice(0, 16)}…</span>
          <div className="button-row">
            <button className="button secondary" onClick={download}>Download JSON</button>
            <button className="button" disabled={busy} onClick={verify}>
              {busy ? "Verifying…" : "Verify integrity"}
            </button>
          </div>
        </div>
      </section>

      {verification && (
        <section className="panel" aria-live="polite">
          <div className="panel-header">
            <div>
              <h2>{verification.valid ? "Evidence verified" : "Evidence failed verification"}</h2>
              <p>{verification.error ?? "Payload, ledger, key and signature checks completed."}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="verification-checks">
              {Object.entries(verification.checks).map(([name, valid]) => (
                <div className={`verification-check ${valid ? "valid" : "invalid"}`} key={name}>
                  <strong>{valid ? "PASS" : "FAIL"}</strong>
                  <div className="small">{name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Case history</h2>
            <p>{caseEvents.length} case events · {ledger.length} events in the complete integrity chain.</p>
          </div>
        </div>
        <div className="panel-body stack">
          {caseEvents.map((event) => (
            <div className="summary-row" key={event.id}>
              <span>{event.sequence} · {event.type}</span>
              <strong className="mono small">{new Date(event.at).toLocaleTimeString()}</strong>
            </div>
          ))}
          <details>
            <summary>Inspect signed passport JSON</summary>
            <pre tabIndex={0}>{JSON.stringify(passport, null, 2)}</pre>
          </details>
          <div className="notice small">
            Independent check: <span className="mono">npx tsx web/scripts/verify-evidence.mjs &lt;passport.json&gt;</span>
          </div>
        </div>
      </section>
    </div>
  );
}

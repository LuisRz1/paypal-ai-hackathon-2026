"use client";

import { useState } from "react";
import type { PolicyCompilation } from "@/lib/policy-compiler";
import type { ActivePolicy } from "@/lib/policy-store";
import type { SimulationResult } from "@/lib/simulation";

const DEFAULT_INTENT =
  "Allow only USD, cap captures at $100, and escalate closed, locked, or restricted accounts. Always require my approval before capture.";

export function PolicyStudio({
  stage,
  active,
  onActivated,
  onShowSimulation,
  onShowMandate,
  onOpenRecoveries,
}: {
  stage: "mandate" | "simulation";
  active: ActivePolicy | null;
  onActivated: (active: ActivePolicy) => void;
  onShowSimulation: () => void;
  onShowMandate: () => void;
  onOpenRecoveries: () => void;
}) {
  const [intent, setIntent] = useState(DEFAULT_INTENT);
  const [compiled, setCompiled] = useState<PolicyCompilation | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [signed, setSigned] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function compile() {
    setBusy("compile");
    setError(null);
    try {
      const response = await fetch("/api/policies/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Compilation failed");
      setCompiled(payload);
      setSimulation(null);
      setSigned(false);
      onShowSimulation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compilation failed");
    } finally {
      setBusy(null);
    }
  }

  async function simulate() {
    if (!compiled) return;
    setBusy("simulate");
    setError(null);
    try {
      const response = await fetch("/api/policies/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ policy: compiled.policy }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Simulation failed");
      setSimulation(payload.simulation);
      setSigned(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Simulation failed");
    } finally {
      setBusy(null);
    }
  }

  async function activate() {
    if (!compiled || !simulation || !signed) return;
    setBusy("activate");
    setError(null);
    try {
      const response = await fetch("/api/policies/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          policy: compiled.policy,
          intent,
          source: compiled.source,
          signed: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Activation failed");
      onActivated(payload.active);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activation failed");
    } finally {
      setBusy(null);
    }
  }

  if (stage === "mandate") {
    return (
      <div className="stack">
        <div className="page-intro">
          <div>
            <h1>Write the recovery mandate</h1>
            <p>Describe the outcome and its limits. AI compiles intent into a constrained policy; deterministic code remains the authority.</p>
          </div>
          {active && <span className="status-pill success">{active.policy.name} active</span>}
        </div>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="grid-two">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Merchant intent</h2>
                <p>Use plain language. The compiler accepts only the documented policy schema.</p>
              </div>
            </div>
            <div className="panel-body stack">
              <div className="field">
                <label htmlFor="policy-intent">Recovery mandate</label>
                <textarea
                  id="policy-intent"
                  value={intent}
                  maxLength={1000}
                  onChange={(event) => setIntent(event.target.value)}
                />
                <p className="field-hint">{intent.length}/1000 characters · capture amounts always come from PayPal.</p>
              </div>
              <div className="notice small">
                Policies can restrict or escalate recovery. They cannot introduce captures outside the deterministic baseline, disable approval, or override terminal-state safety.
              </div>
            </div>
            <div className="panel-footer">
              <button className="button ghost" onClick={onOpenRecoveries}>Use active policy</button>
              <button className="button" disabled={busy !== null || intent.trim().length < 10} onClick={compile}>
                {busy === "compile" ? "Compiling…" : "Compile mandate"}
              </button>
            </div>
          </section>

          <aside className="panel" aria-label="Policy guardrails">
            <div className="panel-header">
              <div>
                <h2>Non-negotiable guardrails</h2>
                <p>Present in every compiled version.</p>
              </div>
            </div>
            <div className="panel-body">
              <ul className="invariant-list">
                {[
                  "Human approval is mandatory.",
                  "Cancelled subscriptions cannot be captured.",
                  "Zero balances cannot be captured.",
                  "Positive balances cannot be activated.",
                  "Plan currency mismatches remain blocked.",
                  "Unsafe LLM output is rejected by schema validation.",
                ].map((item) => (
                  <li className="invariant-item pass" key={item}>
                    <span className="check-mark" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!compiled) {
    return (
      <section className="empty-state">
        <h1>No compiled mandate yet</h1>
        <p>Compile a recovery mandate before running the deterministic flight simulator.</p>
        <button className="button" onClick={onShowMandate}>Write a mandate</button>
      </section>
    );
  }

  const filteredCases = simulation?.cases.filter((entry) => {
    if (filter === "VIOLATIONS") return !entry.passed;
    if (filter === "ALL") return true;
    return entry.action.action === filter;
  }) ?? [];

  return (
    <div className="stack">
      <div className="page-intro">
        <div>
          <h1>Test before you trust</h1>
          <p>Run the compiled policy against the complete deterministic state matrix. Activation repeats these checks on the server.</p>
        </div>
        <button className="button secondary" onClick={onShowMandate}>Edit mandate</button>
      </div>
      {error && <div className="error-banner" role="alert">{error}</div>}

      {compiled && (
        <>
          <div className="metric-grid">
            <div className="metric">
              <div className="metric-label">Matrix cases</div>
              <div className="metric-value">{simulation?.total ?? "—"}</div>
              <div className="metric-detail">Status, balance, failures, threshold, currency</div>
            </div>
            <div className="metric">
              <div className="metric-label">Passed</div>
              <div className="metric-value">{simulation?.passed ?? "—"}</div>
              <div className="metric-detail">{simulation ? `${simulation.violations.length} violations` : "Not simulated"}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Capture proposals</div>
              <div className="metric-value">{simulation?.actionCounts.CAPTURE ?? "—"}</div>
              <div className="metric-detail">Always require approval</div>
            </div>
            <div className="metric">
              <div className="metric-label">Compiler</div>
              <div className="metric-value" style={{ fontSize: 17 }}>{compiled.source === "llm" ? "LLM" : "Deterministic"}</div>
              <div className="metric-detail">Strict schema validation</div>
            </div>
          </div>

          {compiled.warnings.length > 0 && (
            <div className="notice" role="status">
              {compiled.warnings.map((warning) => <div key={warning}>{warning}</div>)}
            </div>
          )}

          <div className="grid-two">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Safety invariants</h2>
                  <p>{simulation ? "Observed across the executed matrix." : "Run the simulation to evaluate this policy."}</p>
                </div>
                <button className="button" disabled={busy !== null} onClick={simulate}>
                  {busy === "simulate" ? "Running 288 cases…" : simulation ? "Run again" : "Run 288 checks"}
                </button>
              </div>
              <div className="panel-body">
                {simulation ? (
                  <ul className="invariant-list">
                    {simulation.invariants.map((invariant) => (
                      <li className={`invariant-item ${invariant.failed === 0 ? "pass" : "fail"}`} key={invariant.invariant}>
                        <span className="check-mark" aria-hidden="true">{invariant.failed === 0 ? "✓" : "×"}</span>
                        <div>
                          <strong>{invariant.description}</strong>
                          <div className="small muted">{invariant.passed}/{invariant.total} cases passed</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state">
                    <p>No writes occur during simulation. The server evaluates the same policy object that will later be activated.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="panel" aria-label="Compiled policy review">
              <div className="panel-header">
                <div>
                  <h2>{compiled.policy.name}</h2>
                  <p>Compiled policy review</p>
                </div>
              </div>
              <div className="panel-body policy-summary">
                <div className="summary-row"><span>Human approval</span><strong>Required</strong></div>
                <div className="summary-row"><span>Capture ceiling</span><strong>{compiled.policy.maxCaptureAmount === null ? "No custom ceiling" : `$${compiled.policy.maxCaptureAmount.toFixed(2)}`}</strong></div>
                <div className="summary-row"><span>Currencies</span><strong>{compiled.policy.allowedCurrencies?.join(", ") ?? "Plan currency"}</strong></div>
                <div className="summary-row"><span>Fallback</span><strong>Deterministic baseline</strong></div>
                <div>
                  <strong>Ordered exceptions</strong>
                  {compiled.policy.rules.length === 0 ? (
                    <p className="muted small">No custom exceptions.</p>
                  ) : (
                    <ul className="rule-list">
                      {compiled.policy.rules.map((rule, index) => (
                        <li key={rule.id}>
                          <span className="rule-order">{String(index + 1).padStart(2, "0")}</span>
                          <strong>{rule.action}</strong>
                          <div className="small muted">{rule.reason}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <details>
                  <summary>Policy JSON</summary>
                  <pre tabIndex={0}>{JSON.stringify(compiled.policy, null, 2)}</pre>
                </details>
              </div>
            </aside>
          </div>

          {simulation && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Scenario explorer</h2>
                  <p>{filteredCases.length} matching cases · showing the first {Math.min(12, filteredCases.length)}.</p>
                </div>
                <div className="field">
                  <label htmlFor="case-filter">Filter decisions</label>
                  <select id="case-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
                    <option value="ALL">All decisions</option>
                    <option value="CAPTURE">Capture</option>
                    <option value="ACTIVATE">Activate</option>
                    <option value="WAIT">Wait</option>
                    <option value="ESCALATE">Escalate</option>
                    <option value="BLOCK">Block</option>
                    <option value="VIOLATIONS">Violations only</option>
                  </select>
                </div>
              </div>
              <div className="table-wrap" role="region" aria-label="Policy simulation cases" tabIndex={0}>
                <table>
                  <thead><tr><th>Case</th><th>Input</th><th>Baseline</th><th>Policy decision</th></tr></thead>
                  <tbody>
                    {filteredCases.slice(0, 12).map((entry) => (
                      <tr key={entry.id}>
                        <td className="mono">{entry.id}</td>
                        <td>
                          <span className="cell-title">{entry.subscription.status} · {entry.subscription.currency} {entry.subscription.outstanding_balance}</span>
                          <span className="cell-subtitle">{entry.subscription.failed_payments_count} failures · threshold {entry.plan.payment_failure_threshold}</span>
                        </td>
                        <td>{entry.baseline.action}</td>
                        <td>
                          <span className={`status-pill ${entry.passed ? "" : "danger"}`}>{entry.action.action}</span>
                          <span className="cell-subtitle">{entry.action.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel-footer">
                <div className="check-row" style={{ margin: 0 }}>
                  <input id="sign-policy" type="checkbox" checked={signed} onChange={(event) => setSigned(event.target.checked)} />
                  <label htmlFor="sign-policy">I reviewed this policy and its simulation. Activate it for new recovery proposals.</label>
                </div>
                <button
                  className="button"
                  disabled={!signed || simulation.violations.length > 0 || busy !== null}
                  onClick={activate}
                >
                  {busy === "activate" ? "Activating…" : "Sign and activate"}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { ActivePolicy } from "@/lib/policy-store";
import type { RecoveryPassportView } from "@/lib/recovery-passport";
import { EvidencePanel } from "./evidence-panel";
import { PolicyStudio } from "./policy-studio";
import { RecoveryWorkspace } from "./recovery-workspace";

type Stage = "mandate" | "simulation" | "recoveries" | "evidence";

const STAGES: { id: Stage; label: string; number: string }[] = [
  { id: "mandate", label: "Mandate", number: "01" },
  { id: "simulation", label: "Simulation", number: "02" },
  { id: "recoveries", label: "Recoveries", number: "03" },
  { id: "evidence", label: "Evidence", number: "04" },
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("mandate");
  const [active, setActive] = useState<ActivePolicy | null>(null);
  const [environment, setEnvironment] = useState<"mock" | "sandbox">("mock");
  const [passport, setPassport] = useState<RecoveryPassportView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/policies/active"), fetch("/api/health")])
      .then(async ([policyResponse, healthResponse]) => {
        const policy = await policyResponse.json();
        const health = await healthResponse.json();
        setActive(policy.active);
        setEnvironment(health.status === "sandbox" ? "sandbox" : "mock");
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Could not load control plane");
      });
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Recover control plane">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">R/</div>
          <div>
            <strong>Recover</strong>
            <small>Financial control plane</small>
          </div>
        </div>
        <nav aria-label="Recovery workflow">
          <ol className="side-nav">
            {STAGES.map((item) => {
              const complete =
                (item.id === "mandate" && active?.source !== "system" && active !== null) ||
                (item.id === "simulation" && active?.source !== "system" && active !== null) ||
                (item.id === "recoveries" && passport !== null);
              return (
                <li key={item.id}>
                  <button aria-current={stage === item.id ? "step" : undefined} onClick={() => setStage(item.id)}>
                    <span className="stage-number">{item.number}</span>
                    <span>{item.label}</span>
                    <span className={`stage-state ${complete ? "complete" : ""}`} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="guardrail-card">
          <strong>Authority boundary</strong>
          <p>AI can investigate and compile. It cannot authorize money movement.</p>
          <ol>
            <li>Code validates policy</li>
            <li>Human approves once</li>
            <li>PayPal verifies outcome</li>
          </ol>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-copy">Human-gated PayPal recovery · policy, execution and proof in one workflow</div>
          <span className={`environment ${environment}`}>
            {environment === "sandbox" ? "PayPal Sandbox" : "Mock environment"}
          </span>
        </header>
        <div className="content">
          {error && <div className="error-banner" role="alert">{error}</div>}
          {(stage === "mandate" || stage === "simulation") && (
            <PolicyStudio
              stage={stage}
              active={active}
              onActivated={(next) => {
                setActive(next);
                setStage("recoveries");
              }}
              onShowSimulation={() => setStage("simulation")}
              onShowMandate={() => setStage("mandate")}
              onOpenRecoveries={() => setStage("recoveries")}
            />
          )}
          {stage === "recoveries" && (
            <RecoveryWorkspace
              active={active}
              onEvidence={(next) => {
                setPassport(next);
                setStage("evidence");
              }}
            />
          )}
          {stage === "evidence" && (
            <EvidencePanel passport={passport} onBack={() => setStage("recoveries")} />
          )}
        </div>
      </main>
    </div>
  );
}

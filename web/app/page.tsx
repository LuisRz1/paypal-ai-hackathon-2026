"use client";

import { useEffect, useState } from "react";
import { nextAction, type Action, type Plan, type Subscription } from "@/lib/state-machine";

interface Seed {
  plans: Record<string, Plan>;
  subscriptions: Subscription[];
}

interface RecoverResponse {
  subscriptionId: string;
  action: Action;
  subscription: Subscription;
}

export default function Home() {
  const [seed, setSeed] = useState<Seed | null>(null);
  const [result, setResult] = useState<RecoverResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seed")
      .then((response) => response.json())
      .then(setSeed)
      .catch(() => setSeed(null));
  }, []);

  async function propose(subscriptionId: string) {
    setBusy(subscriptionId);
    try {
      const response = await fetch("/api/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      setResult(await response.json());
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <h1>Recover</h1>
      <p className="subtitle">
        PayPal-native recovery for suspended subscriptions. The agent proposes; deterministic
        rules decide; a human approves; PayPal verifies. Sandbox only.
      </p>

      {!seed ? (
        <p className="muted">Loading subscriptions…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Subscription</th>
              <th>Status</th>
              <th>Outstanding</th>
              <th>Next action</th>
              <th />
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
      )}

      {result && (
        <section className="result">
          <strong>Proposal for {result.subscriptionId}</strong>
          <div className="action">
            {result.action.action} {result.action.amount ? `$${result.action.amount}` : ""}
          </div>
          <div className="muted">{result.action.reason}</div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}

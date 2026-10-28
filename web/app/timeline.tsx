"use client";

import type { Subscription } from "@/lib/state-machine";

export function Timeline({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <section className="timeline">
      <h2>Renewal timeline</h2>
      {subscriptions.map((subscription) => {
        const width = Math.min(100, 35 + subscription.failed_payments_count * 20);
        return (
          <div className="timeline-row" key={subscription.id}>
            <div className="timeline-label">
              <strong>{subscription.id}</strong>
              <span>{subscription.customer}</span>
            </div>
            <div className="timeline-track">
              <div
                className={`timeline-bar ${subscription.status}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="timeline-meta">
              {subscription.status} · {subscription.currency}{" "}
              {subscription.outstanding_balance.toFixed(2)}
            </div>
          </div>
        );
      })}
    </section>
  );
}

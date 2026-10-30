# Recover Control Plane

Recover compiles a merchant mandate into a constrained recovery policy, tests it before activation, binds human approval to one exact PayPal operation, and emits independently verifiable evidence.

**Status:** functional mock-first vertical slice. The real PayPal sandbox client remains implemented, but no live sandbox capture has been executed.

## Design decisions

| Concern | Decision | Why |
|---|---|---|
| Language/runtime | TypeScript strict, Node.js 22 | Shared contracts, native crypto, `Promise.withResolvers` |
| Framework | Next.js App Router, React 19 | Server-only writes with a small client surface |
| AI | OpenAI-compatible JSON compiler with deterministic fallback | AI transforms intent; it never gains execution authority |
| Policy | Versioned declarative DSL, not generated JavaScript | Validatable, bounded and deterministic |
| Simulation | Pure 288-case state matrix, repeated on activation | Browser results are never trusted |
| Approval | HMAC-SHA256, single-use capability | Binds subscription, decimal amount, currency, policy and request ID |
| Evidence | Ed25519-signed JSON plus hash-chained ledger | Independent tamper detection without blockchain |
| Persistence | Process-local stores | Demo scope; not a distributed guarantee |
| UI | Four-stage guided control plane | Separates intent, proof, operations and evidence |

## Authority flow

```mermaid
flowchart LR
  I["Merchant intent"] --> C["AI / deterministic compiler"]
  C --> V["Schema validation"]
  V --> S["288-case simulation"]
  S --> H["Human policy signature"]
  H --> P["Versioned active policy"]
  P --> R["Recovery proposal"]
  R --> A["Explicit human approval"]
  A --> X["Single-use capability"]
  X --> W["PayPal sandbox or mock"]
  W --> B["Read-back"]
  B --> E["Signed recovery passport"]
```

The LLM never receives PayPal credentials and never chooses the capture amount. The amount is read from the subscription and bound to the approval.

## Module boundaries

| Module | Responsibility |
|---|---|
| `lib/policy.ts` | Policy schema, strict JSON validation, deterministic evaluation and safety precedence |
| `lib/policy-compiler.ts` | Natural-language compilation via optional LLM or deterministic parser |
| `lib/simulation.ts` | Pure 288-case simulation and invariant reporting |
| `lib/policy-store.ts` | Baseline and activated policy versions; cached baseline simulation |
| `lib/capability.ts` | Single-use HMAC capabilities, binding, expiry and replay protection |
| `lib/evidence.ts` | Ledger hash chain, Ed25519 keys, passport signing and verification |
| `lib/recovery-passport.ts` | Redacted PayPal snapshots and passport assembly |
| `lib/store.ts` | Process-local proposal, evidence and ledger state |
| `app/policy-studio.tsx` | Mandate editor, simulation explorer and signed activation |
| `app/recovery-workspace.tsx` | Subscription segmentation, case investigation and approval mandate |
| `app/evidence-panel.tsx` | Receipt, integrity checks, case history and JSON download |

## Policy contract

```json
{
  "schemaVersion": 1,
  "name": "Baseline recovery",
  "requireHumanApproval": true,
  "maxCaptureAmount": 100,
  "allowedCurrencies": ["USD"],
  "rules": [
    {
      "id": "account-closed-escalation",
      "reason": "Account closure requires human review",
      "action": "ESCALATE",
      "when": { "reasonCode": ["SUBSCRIBER_ACCOUNT_CLOSED"] }
    }
  ],
  "fallback": "BASELINE"
}
```

Validation rejects unknown fields, invalid enums, duplicate rule IDs, unsafe strings, excess decimal precision and `requireHumanApproval: false`.

Evaluation precedence:

1. Cancelled, expired and plan-currency safety.
2. Policy currency allow-list.
3. First matching custom rule.
4. Baseline state machine.
5. Capture safety and merchant capture ceiling.

A custom rule cannot introduce a capture where baseline would not capture, capture zero, or activate a positive balance. Unsafe candidates return `BLOCK` and appear as simulation violations. Activation requires zero violations.

## API

| Method | Route | Request | Result |
|---|---|---|---|
| GET | `/api/policies/active` | — | Current policy version and hashes |
| POST | `/api/policies/compile` | `{ intent }` | Validated policy, compiler source and warnings |
| POST | `/api/policies/simulate` | `{ policy }` | 288 cases, invariants, decisions and violations |
| POST | `/api/policies/activate` | `{ policy, intent, source, signed: true }` | Re-simulates, activates and ledger-records a version |
| GET | `/api/seed` | — | Seeded subscriptions plus server-side policy decisions |
| POST | `/api/recover` | `{ subscriptionId }` | `AWAITING_APPROVAL` proposal bound to policy hash |
| POST | `/api/approve` | `{ proposalId, confirmed: true, approvedBy }` | Capability consumption, capture, read-back and evidence URL |
| GET | `/api/evidence/{proposalId}` | — | Signed recovery passport |
| POST | `/api/evidence/verify` | Passport JSON | Payload, ledger, key and signature checks |
| POST | `/api/explain` | `{ subscriptionId }` | Deterministic or LLM failure explanation |
| GET | `/api/ledger` | — | Hash-chained events in insertion order |
| GET | `/api/health` | — | Environment, policy hash, evidence key ID and configuration |
| POST | `/api/webhooks/paypal` | PayPal event | Signature verification, dedupe and chained event |

`/api/approve` remains the only capture route. `APPROVER_TOKEN`, when configured, is checked before proposal lookup.

## Capability security

The signed payload contains:

```text
proposalId · subscriptionId · amount(decimal string) · currency
policyHash · requestId · nonce · expiresAt
```

The server issues and consumes the capability inside the approval request, after authentication, fresh subscription/policy validation and provider configuration checks. Consumption is synchronous before the first provider await. A replay returns `409`; an expired capability returns `410`.

The process-random HMAC secret and consumed nonce set reset on restart. This is appropriate for the demo's immediate approval flow, not a distributed authorization service.

## Evidence and trust model

A passport uses `recover-passport/v1` and contains:

- Proposal and policy version.
- Redacted before/read-back subscription snapshots.
- Approver display name, timestamp and capability hash.
- Capture and activation results.
- Complete ledger chain, not a filtered segment.
- Canonical payload hash, Ed25519 signature, public key and key ID.

Verify through the UI/API or independently:

```bash
npx tsx web/scripts/verify-evidence.mjs <passport.json>
```

Set `RECOVER_PUBLIC_KEY_ID` to require a specific trusted key. Without that anchor, the CLI proves internal integrity and signature validity, not server identity.

The demo Ed25519 keypair is process-random and changes on restart. A production deployment needs persistent key management, a trusted key directory, authenticated approver identities and durable sequence allocation. Passport JSON is merchant-scope evidence, not a public subscriber receipt.

## Interface architecture

Four stages match the user's decisions rather than the implementation modules:

1. **Mandate** — intent editor and non-negotiable guardrails.
2. **Simulation** — metrics, invariants, ordered rules, scenario filtering and signed activation.
3. **Recoveries** — portfolio metrics, subscription table, renewal timeline and case-file approval.
4. **Evidence** — before/after receipt, capability/policy hashes, integrity checks and download.

References used for interaction patterns:

- [LaunchDarkly targeting rules](https://launchdarkly.com/docs/home/flags/manage-rules): ordered rules and explicit review/save.
- [Temporal Web UI](https://docs.temporal.io/web-ui): workflow metadata, timeline, JSON history and history download.
- [Stripe revenue recovery](https://docs.stripe.com/billing/revenue-recovery/smart-retries): policy-centric recovery configuration and failure-state separation.
- [GitHub deployment review](https://docs.github.com/actions/managing-workflow-runs/review-deployments): explicit review before a consequential operation.

The interface uses native buttons, forms, checkboxes and disclosure elements; named landmarks; visible focus; keyboard-scrollable tables and JSON regions; server-driven decisions; responsive grids; and an internally scrollable stage navigator on narrow screens. Mock and sandbox states use different wording as well as badges. Browser verification measured all four stages at 390px with zero horizontal overflow and zero axe violations.

## Demo limits

- In-memory state resets on restart and does not coordinate multiple instances.
- Seed subscriptions remain mock data even when sandbox credentials exist.
- No real sandbox capture, hosted demo or video has been produced.
- Policy activation uses an explicit demo signature, not an authenticated admin account.
- Approver display names are self-reported; `APPROVER_TOKEN` is a shared demo secret.
- There is no reconciliation worker for `PENDING_VERIFICATION`.
- There is no sponsor-tool integration.

## Verification

```bash
npx tsx --test web/lib/policy.test.mjs web/lib/simulation.test.mjs \
  web/lib/capability.test.mjs web/lib/evidence.test.mjs \
  web/lib/explain.test.mjs web/lib/explain-llm.test.mjs
node --test spike/state_machine.test.mjs
node --experimental-strip-types web/scripts/state-matrix.mjs
node --experimental-strip-types web/scripts/paypal-smoke.mjs
node --test web/scripts/sandbox-check.test.mjs
npm --prefix web run build
```

For concurrency, start a fresh server and run `node web/scripts/load-check.mjs`.

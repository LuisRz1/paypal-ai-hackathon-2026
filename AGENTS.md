# AGENTS.md

Instructions for AI coding agents working in this repository.

**Project:** Recover — PayPal AI Hackathon 2026
**Repo:** https://github.com/LuisRz1/paypal-ai-hackathon-2026
**License:** MIT

---

## 1. What this repository is

Two things live here:

1. **`00 - Inicio/` … `08 - Referencias/`** — an Obsidian vault with PayPal documentation, hackathon rules, sponsor analysis, a 310-repo landscape, architecture patterns, and 30+ audit rounds.
2. **`web/`** — an executable Next.js app that implements **Recover**.

`spike/` is the first standalone state-machine artifact; `web/lib/state-machine.ts` is the app version.

The app is **mock-first**. A real PayPal sandbox client exists, but a live sandbox capture has **not** been executed. Do not claim otherwise.

---

## 2. Product

**Recover** is a PayPal-native recovery tool for suspended subscriptions.

Flow:

1. Compile merchant intent into a constrained, versioned recovery policy.
2. Simulate 288 cases and require zero violations before signed activation.
3. Detect a failed subscription payment and explain the PayPal `reason_code`.
4. Propose capturing the `outstanding_balance` under the active policy hash.
5. Require explicit human confirmation and consume a single-use capability bound to the exact operation.
6. Capture with `capture_type: OUTSTANDING_BALANCE`.
7. Read the subscription back and activate if still suspended.
8. Append hash-chained ledger entries and issue an Ed25519-signed recovery passport.

**Pitch:** “PayPal already retries. Recover makes the merchant act on the outstanding balance before the subscriber churns.”

Target: small SaaS / subscription merchants with 1k–10k subscriptions.

---

## 3. Non-negotiable invariants

These are architectural rules, not preferences.

1. **AI proposes; code decides; PayPal verifies.**
   - The LLM never holds PayPal credentials.
   - The LLM never sets amounts, recipients, or statuses.
   - Amounts come from PayPal's `billing_info.outstanding_balance`.

2. **Server-side writes only.**
   - The browser never creates an order or capture.
   - Secrets stay server-side.
   - `PAYPAL_CLIENT_SECRET` is never exposed via `NEXT_PUBLIC_*`.

3. **Sandbox only.**
   - `web/lib/paypal.ts` rejects any host that is not `api-m.sandbox.paypal.com` (or localhost with `allowLocal`).
   - Do not point this app at live PayPal.

4. **No blind retry on capture.**
   - `GET` requests retry `429`/`5xx`.
   - `POST /capture` and `POST /activate` do **not** retry `5xx`, because the capture may have succeeded.
   - An uncertain outcome becomes `PENDING_VERIFICATION`.

5. **Human approval.**
   - `/api/recover` creates `AWAITING_APPROVAL`.
   - `/api/approve` is the only route that executes a capture and requires `confirmed: true`.
   - Approval issues and consumes a single-use HMAC capability bound to proposal, subscription, decimal amount, currency, policy hash and request ID.
   - Capability replay is rejected; uncertain outcomes cannot be re-approved blindly.
   - `APPROVER_TOKEN` is optional, but if set, `/api/approve` requires `Authorization: Bearer <token>`.

6. **Idempotency and dedupe.**
   - `PayPal-Request-Id` on capture.
   - One pending proposal per subscription.
   - Webhook dedupe by `event.id`.
   - Mock `recovered` flag blocks a second capture.

7. **Read-back.**
   - After capture, call `getSubscription`.
   - `verified` only if `billing_info.outstanding_balance.value === 0`.
   - If status is still `SUSPENDED`, call `/activate`.

8. **Honest state.**
   - Never label a mock capture or mock read-back as real PayPal evidence.
   - Never claim sandbox evidence that was not executed.
   - `SUBMISSION.md` distinguishes real vs mock.

9. **Verifiable evidence.**
   - Ledger events are appended with sequence, previous hash and content hash.
   - Recovery passports include the complete chain and an Ed25519 signature.
   - Policy activation repeats the 288-case simulation server-side.
   - Process-local keys and stores are demo limits, not persistent trust anchors.

---

## 4. Repository map

```text
00 - Inicio/              MOC, estado, decisiones
01 - Hackathon/           reglas, fechas, premios, checklist
02 - PayPal/              auth, checkout, subs, invoicing, payouts, disputes,
                          reports, APMs, webhooks, MCP, compliance
03 - Sponsors/            AG Grid, Bryntum, Channel3, otros
04 - Referencia GitHub/   landscape + 30+ rondas de auditoría
05 - Patrones/            arquitectura, confianza, demo
06 - Modelos/             A/B/C/D + comparativa
07 - Ejecucion/           stack, backlog, video, esquema de datos
08 - Referencias/         enlaces y glosario

spike/                    primer state machine + tests (16)
web/                      app Next.js
  app/                    UI + API routes
  lib/                    estado, PayPal, mock, stores, explainer
  scripts/                sandbox-check, load-check, state-matrix, smoke
  public/demo.png         screenshot real
  seed.json               datos de demo
  next.config.mjs         security headers
README.md                 portada del repo
SUBMISSION.md             draft de Devpost
THIRD_PARTY_NOTICES.md    licencias
render.yaml               blueprint de Render
```

**Vault entry point:** `00 - Inicio/00 Inicio.md`.

---

## 5. Stack

| Capa | Elección |
|---|---|
| Runtime | Node.js **22+** (`Promise.withResolvers`) |
| Framework | Next.js 15.5.28 (App Router) |
| UI | React 19.3.1 + TypeScript 5.9.3 |
| Styles | CSS plano en `web/app/globals.css` |
| PayPal | REST + `fetch`, sin SDK de servidor |
| IA | Policy compiler and failure explainer with deterministic fallbacks; optional OpenAI-compatible LLM |
| Persistencia | En memoria (demo) |
| Deploy | Render (`render.yaml`) |

---

## 6. Quick start

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100.

No credentials needed: the app uses the mock.

With sandbox credentials:

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export PAYPAL_WEBHOOK_ID=...        # optional
export APPROVER_TOKEN=...           # optional
npm run start -- -p 3100
```

---

## 7. API routes

| Method | Route | Purpose | Auth |
|---|---|---|---|
| GET | `/api/policies/active` | Active policy version and hashes | none |
| POST | `/api/policies/compile` | Compile and validate merchant intent | none |
| POST | `/api/policies/simulate` | Run the 288-case policy simulation | none |
| POST | `/api/policies/activate` | Re-simulate and activate with explicit signature | none |
| GET | `/api/seed` | 4 seeded subscriptions + policy decisions | none |
| POST | `/api/recover` | Create `AWAITING_APPROVAL` proposal | none |
| POST | `/api/approve` | Confirm, consume capability, capture, verify, ledger | `APPROVER_TOKEN` if set |
| GET | `/api/evidence/{proposalId}` | Signed recovery passport | none |
| POST | `/api/evidence/verify` | Verify passport and ledger integrity | none |
| POST | `/api/explain` | Deterministic/LLM `reason_code` explanation | none |
| GET | `/api/ledger` | Proposal/capture/verify/webhook events | none |
| GET | `/api/health` | Config and ledger status | none |
| POST | `/api/webhooks/paypal` | Signature check, dedupe, ledger | `PAYPAL_WEBHOOK_ID` or `ALLOW_UNVERIFIED_WEBHOOKS=true` |

### Request shapes

```json
POST /api/recover   { "subscriptionId": "SUB-1002" }
POST /api/approve   { "proposalId": "uuid", "confirmed": true, "approvedBy": "Demo merchant" }
POST /api/explain   { "subscriptionId": "SUB-1002" }
```

### Status codes

- `400` invalid body.
- `401` missing/invalid approver token.
- `404` subscription/proposal not found.
- `409` no capture proposed, duplicate pending proposal, already recovered, or proposal not in `AWAITING_APPROVAL`.
- `422` deterministic payment failure.
- `202` capture outcome uncertain (`PENDING_VERIFICATION`).
- `200` success.

---

## 8. State machine

Subscription statuses: `ACTIVE`, `SUSPENDED`, `EXPIRED`, `CANCELLED`.

Proposal statuses:

```text
AWAITING_APPROVAL
EXECUTED
VERIFIED
PENDING_VERIFICATION
FAILED
```

Transitions:

```text
ACTIVE + failure < threshold        -> WAIT
ACTIVE/SUSPENDED + outstanding > 0  -> CAPTURE
SUSPENDED + outstanding == 0        -> ACTIVATE
EXPIRED                             -> ESCALATE
CANCELLED                           -> NONE
currency mismatch                   -> BLOCK
```

After capture:

```text
ACTIVE + balance 0       -> DONE
SUSPENDED + balance 0    -> ACTIVATE
EXPIRED                  -> ESCALATE
anything else            -> VERIFY / PENDING_VERIFICATION
```

Canonical implementation: `web/lib/state-machine.ts`.

---

## 9. PayPal capture rules

`POST /v1/billing/subscriptions/{id}/capture`

```json
{
  "note": "Outstanding balance recovered",
  "capture_type": "OUTSTANDING_BALANCE",
  "amount": { "value": "49.00", "currency_code": "USD" }
}
```

Required: `note`, `capture_type`, `amount`.

Rules:

- `capture_type` only accepts `OUTSTANDING_BALANCE`.
- `note` 1–128 characters.
- `amount` must not exceed `outstanding_balance`.
- Capture is allowed in `ACTIVE`, `SUSPENDED`, `EXPIRED`.
- `PayPal-Request-Id` is supported; use it.

Known 422 issues:

`ZERO_OUTSTANDING_BALANCE`, `AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE`, `CURRENCY_MISMATCH`, `SUBSCRIPTION_STATUS_INVALID`, `SUBSCRIBER_ACCOUNT_LOCKED`, `SUBSCRIBER_ACCOUNT_CLOSED`, `SUBSCRIBER_ACCOUNT_RESTRICTED`, `USER_ACCOUNT_CLOSED`.

Mapping:

| Issue | Action |
|---|---|
| `ZERO_OUTSTANDING_BALANCE` | done / no-op |
| `AMOUNT_GREATER...` | recompute |
| `CURRENCY_MISMATCH` | block |
| `SUBSCRIPTION_STATUS_INVALID` | refresh; expire -> escalate |
| account locked/closed/restricted | escalate |
| `5xx` / timeout | `PENDING_VERIFICATION` |

---

## 10. Environment variables

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=
ALLOW_UNVERIFIED_WEBHOOKS=false
APPROVER_TOKEN=

OPENAI_API_KEY=
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

- Without PayPal credentials, the app uses the mock.
- Partial credentials (`ID` without `SECRET`, or vice versa) return `503` on `/api/approve`.
- `ALLOW_UNVERIFIED_WEBHOOKS=true` is for local demo only.
- `APPROVER_TOKEN` is optional locally; set it in any deployed environment.

---

## 11. Commands

### App

```bash
cd web
npm run dev
npm run build
npm run start -- -p 3100
```

### Tests

```bash
# State machine: 16 tests
node --test spike/state_machine.test.mjs

# 288-case state matrix
node --experimental-strip-types web/scripts/state-matrix.mjs

# PayPal client + capture/activate/webhook contract
node --experimental-strip-types web/scripts/paypal-smoke.mjs

# Runner: dry run, execute, zero balance, unknown, live refusal
node --test web/scripts/sandbox-check.test.mjs

# Policy, simulation, capability, evidence and explainers
npx tsx --test web/lib/policy.test.mjs web/lib/simulation.test.mjs web/lib/capability.test.mjs web/lib/evidence.test.mjs web/lib/explain.test.mjs web/lib/explain-llm.test.mjs

# Independent recovery passport verification
npx tsx web/scripts/verify-evidence.mjs <passport.json>

# LLM explainer fallback/validation
npx tsx --test web/lib/explain-llm.test.mjs

# Load/concurrency (fresh server required)
node web/scripts/load-check.mjs
```

### Real sandbox

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export SUBSCRIPTION_ID=I-...
node --experimental-strip-types web/scripts/sandbox-check.mjs
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

`--save` writes `docs/evidence/sandbox-*.json`.

---

## 12. Testing rules

- Every state transition change must keep `state-matrix.mjs` at **0 violations**.
- Every policy change must pass the policy/simulation tests and keep activation at **0 violations**.
- Every approval change must cover binding tampering, expiry, replay and missing explicit confirmation.
- Every evidence change must verify the complete ledger chain and detect payload/signature tampering.
- Every PayPal client change must pass `paypal-smoke.mjs`.
- Every runner change must pass `sandbox-check.test.mjs`.
- Every capture change must cover the 8 error issues.
- UI changes must be checked with a real browser: page renders, timeline has 4 rows, `SUB-1002` can be proposed and approved.
- Do not add tests for wiring, mocks echoing themselves, or trivial defaults. Test behavior, boundaries, invariants, transitions, and errors.

Verified baseline:

```text
build:            OK
control-plane:    43/43
runner tests:     5/5
state matrix:     288/288
load:             1 winner / 1 webhook event
evidence:         valid passport; tampering rejected
a11y:             0 violations (all four stages)
mobile:           390/390 (all four stages)
vulnerabilities:  0
```

---

## 13. Code conventions

- TypeScript strict; no `any` unless unavoidable at a JSON boundary.
- Next.js App Router; route handlers in `app/api/**/route.ts`.
- Import alias: `@/*` -> `web/*`.
- Prefer plain `fetch` for PayPal; do not add an SDK.
- Use `Record` for static string-keyed tables.
- Use `Set`/`Map` only for dynamic membership or iteration.
- Prefer `Promise.withResolvers()` over `new Promise(executor)`.
- Avoid one-expression wrapper functions; inline them.
- Keep money as decimal strings at the PayPal boundary; convert carefully.
- Never use floating point for cent arithmetic.
- `crypto.randomUUID()` for proposal/request IDs.
- Use `Object.create(null)` for keyed stores that receive user input.

---

## 14. Security rules

- No secrets in the repo; `.env` is git-ignored.
- No `client_secret` in client components.
- Sandbox host allow-list in `web/lib/paypal.ts`.
- Verify webhook signatures when `PAYPAL_WEBHOOK_ID` is set.
- Dedupe webhooks by `event.id`.
- Reject malformed JSON with `400`.
- Auth check before proposal lookup in `/api/approve`.
- `APPROVER_TOKEN` required in deployed environments.
- No rate limiting yet; add it at the platform edge before a public launch.
- No CSP yet; Next.js inline scripts make it non-trivial. Do not add a broken CSP.

---

## 15. Deployment

`render.yaml` is the source of truth:

- `rootDir: web`
- `NODE_VERSION=22`
- `npm ci && npm run build`
- `npm run start -- -p $PORT`
- health check `/api/health`
- secrets with `sync: false`

Not deployed yet. Do not claim a live URL.

---

## 16. Vault conventions

- Obsidian-flavored Markdown.
- YAML frontmatter with `title`, `tags`, `updated`.
- Wikilinks `[[Note name]]`; filenames must stay unique.
- MOC at `00 - Inicio/00 Inicio.md`; add every new note there.
- Runtime logs, evidence and screenshots go in `99 - Adjuntos/` (or `web/public/` for app assets).
- Keep notes in Spanish; code and submission docs in English.

---

## 17. Current status

| Área | Estado |
|---|---|
| Vault | 65+ notes, 0 broken wikilinks |
| App | Mock-first control plane: policy, simulation, approval, capture and evidence |
| Control plane | Versioned DSL, 288-case simulator, single-use capabilities, signed passports |
| PayPal client | Implemented, contract-tested against fake server |
| Real sandbox | **Not executed** |
| Webhook | Dedupe + signature verification implemented |
| LLM | Deterministic by default; optional provider |
| Deploy | Blueprint ready; **not deployed** |
| Video | Script ready; **not recorded** |
| Sponsor prize | None; no sponsor tool integrated |
| Readiness | **90/100** (internal estimate) |

### Blockers

1. `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `SUBSCRIPTION_ID`.
2. Render account / authorization.
3. Video recording.

Do not invent progress on these.

---

## 18. Definition of done for a change

A change is done only when:

1. The behavior is implemented end-to-end.
2. The relevant test or smoke command passes.
3. Docs touched by the change are updated (`web/README.md`, `SUBMISSION.md`, vault note).
4. No secrets, no mock claims, no dead code.
5. The vault MOC links any new note.

---

## 19. Do not

- Do not switch to live PayPal.
- Do not add a sponsor tool and claim eligibility without integrating it.
- Do not copy code from the PayPal AG Grid boilerplate (no license file).
- Do not copy MIT/Apache code without adding attribution to `THIRD_PARTY_NOTICES.md`.
- Do not remove the write gate, approval, dedupe, or read-back to simplify.
- Do not mark an uncertain capture as `FAILED`.
- Do not retry `5xx` on capture/activate.
- Do not claim a real sandbox capture, hosted demo, or video that does not exist.

---

## 20. References

- Hackathon: https://paypalaihackathon.devpost.com/
- PayPal Subscriptions: https://developer.paypal.com/subscriptions/about
- Payment failures: https://developer.paypal.com/subscriptions/payment-failure-retry
- Subscriptions API: https://developer.paypal.com/api/subscriptions/v1/
- Webhooks: https://developer.paypal.com/api/rest/webhooks/
- Sandbox: https://developer.paypal.com/sandbox-testing/overview
- Demo: `web/DEMO.md`
- Control-plane architecture: `web/CONTROL_PLANE.md`
- Submission: `SUBMISSION.md`
- Vault: `00 - Inicio/00 Inicio.md`

# Devpost submission draft — Recover Control Plane

> Status: draft. Do not submit until the video, hosted demo and real sandbox evidence are added.

## One-liner

**Recover turns a merchant’s recovery mandate into a tested PayPal policy, binds human approval to one exact operation, and returns tamper-evident proof.**

![Recover control plane](web/public/demo.png)

## Problem

PayPal retries a failed subscription payment up to twice per billing cycle. If the attempts fail, the amount moves to the subscription’s **outstanding balance**, and the subscription can be **suspended**. Small merchants often miss that state until the customer churns. Giving an AI agent authority to fix it introduces a second risk: an unsafe or duplicated financial action.

## Solution

Recover is a control plane for human-gated subscription recovery. The merchant describes the recovery mandate. AI compiles it into a constrained policy; deterministic code simulates it; a human approves one exact outstanding-balance capture; PayPal or the labeled mock executes; Recover reads the result back and issues a signed recovery passport.

## Demo workflow

1. **Mandate** — write recovery intent, including capture ceilings, allowed currencies and escalation rules.
2. **Simulation** — run 288 combinations of status, balance, failed payments, failure threshold and currency. Unsafe custom rules are blocked and reported.
3. **Signed activation** — explicitly review and activate a policy version. The server repeats the simulation rather than trusting the browser.
4. **Recovery case** — inspect the PayPal-shaped subscription, outstanding balance and failure explanation.
5. **Human approval** — authorize the exact amount. Approval creates a single-use HMAC capability bound to subscription, decimal amount, currency, policy hash and request ID.
6. **PayPal execution** — the server captures with `capture_type: OUTSTANDING_BALANCE`, reads the subscription back and activates it if still suspended.
7. **Recovery passport** — download Ed25519-signed evidence with a complete hash-chained ledger and independently verify its integrity.

## Where AI is significant

- Natural-language intent is compiled into a strict, versioned recovery-policy DSL.
- The compiler rejects invalid schemas, unknown actions and attempts to disable human approval.
- An optional OpenAI-compatible model performs compilation; a deterministic compiler is an explicit fallback, not a hidden claim of LLM execution.
- A separate deterministic/optional-LLM explainer translates the PayPal failure reason into merchant guidance.
- AI proposes and explains. It never holds PayPal credentials, invents amounts, activates captures or overrides deterministic safety.

## Where PayPal is significant

- Subscriptions API: `GET /v1/billing/subscriptions/{id}`, `capture`, `activate`.
- Capture uses the subscription’s outstanding balance and a stable `PayPal-Request-Id`.
- OAuth 2.0 client credentials with token caching.
- Webhook signature verification when configured, plus event-ID dedupe.
- Sandbox host allow-list; no live PayPal support.
- Read-back is required for real verification; uncertain outcomes become `PENDING_VERIFICATION`, never blind retries.

## Engineering proof

- 288-case policy simulator with six invariant groups.
- One-time capability binding, expiry and replay protection.
- Ed25519-signed `recover-passport/v1` evidence.
- Hash-chained ledger with sequence and previous-hash verification.
- Standalone passport verifier for tamper testing.
- Server-driven policy decisions and repeated activation checks.
- Segmented responsive UI with explicit approval, named landmarks and mock/sandbox wording.

## What is real vs mock

**Implemented and exercised locally:**

- Next.js app and all listed API routes.
- Policy compiler, deterministic fallback, simulation and signed activation.
- Human approval, single-use capabilities, mock capture and read-back evidence.
- Signed passports, ledger verification and standalone verifier.
- PayPal sandbox client code and contract tests against a fake server.
- State-matrix, runner, policy, capability, evidence and explainer tests.

**Mock:**

- Capture without `PAYPAL_CLIENT_ID`/`SECRET`.
- Four seeded subscriptions and the displayed recovery result.
- Process-local policy, proposal, ledger, nonce and key stores.

**Not yet executed or delivered:**

- Real sandbox `OUTSTANDING_BALANCE` capture.
- Hosted demo.
- Video.
- Durable persistence, trusted key management and reconciliation workers.

## Tools

- Next.js 15, React 19, TypeScript, Node.js 22.
- PayPal Subscriptions REST API and Webhooks.
- Optional OpenAI-compatible LLM.
- Native Node.js HMAC-SHA256 and Ed25519 cryptography.
- Render blueprint, not deployed.
- CSS timeline and control-plane UI; no sponsor tool integrated.

## Links

- Repo: https://github.com/LuisRz1/paypal-ai-hackathon-2026
- Architecture: [`web/CONTROL_PLANE.md`](web/CONTROL_PLANE.md)
- Local demo: [`web/DEMO.md`](web/DEMO.md)
- Video: pending
- Hosted demo: pending

## Compliance

- MIT license.
- `THIRD_PARTY_NOTICES.md` lists dependencies and external services.
- Sandbox/mock only; no real-money claims.
- No credentials in the repository.

## Devpost fields

| Field | Draft |
|---|---|
| Title | Recover Control Plane |
| Tagline | AI-compiled, human-approved PayPal recovery with verifiable proof |
| Built with | Next.js, React, TypeScript, PayPal Subscriptions API, PayPal Webhooks, OpenAI-compatible LLM, Node.js crypto |
| Try it | Local instructions in `web/DEMO.md` (hosted URL pending) |
| Video | Pending |
| GitHub | https://github.com/LuisRz1/paypal-ai-hackathon-2026 |

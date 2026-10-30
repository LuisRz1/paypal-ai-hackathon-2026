# Recover · web

Recover is a mock-first PayPal recovery control plane: AI compiles a merchant mandate, deterministic code tests and enforces it, a human authorizes one exact capture, and Recover emits signed evidence.

**No live sandbox capture has been executed.** Without PayPal credentials, all captures use the mock and are labeled as mock.

## Run

Requires Node.js 22+.

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100.

The four-stage UI covers:

1. **Mandate** — compile natural-language recovery intent into a constrained policy.
2. **Simulation** — run 288 deterministic cases and sign a version only with zero violations.
3. **Recoveries** — review `SUB-1002`, approve the exact outstanding balance and execute through mock or sandbox.
4. **Evidence** — verify the Ed25519 signature and hash-chained ledger, then download the passport.

Architecture, API contracts, UX references and trust limits: [`CONTROL_PLANE.md`](CONTROL_PLANE.md).

## Main APIs

- `POST /api/policies/compile` — compile `{ intent }` with the optional LLM or deterministic fallback.
- `POST /api/policies/simulate` — validate and simulate `{ policy }`.
- `POST /api/policies/activate` — re-simulate and activate with `{ signed: true }`.
- `GET /api/policies/active` — active version and integrity hashes.
- `GET /api/seed` — seeded subscriptions plus server-side policy decisions.
- `POST /api/recover` — create an `AWAITING_APPROVAL` proposal.
- `POST /api/approve` — require `{ proposalId, confirmed: true, approvedBy }`, consume a single-use capability, capture and read back.
- `GET /api/evidence/{proposalId}` — signed recovery passport.
- `POST /api/evidence/verify` — verify payload, ledger, key and signature.
- `POST /api/explain` — deterministic or optional-LLM failure explanation.
- `GET /api/health` — environment, configuration, active policy and evidence key.
- `POST /api/webhooks/paypal` — signature verification, dedupe and chained ledger event.

## Environment

Copy `.env.example` to `.env.local`. Without both PayPal credentials, the app uses the mock.

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=
ALLOW_UNVERIFIED_WEBHOOKS=false
APPROVER_TOKEN=
OPENAI_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

- `APPROVER_TOKEN` is optional locally and required in deployed environments.
- Partial PayPal credentials fail closed on approval.
- Capture and activation POSTs never retry `5xx`; uncertain outcomes become `PENDING_VERIFICATION`.
- Stores, HMAC secret and Ed25519 keypair are process-local and reset on restart.
- Never point the app at live PayPal.

## Verification

```bash
npx tsx --test web/lib/policy.test.mjs web/lib/simulation.test.mjs \
  web/lib/capability.test.mjs web/lib/evidence.test.mjs \
  web/lib/explain.test.mjs web/lib/explain-llm.test.mjs
node --test spike/state_machine.test.mjs
node --experimental-strip-types web/scripts/state-matrix.mjs
node --experimental-strip-types web/scripts/paypal-smoke.mjs
node --test web/scripts/sandbox-check.test.mjs
```

Run the commands from the repository root. For concurrency, start a fresh server on port 3100 and run `node web/scripts/load-check.mjs`.

## Still pending

- Real sandbox `OUTSTANDING_BALANCE` capture and saved evidence.
- Hosted deployment and video.
- Durable persistence, key management and reconciliation for uncertain outcomes.

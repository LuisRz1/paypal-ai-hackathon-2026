# Recover · web

Early Next.js app for the PayPal AI Hackathon. Sandbox/mock only; no PayPal calls yet.

## Run

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100.

## APIs

- `GET /api/seed` — 4 seeded subscriptions.
- `POST /api/recover` — `{ "subscriptionId": "SUB-1002" }` creates a proposal in `AWAITING_APPROVAL`.
- `POST /api/approve` — `{ "proposalId": "..." }` validates, captures with the mock and verifies.
- `GET /api/ledger` — proposal, capture and verification events.

## Webhook

- `POST /api/webhooks/paypal` — dedupes by `event.id` and writes a `webhook` ledger event.
- With `PAYPAL_WEBHOOK_ID`, it verifies the signature through PayPal.
- Without it, it returns `503` unless `ALLOW_UNVERIFIED_WEBHOOKS=true`.

## Current scope

- State machine for healthy, failed, suspended, expired and zero-balance subscriptions.
- Capture validation for amount, currency, status, note and decimals.
- Mock PayPal capture with the 8 provider errors.
- Real sandbox client (`web/lib/paypal.ts`) with OAuth, capture, activate and webhook verification.
- In-memory proposals and ledger.
- Mock UI; no real money.

## Environment

Copy `.env.example` to `.env.local` and fill the sandbox values. Without `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`, the app uses the mock.

## Next

- Run the sandbox `OUTSTANDING_BALANCE` capture with real credentials.
- Add the agent explanation and the Bryntum timeline.
- Persist proposals and ledger in Postgres.

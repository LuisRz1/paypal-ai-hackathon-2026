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

## Current scope

- State machine for healthy, failed, suspended, expired and zero-balance subscriptions.
- Capture validation for amount, currency, status, note and decimals.
- Mock PayPal capture with the 8 provider errors.
- In-memory proposals and ledger.
- Mock UI; no PayPal credentials, no real money.

## Next

- Replace the mock with the PayPal sandbox `OUTSTANDING_BALANCE` capture.
- Add the agent explanation and the Bryntum timeline.
- Persist proposals and ledger in Postgres.

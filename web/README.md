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
- `POST /api/recover` — `{ "subscriptionId": "SUB-1002" }` returns the next action.

## Current scope

- State machine for healthy, failed, suspended, expired and zero-balance subscriptions.
- Capture validation for amount, currency, status, note and decimals.
- Mock UI; no PayPal credentials, no real money.

## Next

- Mock PayPal client with the 8 capture errors.
- Approval gate and ledger.
- Sandbox `OUTSTANDING_BALANCE` capture.

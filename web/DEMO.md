# Recover · 90-second demo

Sandbox/mock only. No real money.

## Run

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100.

## Judge path

1. **Timeline** — four subscriptions. `SUB-1002` is suspended with a $49 outstanding balance.
2. **Propose** — click “Propose recovery” on `SUB-1002`.
3. **Explanation** — the agent shows `PAYMENT_DENIED`, the likely cause and the recommended action.
4. **Approve** — click “Approve recovery”.
5. **Verify** — the result shows `VERIFIED`, a `captureId`, and ledger events `proposal`, `capture`, `verify`.
6. **Health** — open `/api/health`; it reports `mock` when no PayPal credentials are set.

## Expected API output

```bash
curl -s http://127.0.0.1:3100/api/health | jq
curl -s -X POST http://127.0.0.1:3100/api/recover \
  -H 'content-type: application/json' \
  -d '{"subscriptionId":"SUB-1002"}' | jq
```

## Real sandbox check

From the repo root, with sandbox credentials:

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export SUBSCRIPTION_ID=I-...
node --experimental-strip-types web/scripts/sandbox-check.mjs
```

Dry run by default: prints status, outstanding balance, currency and failed-payment details.

To capture the outstanding balance:

```bash
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

`--save` writes the evidence to `docs/evidence/sandbox-*.json`. The client refuses any host that is not the PayPal sandbox.

## Limits

- No PayPal credentials means mock capture.
- The proposal and ledger stores are in memory; restarting resets them.
- `APPROVER_TOKEN` is optional; set it and send `Authorization: Bearer <token>` to `/api/approve`.
- This is not production software; it is a hackathon prototype.

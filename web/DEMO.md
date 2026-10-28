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

## Limits

- No PayPal credentials means mock capture.
- The proposal and ledger stores are in memory; restarting resets them.
- `APPROVER_TOKEN` is optional; set it and send `Authorization: Bearer <token>` to `/api/approve`.
- This is not production software; it is a hackathon prototype.

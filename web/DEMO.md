# Recover · control-plane demo

This path exercises the implemented mock flow. It does not claim a real PayPal capture.

## Run

Requires Node.js 22+.

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100. The header must say **Mock environment** without credentials.

## Guided path

1. **Mandate** — keep the prepared mandate: USD only, a $100 capture ceiling, account-risk escalation and mandatory approval. Select **Compile mandate**. Without an LLM key, the source is explicitly **Deterministic**.
2. **Simulation** — select **Run 288 checks**. Expected: **288/288 passed**, zero violations and six passing invariant groups. Inspect decisions in the scenario explorer.
3. **Activate** — check the policy-review box and select **Sign and activate**. The server repeats the simulation before accepting the version.
4. **Recoveries** — the timeline has four rows. Select **Review recovery** for `SUB-1002`; the case shows a suspended subscription and **USD 49.00** outstanding.
5. **Approval** — enter an approver display name and check the exact-capture authorization. The button stays disabled until confirmation. Select **Approve and capture**.
6. **Evidence** — expected status: **Verified by mock read-back**. The receipt contains the before/after balance, approver, request ID, policy hash and single-use capability hash.
7. **Integrity** — select **Verify integrity**. Expected: structure, payload hash, ledger, key ID, trusted key ID and signature all pass. Download the JSON passport.

## Independent verification

From the repository root:

```bash
npx tsx web/scripts/verify-evidence.mjs <passport.json>
```

To test tamper detection, change a value in a copy of the downloaded payload and run the verifier again. It must fail.

## API smoke

```bash
curl -s -X POST http://127.0.0.1:3100/api/policies/compile \
  -H 'content-type: application/json' \
  -d '{"intent":"Allow only USD, cap captures at $100, and always require approval"}' | jq

curl -s -X POST http://127.0.0.1:3100/api/recover \
  -H 'content-type: application/json' \
  -d '{"subscriptionId":"SUB-1002"}' | jq
```

Approval requires the returned proposal ID plus explicit confirmation:

```json
{
  "proposalId": "<uuid>",
  "confirmed": true,
  "approvedBy": "Demo merchant"
}
```

## Real sandbox check

The standalone runner remains the correct way to test real sandbox credentials:

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export SUBSCRIPTION_ID=I-...
node --experimental-strip-types web/scripts/sandbox-check.mjs
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

Dry run by default. `--execute --save` performs the capture and writes `docs/evidence/sandbox-*.json`. This has **not** been executed with real credentials.

## Limits

- Stores and signing keys reset on restart.
- Mock success is labeled mock; it is not PayPal evidence.
- `APPROVER_TOKEN` is a shared demo secret, not approver identity.
- `PENDING_VERIFICATION` has no reconciliation worker yet.
- Hosted demo and video remain pending.

# Spike · Recover state machine

First executable artifact for the Recover demo. It validates the rules before any UI or PayPal call.

## What is tested

1. **State machine**: healthy, failed, suspended, expired, zero balance.
2. **Capture validation**: amount, currency, status, note, decimals.
3. **PayPal capture errors**: zero balance, amount greater, currency mismatch, invalid status, account restricted/closed.
4. **Demo seed**: four subscriptions with a deterministic expected action.

## Run

```bash
node --test spike/state_machine.test.mjs
node spike/demo.mjs
```

Expected demo output: `SUB-1002` → `CAPTURE`, `SUB-1003` → `WAIT`, `SUB-1004` → `ESCALATE`, `SUB-1001` → `NONE`.

## Why this exists

The API review found that `capture` only accepts `OUTSTANDING_BALANCE`, `amount <= outstanding_balance`, and a few statuses. This spike encodes those rules so the real app can call the same functions.

## Next

Replace the in-memory seed with PayPal sandbox data and wire `capture` behind the approval gate.

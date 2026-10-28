---
title: Décima ronda · Approval y ledger
tags: [auditoria, app, approval, ledger, browser]
updated: 2026-10-28
---

# Décima ronda · Approval y ledger

Tres iteraciones ejecutadas sobre la app: mock PayPal, approval gate y verificación en navegador.

## Iteración 1 — Mock PayPal

`web/lib/paypal-mock.ts` simula la captura `OUTSTANDING_BALANCE` y los 8 errores 422:

- `ZERO_OUTSTANDING_BALANCE`
- `AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE`
- `CURRENCY_MISMATCH`
- `SUBSCRIPTION_STATUS_INVALID`
- `SUBSCRIBER_ACCOUNT_CLOSED`
- `SUBSCRIBER_ACCOUNT_LOCKED`
- `SUBSCRIBER_ACCOUNT_RESTRICTED`
- `USER_ACCOUNT_CLOSED`

El `captureId` se deriva del `requestId`, así un reintento es idempotente en el mock.

## Iteración 2 — Approval gate y ledger

- `POST /api/recover` crea una propuesta `AWAITING_APPROVAL` y escribe un evento `proposal`.
- `POST /api/approve` valida con `validateCapture`, captura con el mock y escribe `capture`.
- Después hace read-back y escribe `verify`.
- Una segunda aprobación devuelve `409`.
- Un error de validación devuelve `422` y escribe `failure`.

## Iteración 3 — Verificación en navegador

Chromium headless abrió `http://127.0.0.1:3100`:

- 4 filas renderizadas.
- Click en `SUB-1002` → propuesta `CAPTURE 49.00 USD`.
- Click en “Approve recovery” → `VERIFIED`.
- Ledger: `proposal`, `capture`, `verify`.

```text
proposal=af17f85e...
APPROVE: { status: "VERIFIED", verified: true, captureId: "CAP-a24e8a1f" }
LEDGER: { count: 3, types: ["proposal","capture","verify"] }
DUPLICATE: 409
ERROR PATH: { error: "CURRENCY_MISMATCH", status: "FAILED" }
```

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + approval + ledger | 20/30 |
| PayPal sandbox | 0/15 |
| IA | 0/10 |
| Demo/video | 0/15 |
| **Readiness** | **50/100** |

## Próximo paso

1. Sustituir el mock por el sandbox real.
2. Añadir explicación del `reason_code` por el agente.
3. Timeline Bryntum.
4. Deploy y video.

## Enlaces

- [[50 Novena ronda - App ejecutable]]
- [`web/README.md`](../web/README.md)
- [[47 Sexta ronda - Errores tests y legal]]

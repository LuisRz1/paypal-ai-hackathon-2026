---
title: Undécima ronda · Sandbox y webhooks
tags: [auditoria, paypal, sandbox, webhooks]
updated: 2026-10-28
---

# Undécima ronda · Sandbox y webhooks

Tres iteraciones sobre la integración real: cliente sandbox, webhook y smoke en runtime.

## Iteración 1 — Cliente PayPal sandbox

`web/lib/paypal.ts`:

- OAuth con cache de token.
- `getSubscription`.
- `captureOutstanding` con `capture_type: OUTSTANDING_BALANCE` y `PayPal-Request-Id`.
- `activateSubscription` con `reason`.
- `verifyWebhook` contra `/v1/notifications/verify-webhook-signature`.
- **Allow-list de host**: solo `api-m.sandbox.paypal.com` (o localhost con `allowLocal`).

Smoke con servidor falso local:

```text
POST /v1/oauth2/token
GET  /v1/billing/subscriptions/SUB-1
POST /v1/billing/subscriptions/SUB-1/capture
POST /v1/billing/subscriptions/SUB-1/activate
POST /v1/notifications/verify-webhook-signature
paypal client smoke: ok
```

Se verificó el body de captura: `OUTSTANDING_BALANCE`, `49.00`, `PayPal-Request-Id: req-1`.

## Iteración 2 — Webhook

`POST /api/webhooks/paypal`:

- Requiere `event.id`.
- Dedupe por `event.id`.
- Si `PAYPAL_WEBHOOK_ID` existe, verifica firma.
- Si no existe, solo acepta con `ALLOW_UNVERIFIED_WEBHOOKS=true`.
- Escribe un evento `webhook` en el ledger.

## Iteración 3 — Runtime smoke

Con `ALLOW_UNVERIFIED_WEBHOOKS=true`:

```text
WEBHOOK:    {"received":true}
DUPLICATE:  {"duplicate":true}
APPROVAL:   { status: "VERIFIED", verified: true }
LEDGER:     { count: 4, types: ["webhook","proposal","capture","verify"] }
```

## Hallazgos

1. El cliente rechaza cualquier host que no sea sandbox; evita live por accidente.
2. La captura real exige `note`, `capture_type` y `amount` exacto.
3. El webhook sin `PAYPAL_WEBHOOK_ID` es inseguro; por eso el default es `503`.
4. No se ha probado contra sandbox real: faltan credenciales.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + approval + ledger | 20/30 |
| PayPal client + webhook | 5/15 |
| IA | 0/10 |
| Demo/video | 0/15 |
| **Readiness** | **55/100** |

## Próximo paso

1. Credenciales sandbox y `capture` real.
2. Read-back y `activate` contra sandbox.
3. Explicación del `reason_code` por el agente.
4. Timeline Bryntum.
5. Deploy + video.

## Enlaces

- [[50 Novena ronda - App ejecutable]]
- [[51 Decima ronda - Approval y ledger]]
- [`web/README.md`](../web/README.md)

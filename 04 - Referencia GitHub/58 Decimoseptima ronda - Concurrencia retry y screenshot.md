---
title: Decimoséptima ronda · Concurrencia, retry y screenshot
tags: [auditoria, concurrencia, retry, submission]
updated: 2026-10-28
---

# Decimoséptima ronda · Concurrencia, retry y screenshot

Tres iteraciones sobre robustez y assets.

## Iteración 1 — Concurrencia

Con `APPROVER_TOKEN=secret`:

| Prueba | Resultado |
|---|---|
| Dos approves simultáneos | `200` + `409` |
| Dos recovers simultáneos | `200` + `409` |
| Dos webhooks simultáneos | `received` + `duplicate` |
| Ledger de webhooks | 1 evento, no 2 |

**Fix:** el webhook reserva `event.id` **antes** de cualquier `await` y borra la reserva si la verificación falla. Así dos entregas concurrentes no procesan el mismo evento.

## Iteración 2 — Retry y backoff

`web/lib/paypal.ts` reintenta `429` y `5xx` hasta 2 veces con backoff 250/500 ms. Usa `Promise.withResolvers`.

Smoke con servidor falso que devuelve `500` la primera vez:

```text
GET /v1/billing/subscriptions/SUB-RETRY
GET /v1/billing/subscriptions/SUB-RETRY
paypal client smoke: ok
```

También se ajustó `tsconfig` a `lib: es2024` para `Promise.withResolvers`.

## Iteración 3 — Screenshot

Capturada la UI real en Chromium:

- `web/public/demo.png`.
- 84 KB, PNG válido.
- Insertada en `SUBMISSION.md`.

La captura muestra timeline, tabla y acciones; sirve para la galería de Devpost.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + mobile | 28/30 |
| PayPal client + retry | 6/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot | 6/10 |
| **Readiness** | **80/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.
4. Bryntum real o aceptar timeline CSS.

## Enlaces

- [[57 Decimosexta ronda - API clean build y submission]]
- [`SUBMISSION.md`](../SUBMISSION.md)
- [`web/public/demo.png`](../web/public/demo.png)

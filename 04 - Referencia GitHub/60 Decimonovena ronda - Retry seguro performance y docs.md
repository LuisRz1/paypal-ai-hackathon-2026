---
title: Decimonovena ronda · Retry seguro, performance y docs
tags: [auditoria, retry, performance, docs]
updated: 2026-10-28
---

# Decimonovena ronda · Retry seguro, performance y docs

Tres iteraciones sobre el código congelado, sin nuevas features.

## Iteración 1 — Bug de retry en POST

**Hallazgo:** `web/lib/paypal.ts` reintentaba `5xx` en **todas** las requests, incluido `POST /capture`. Un `500` después de que PayPal capturó podía provocar una segunda captura.

**Fix:** `request()` acepta `retry5xx`; por defecto solo los GET reintentan. `capture` y `activate` pasan `retry5xx: false`. `429` sigue reintentando porque no implica procesamiento.

Smoke:

```text
POST /v1/billing/subscriptions/SUB-CAPTURE-FAIL/capture
paypal client smoke: ok
```

Solo **un** intento de captura ante `500`; el contador del fixture lo confirma.

## Iteración 2 — Performance

| Ruta | Latencia local |
|---|---:|
| `/api/health` | 4–17 ms |
| `/api/seed` | 4–5 ms |
| `/api/recover` | 6 ms |
| `/api/approve` (mock) | 7 ms |
| `/api/ledger` | 14 ms |
| Página HTML | 5.2 KB |

Bundle: 105 KB First Load JS. Sin problema para el demo.

## Iteración 3 — Documentación

- `SUBMISSION.md` aclara que los POST de captura/activate no reintentan `5xx`.
- `web/README.md` documenta la misma regla.
- Sin claims de producción; el freeze sigue.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + mobile | 28/30 |
| PayPal client + retry seguro | 7/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot | 6/10 |
| **Readiness** | **81/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.
4. Bryntum real o timeline CSS aceptada.

## Enlaces

- [[58 Decimoseptima ronda - Concurrencia retry y screenshot]]
- [[59 Decimoctava ronda - Freeze y submission]]
- [`SUBMISSION.md`](../SUBMISSION.md)

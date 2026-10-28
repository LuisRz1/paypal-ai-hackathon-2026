---
title: Vigésima segunda ronda · Outcomes inciertos y mock idempotente
tags: [auditoria, outcomes, idempotencia, mock]
updated: 2026-10-28
---

# Vigésima segunda ronda · Outcomes inciertos y mock idempotente

Tres iteraciones de correctitud sobre el flujo de captura.

## Iteración 1 — Outcome incierto

**Hallazgo:** si PayPal devolvía `5xx` o el read-back fallaba, el código marcaba `FAILED`. Eso es peligroso: el dinero pudo haberse movido.

**Fix:**

- Nuevo estado `PENDING_VERIFICATION`.
- `PayPalCaptureResult` incluye `httpStatus`.
- `5xx`, timeout o error de read-back → `PENDING_VERIFICATION`, HTTP `202`.
- `4xx` conocido → `FAILED`, HTTP `422`.

Prueba:

```text
scenario=UNCERTAIN
status: PENDING_VERIFICATION
pendingVerification: true
recover while pending: 409
ledger.uncertain: [null, true]
```

## Iteración 2 — Mock idempotente

**Hallazgo:** tras una captura mock exitosa, el seed seguía mostrando saldo y permitía otra captura.

**Fix:** registro `recovered[subscriptionId]`; una segunda propuesta devuelve `409`.

Prueba:

```text
SUCCESS: { status: "VERIFIED", verified: true }
REPEAT RECOVER: 409
LEDGER: 3 (proposal, capture, verify)
```

## Iteración 3 — Camino 4xx

Con `scenario=CURRENCY_MISMATCH`:

```text
status: FAILED
pendingVerification: false
error: CURRENCY_MISMATCH
recover after failure: 200
```

Un fallo determinista no bloquea un nuevo intento; un outcome incierto sí.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot | 6/10 |
| **Readiness** | **84/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[61 Vigesima ronda - Matriz estados live regions y teclado]]
- [[62 Vigesima primera ronda - Sponsor impacto y go-no-go]]
- [`SUBMISSION.md`](../SUBMISSION.md)

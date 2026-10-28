---
title: Vigésima sexta ronda · Timeouts y UI pendiente
tags: [auditoria, timeout, ui, regresion]
updated: 2026-10-28
---

# Vigésima sexta ronda · Timeouts y UI pendiente

Tres iteraciones pequeñas de robustez y presentación.

## Iteración 1 — Timeouts de PayPal

- OAuth token: `AbortSignal.timeout(8000)`.
- Requests (incluido retry): `AbortSignal.timeout(10000)`.

Un PayPal colgado ya no bloquea el endpoint indefinidamente; el error cae en el flujo de `PENDING_VERIFICATION` o en el catch del frontend.

## Iteración 2 — UI de outcome pendiente

Antes, `PENDING_VERIFICATION` mostraba `· undefined` porque no había `captureId`.

Ahora:

```text
VERIFIED · CAP-xxxx
PENDING VERIFICATION
NOT VERIFIED
```

Sin `captureId`, no se imprime el separador.

## Iteración 3 — Regresión

```text
runner tests: 5/5
state matrix: 288 cases, 0 violations
build: OK
```

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + runner tests | 10/10 |
| **Readiness** | **88/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[66 Vigesima quinta ronda - Auth fail-closed y timeout]]
- [`web/lib/paypal.ts`](../web/lib/paypal.ts)
- [`web/app/page.tsx`](../web/app/page.tsx)

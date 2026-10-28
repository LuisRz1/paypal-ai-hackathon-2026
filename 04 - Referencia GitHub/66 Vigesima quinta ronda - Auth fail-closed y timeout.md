---
title: Vigésima quinta ronda · Auth, fail-closed y timeout
tags: [auditoria, auth, fail-closed, timeout]
updated: 2026-10-28
---

# Vigésima quinta ronda · Auth, fail-closed y timeout

Tres iteraciones de seguridad y robustez.

## Iteración 1 — Auth antes de lookup

**Hallazgo:** `/api/approve` buscaba la propuesta antes de validar `APPROVER_TOKEN`. Un atacante podía distinguir 404 de 401.

**Fix:** el token se valida antes de `proposals[proposalId]`.

Prueba:

```text
sin token, propuesta inexistente: 401
con token, propuesta inexistente: 404
```

## Iteración 2 — Fail-closed con config parcial

**Hallazgo:** si solo estaba `PAYPAL_CLIENT_ID` o solo `PAYPAL_CLIENT_SECRET`, el código caía silenciosamente al mock.

**Fix:** si uno está y el otro no, `/api/approve` devuelve `503`.

Prueba:

```text
PAYPAL_CLIENT_ID=only, sin secret: 503
health.paypalConfigured: false
```

## Iteración 3 — Timeout y red

- LLM: `AbortSignal.timeout(8000)`; si expira, fallback determinista.
- `health.llmConfigured` usa `||`, no `??`.
- Frontend: `propose` y `approve` capturan errores de red y los muestran.

Regression:

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
| Demo + runner tests | 9/10 |
| **Readiness** | **87/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[65 Vigesima cuarta ronda - Tests del runner de sandbox]]
- [`web/app/api/approve/route.ts`](../web/app/api/approve/route.ts)
- [`web/lib/explain-llm.ts`](../web/lib/explain-llm.ts)

---
title: Vigésima cuarta ronda · Tests del runner de sandbox
tags: [auditoria, sandbox, tests, runner]
updated: 2026-10-28
---

# Vigésima cuarta ronda · Tests del runner de sandbox

Tres iteraciones sobre el runner, sin llamadas reales.

## Iteración 1 — Dry run y execute

`web/scripts/sandbox-check.test.mjs` levanta un PayPal falso en `127.0.0.1` y lanza el runner como subproceso.

- Dry run: imprime `SUB-1`, `SUSPENDED`, `49.00`, sin captura.
- Execute: envía `capture_type=OUTSTANDING_BALANCE`, `amount=49.00`, `USD`, y guarda evidencia en `docs/evidence/`.

## Iteración 2 — Caminos de error

- Saldo 0: exit 2, sin captura.
- Suscripción inexistente: exit ≠ 0, `get subscription failed: 404`.
- Host live `api-m.paypal.com`: exit ≠ 0, `Refusing non-sandbox PayPal base`.

## Iteración 3 — Resultado

```text
5 tests
5 pass
0 fail
```

El runner queda validado contra un servidor falso, incluido el guard de sandbox.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot + runner tests | 9/10 |
| **Readiness** | **87/100** |

## Lo único que falta

Credenciales sandbox:

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export SUBSCRIPTION_ID=I-...
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

## Enlaces

- [[64 Vigesima tercera ronda - Runner de sandbox]]
- [`web/scripts/sandbox-check.test.mjs`](../web/scripts/sandbox-check.test.mjs)
- [`web/DEMO.md`](../web/DEMO.md)

---
title: Vigésima tercera ronda · Runner de sandbox
tags: [auditoria, sandbox, script, freeze]
updated: 2026-10-28
---

# Vigésima tercera ronda · Runner de sandbox

La única revisión que falta es la real. Se dejó lista la herramienta para ejecutarla.

## Iteración 1 — Runner

`web/scripts/sandbox-check.mjs`:

- Dry run por defecto.
- `--execute` captura el `outstanding_balance`.
- `--save` guarda evidencia en `docs/evidence/sandbox-*.json`.
- Usa el mismo cliente que la app, con allow-list de sandbox.
- No acepta host live.

## Iteración 2 — Validación de argumentos

```text
$ node .../sandbox-check.mjs
Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.
exit=1

$ PAYPAL_CLIENT_ID=x PAYPAL_CLIENT_SECRET=y node .../sandbox-check.mjs
Missing SUBSCRIPTION_ID (env or first positional arg).
exit=1
```

No se hizo ninguna llamada real; faltan credenciales.

## Iteración 3 — Documentación

`web/DEMO.md` incluye el comando exacto:

```bash
export PAYPAL_CLIENT_ID=...
export PAYPAL_CLIENT_SECRET=...
export SUBSCRIPTION_ID=I-...
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot | 7/10 |
| **Readiness** | **85/100** |

## Qué desbloquea

Solo falta el input externo:

1. `PAYPAL_CLIENT_ID`.
2. `PAYPAL_CLIENT_SECRET`.
3. `SUBSCRIPTION_ID` de una suscripción suspendida con saldo.

Con eso ejecuto:

```bash
node --experimental-strip-types web/scripts/sandbox-check.mjs --execute --save
```

## Enlaces

- [[63 Vigesima segunda ronda - Outcomes inciertos y mock idempotente]]
- [`web/scripts/sandbox-check.mjs`](../web/scripts/sandbox-check.mjs)
- [`web/DEMO.md`](../web/DEMO.md)

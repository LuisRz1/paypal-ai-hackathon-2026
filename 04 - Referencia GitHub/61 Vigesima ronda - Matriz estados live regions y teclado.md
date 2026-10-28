---
title: Vigésima ronda · Matriz de estados, live regions y teclado
tags: [auditoria, state-machine, a11y, keyboard]
updated: 2026-10-28
---

# Vigésima ronda · Matriz de estados, live regions y teclado

Tres iteraciones de calidad; sin nuevas features.

## Iteración 1 — Matriz exhaustiva de estados

`web/scripts/state-matrix.mjs` enumera:

- 4 estados: `ACTIVE`, `SUSPENDED`, `EXPIRED`, `CANCELLED`.
- 3 saldos: 0, 19, 49.
- 4 conteos de fallo: 0–3.
- 3 umbrales: 0–2.
- 2 monedas: USD/EUR.

**288 casos, 0 violaciones.**

Invariantes verificadas:

- `CANCELLED` → `NONE`.
- `EXPIRED` → `ESCALATE`.
- Moneda distinta → `BLOCK` (salvo cancelado/expirado).
- `CAPTURE` solo con saldo >0, moneda correcta, estado ACTIVE/SUSPENDED y monto exacto.
- `SUSPENDED` con saldo 0 y moneda correcta → `ACTIVATE`.

Corrección de la matriz: una suscripción suspendida con saldo 0 y moneda distinta debe bloquearse, no activarse.

## Iteración 2 — Live regions y foco

- Error: `role="alert"`.
- Propuesta, ejecución y ledger: `aria-live="polite"`.
- `button:focus-visible` con outline azul.

Resultado:

```text
axe-core: 0 violations
passes: 32
```

## Iteración 3 — Navegación por teclado

Orden de tabulación:

```text
1. BUTTON "Propose recovery" (solo la habilitada de SUB-1002)
2. BODY
3. BUTTON "Propose recovery"
4. BODY
```

Los botones deshabilitados se saltan; el foco visible tiene `outline: solid`.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + retry seguro | 7/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + screenshot | 6/10 |
| **Readiness** | **82/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.
4. Bryntum real o timeline CSS aceptada.

## Enlaces

- [[60 Decimonovena ronda - Retry seguro performance y docs]]
- [`web/scripts/state-matrix.mjs`](../web/scripts/state-matrix.mjs)
- [`web/DEMO.md`](../web/DEMO.md)

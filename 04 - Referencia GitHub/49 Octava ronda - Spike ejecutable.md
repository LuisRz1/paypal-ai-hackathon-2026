---
title: Octava ronda · Spike ejecutable
tags: [auditoria, spike, tests, estado]
updated: 2026-10-28
---

# Octava ronda · Spike ejecutable

En vez de otra revisión teórica, esta ronda convirtió el plan en código ejecutable.

## Iteración 1 — Máquina de estados

Archivo: `spike/state_machine.mjs`.

Reglas codificadas:

- `ACTIVE` sano → `NONE`.
- Fallo con `failed_payments_count < threshold` → `WAIT` con próximo retry.
- `SUSPENDED` con saldo → `CAPTURE`.
- `SUSPENDED` sin saldo → `ACTIVATE`.
- `EXPIRED` → `ESCALATE`.
- Moneda distinta → `BLOCK`.

## Iteración 2 — Matriz de errores de captura

`validateCapture()` valida:

- `note` requerido, ≤128.
- Estado en `ACTIVE`, `SUSPENDED`, `EXPIRED`.
- `outstanding > 0`.
- Moneda igual.
- `amount <= outstanding`.
- Máximo 2 decimales.

`handleCaptureIssue()` mapea los 8 issues de PayPal a acciones: `DONE`, `RECOMPUTE`, `BLOCK`, `REFRESH`, `ESCALATE`, `BUG`, `UNKNOWN`.

## Iteración 3 — Seed y camino de demo

`spike/seed.json` con 4 suscripciones. `spike/demo.mjs` verifica:

```text
SUB-1001  ACTIVE     $0    NONE      healthy
SUB-1002  SUSPENDED  $49   CAPTURE   outstanding_balance
SUB-1003  ACTIVE     $19   WAIT      retry_scheduled
SUB-1004  EXPIRED    $0    ESCALATE  expired
```

## Resultado de ejecución

```bash
node --test spike/state_machine.test.mjs
# tests 16
# pass 16
# fail 0
```

El camino `SUB-1002 → CAPTURE $49 → SUSPENDED/0 → ACTIVATE` está cubierto por tests.

## Hallazgos

1. La regla de `capture` es más estricta de lo que parecía: 8 errores 422 distintos.
2. `SUB-1003` no debe capturarse todavía: PayPal aún tiene un retry programado.
3. `SUB-1004` no se recupera con captura: hay que escalar.
4. Después de capturar, el estado puede seguir `SUSPENDED`; hace falta `activate`.

## Próximo paso

1. Envolver `state_machine.mjs` en un mock de PayPal con fixtures.
2. Añadir el endpoint `/api/recover` y el approval gate.
3. Reemplazar el seed por sandbox real.

## Enlaces

- [`spike/README.md`](../spike/README.md)
- [[48 Septima ronda - Entorno demo y assets]]
- [[73 Esquema de datos]]

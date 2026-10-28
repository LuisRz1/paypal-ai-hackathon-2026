---
title: Vigésima séptima ronda bis · Documentación vs código
tags: [auditoria, docs, drift]
updated: 2026-10-28
---

# Vigésima séptima ronda bis · Documentación vs código

Tres iteraciones para alinear docs y código tras los últimos fixes.

## Iteración 1 — Esquema de datos

`73 Esquema de datos` no reflejaba:

- `PENDING_VERIFICATION` en `agent_runs.status`.
- Los stores en memoria (`proposals`, `ledger`).
- El flag mock `recovered`.
- La transición `executed → pending_verification`.

Actualizado.

## Iteración 2 — Arquitectura y scripts

- `50 Arquitectura canonica`: añadido fallo “PayPal 5xx tras capture → PENDING_VERIFICATION”.
- `70 Stack y estructura`: scripts reales (`sandbox-check`, `load-check`, `state-matrix`, `paypal-smoke`).

## Iteración 3 — Submission y checklist

- `SUBMISSION.md`: el paso 7 aclara `PENDING_VERIFICATION` y el bloqueo de una nueva recuperación.
- `12 Checklist`: añadido `sandbox-check.mjs --execute --save` + evidencia.

## Resultado

La documentación ya describe el código actual, no una versión anterior.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + tests | 10/10 |
| **Readiness** | **88/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[68 Vigesima septima ronda - Carga y concurrencia]]
- [[73 Esquema de datos]]
- [`SUBMISSION.md`](../SUBMISSION.md)

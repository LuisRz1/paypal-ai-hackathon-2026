---
title: Vigésima séptima ronda · Carga y concurrencia
tags: [auditoria, load, concurrencia, latencia]
updated: 2026-10-28
---

# Vigésima séptima ronda · Carga y concurrencia

Tres iteraciones con carga real contra el servidor local.

## Iteración 1 — Recover y approve concurrentes

`web/scripts/load-check.mjs` lanza 20 `recover` y 20 `approve` simultáneos.

| Ruta | Resultado |
|---|---|
| recover | `1×200`, `19×409` |
| approve | `1×200`, `19×409` |

Solo una propuesta gana; no hay doble captura.

## Iteración 2 — Webhooks concurrentes

50 entregas del mismo `event.id`:

| Resultado | Cantidad |
|---|---:|
| `received: true` | 1 |
| `duplicate: true` | 49 |
| Eventos en ledger | 1 |

La reserva antes del `await` evita el doble procesamiento.

## Iteración 3 — Latencia bajo carga

| Ruta | p50 | p95 |
|---|---:|---:|
| `/api/health` | 128 ms | 179 ms |
| `/api/seed` | 49 ms | 84 ms |
| `/api/recover` | 38 ms | 62 ms |
| `/api/approve` | 30 ms | 51 ms |
| `/api/webhooks/paypal` | 66 ms | 106 ms |

Sin `5xx`.

**Nota:** el script requiere un servidor recién arrancado porque el estado mock de recuperación vive en memoria.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + tests de carga | 10/10 |
| **Readiness** | **88/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[67 Vigesima sexta ronda - Timeouts y UI pendiente]]
- [`web/scripts/load-check.mjs`](../web/scripts/load-check.mjs)
- [`web/DEMO.md`](../web/DEMO.md)

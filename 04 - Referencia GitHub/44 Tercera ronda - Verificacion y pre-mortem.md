---
title: Tercera ronda · Verificación y pre-mortem
tags: [auditoria, verificacion, pre-mortem, subscriptions]
updated: 2026-10-28
---

# Tercera ronda · Verificación y pre-mortem

Tres pasadas nuevas: verificación de afirmaciones, simulación de jurado y pre-mortem de ejecución.

## Iteración 1 — Verificación de afirmaciones

| Afirmación | Estado | Evidencia |
|---|---|---|
| 310 repos mencionan el hackathon | Confirmado | GitHub search, 28 oct |
| 36 notas, 0 wikilinks rotos | Confirmado | Auditoría local |
| “Subscriptions 4/30” | **Corregido** | 4 mencionan en README; **solo 1/30 tiene código real** |
| “Dunning real = 0” | Confirmado | `OUTSTANDING_BALANCE` y `PAYMENT.FAILED` no aparecen en los 4 repos |
| PayPal reintenta cada 5 días, 2× por ciclo | Confirmado | Docs de payment failure |
| Captura de `OUTSTANDING_BALANCE` | Confirmado | `POST /v1/billing/subscriptions/{id}/capture` |
| Webhooks de suscripción | Confirmado | `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `.SUSPENDED`, `.CANCELLED`, `PAYMENT.SALE.COMPLETED` |
| Bryntum trial 45 días | Confirmado | Página de download |
| AG Studio trial 45 días | Confirmado | Pricing page |
| Deadline 12 nov 12:00 PT | Confirmado | Devpost rules |

### Corrección importante

`Quorum` es el único repo de la muestra con código real de suscripciones:

- Crea Catalog product, Billing plan y Subscription para un retainer.
- No hace dunning, no captura outstanding balance, no reacciona a `PAYMENT.FAILED`.
- No se ha corrido contra sandbox real.

`Rebuttal`, `SarafuPay` y `hibi89` solo mencionan la palabra; `hibi89` es documentación y una rama `feature/subscriptions`.

**Conclusión:** el espacio de “recuperación de ingresos recurrentes” sigue vacío.

### Límite de negative testing

La guía de test de Subscriptions solo simula errores de API con valores `ERRSUB...`:

- `ERRSUB033` → `NOT_AUTHORIZED`
- `ERRSUB068` → `RESOURCE_NOT_FOUND`
- `ERRSUB071` → `INTERNAL_SERVER_ERROR`

**No simula un fallo de renovación real.** Esto confirma que el spike de sandbox es obligatorio.

## Iteración 2 — Simulación de jurado

Criterios con peso igual. Escala 1–5.

| Proyecto | Tech | Design | Impact | Innovation | Presentation | Total |
|---|---:|---:|---:|---:|---:|---:|
| **Recover** | 5 | 4 | 5 | 5 | 4 | **23** |
| Dispute autopilot | 5 | 4 | 5 | 2 | 5 | 21 |
| Merchant Signal | 4 | 4 | 4 | 3 | 4 | 19 |
| Storefront | 4 | 4 | 3 | 3 | 5 | 19 |
| Budget keys | 5 | 3 | 3 | 5 | 3 | 19 |

### Prize math

| Ruta | Sponsor slots | Saturación | Lectura |
|---|---:|---:|---|
| Recover + Bryntum | 3 | 6/30 menciones | Mejor combinación; trial es el riesgo |
| Recover + Grand/Impactful | — | Baja | Alto impacto, pero competencia global |
| Merchant Signal + AG Grid | 5 | 16/30 menciones | Muchos slots, mucha competencia |
| Dispute + Grand/Impactful | — | 12/30 + top 3 | Muy difícil de superar |
| Storefront + Channel3 | 1 | 3/30 | Poco competido, pero shopping saturado |

**Decisión de jurado:** Recover es el único que combina una historia de impacto fuerte con un espacio poco trabajado. AG Grid ya no es la apuesta principal.

## Iteración 3 — Pre-mortem

| Fallo | Prob. | Impacto | Mitigación | Kill criterion |
|---|---|---|---|---|
| No se puede simular fallo de renovación | Alta | Alto | Spike; fallback a factura vencida | Si no hay forma de mostrar el estado, pivotar |
| Trial de Bryntum expira | Media | Medio | Activar 1 nov; fallback timeline | Si expira antes del judging, usar fallback |
| Scope creep | Alta | Medio | Una sola acción de recuperación | Si hay >2 flujos, cortar |
| LLM lento o inconsistente | Media | Alto | Reglas primero; LLM solo explica | Si el flujo depende del LLM, rediseñar |
| Cold start de Render | Media | Medio | Keepalive o instancia paga | Si tarda >30 s, pagar |
| Jueces no pueden ejecutar | Baja | Alto | Demo hospedada + seed + README | Si no hay URL, priorizar deploy |
| PayPal no permite “retry now” | Alta | Medio | Posicionar como outstanding balance | Si no se puede capturar saldo, pivotar |
| Falta de tiempo | Alta | Alto | Cut list de [[71 Backlog 16 dias]] | Congelar el 9 nov |

## Spike de 48 horas

| Bloque | Acción | Resultado esperado |
|---|---|---|
| 0–2 h | Crear product, plan y subscription en sandbox | Subscription `ACTIVE` |
| 2–4 h | Probar `capture` con `OUTSTANDING_BALANCE` | Éxito o error claro |
| 4–6 h | Intentar fallo de renovación con test card / negative testing | Confirmar si es posible |
| 6–8 h | Si no: crear factura vencida con Invoicing y flujo de recordatorio | Demo alternativa |
| 8 h | Go/no-go | Decidir demo principal |

### Criterios de go

- [ ] Se crea una suscripción en sandbox.
- [ ] Se puede mostrar el estado `SUSPENDED` o un saldo pendiente.
- [ ] Se puede capturar el saldo o, en su defecto, una factura vencida.
- [ ] Bryntum renderiza 20 filas con 3 estados.
- [ ] El agente propone 3 acciones con policy determinista.

## Decisión

**GO con fallback:**

1. Spike de suscripción primero.
2. Si el fallo de renovación no es simulable, el demo principal usa **Invoicing** (factura vencida) y la suscripción queda como profundidad técnica.
3. Bryntum se activa el **1 nov**; si expira, timeline de fallback.
4. No usar AG Grid como sponsor principal.

## Enlaces

- [[43 Red team - Renewal Radar]]
- [[62 Modelo B Scheduler]]
- [[71 Backlog 16 dias]]
- [[23 Payouts Disputes Reports]]

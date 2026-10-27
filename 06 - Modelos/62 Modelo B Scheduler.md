---
title: Modelo B · Scheduler
tags: [modelo, bryntum, gantt, pagos]
updated: 2026-10-27
---

# Modelo B · Scheduler

## Concepto

Un **timeline que reacciona al dinero**. Cada hito tiene una factura PayPal; cuando se paga, la siguiente fase se desbloquea. Si se atrasa, se retiene. El agente detecta qué hacer y propone; el humano aprueba.

## Usuario y problema

- Freelancer, agencia pequeña o property manager.
- El calendario y los pagos viven en herramientas separadas.
- Un pago tardío bloquea el trabajo y nadie lo ve hasta que es tarde.

## Flujo

1. Se pega un contrato o se crea un proyecto.
2. La IA extrae fases, hitos y montos; el código calcula fechas.
3. Se crea una factura PayPal por hito.
4. El Gantt muestra fases en espera (barras punteadas).
5. `INVOICING.INVOICE.PAID` desbloquea la siguiente fase.
6. Si llega tarde, el agente sugiere recordatorio, split o replan.
7. El humano aprueba; se ejecuta y se verifica.
8. Al pagar el cliente, se puede pagar al subcontractor con Payouts.

## Pantallas

- **Projects:** lista y estado.
- **Gantt:** fases, dependencias, baseline fantasma.
- **Suggestions:** acciones propuestas con razón y números.
- **Payments:** facturas, fees y neto recibido.

## PayPal APIs

| Uso | API |
|---|---|
| Facturas | Invoicing v2 |
| Cobro | Orders v2 / JS SDK v6 |
| Payouts | Payouts REST |
| Disputas | Disputes API |
| Eventos | Webhooks |
| Fees | Payments / Reports |

## Sponsor: Bryntum

- **Gantt** con dependencias, baselines y drag.
- **Scheduler** si el modelo es resource booking.
- **Calendar** si el modelo es eventos.
- Lazy-load del trial package.

## MVP (16 días)

- [ ] Crear proyecto + fases + hitos.
- [ ] Generar factura PayPal por hito.
- [ ] Gantt con fase bloqueada/desbloqueada.
- [ ] Webhook que marca pagada y desbloquea.
- [ ] Agente que sugiere 3 acciones.
- [ ] Aprobación + ejecución de una acción.
- [ ] Seed de demo con un pago tardío.

## Diferenciación

Milestone ya existe. Para no ser un clon:

- Multi-cliente/agencia, no solo un freelancer.
- Split de pagos a subcontractors.
- Replan automático ante disputa.
- Evidencia y verificación por hito.
- Portal del cliente para ver qué está bloqueado y por qué.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Competencia directa (Milestone) | Enfocar en agencia + payouts + disputas |
| Complejidad de fechas | Cálculo en código, no en el LLM |
| Payouts requiere acceso | Dejar Payouts como “best effort”; el core es Invoicing |
| Gantt pesado | Lazy-load y demo con pocos hitos |

## Reutilizar

- [[41 Repos clave|Milestone]]
- Stood (authorize/capture/void, evidencia)
- SarafuPay (webhooks + reconciliación)

## Demo (90 s)

1. Crear proyecto con 3 fases.
2. Mostrar Gantt con fase 2 bloqueada.
3. Pagar factura en sandbox.
4. Ver el webhook desbloquear la fase en vivo.
5. Mostrar sugerencia de recordatorio y aprobarla.
6. Enseñar el neto recibido tras fees.

## Enlaces

- [[32 Bryntum]]
- [[60 Comparativa]]

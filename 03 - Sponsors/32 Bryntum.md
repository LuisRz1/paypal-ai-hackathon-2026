---
title: Bryntum
tags: [sponsor, bryntum, gantt, scheduler, calendar]
source: https://paypalaihackathon.devpost.com/details/bryntum
updated: 2026-10-27
---

# Bryntum

## Qué es

Componentes para todo lo que tiene dimensión temporal:

| Producto | Uso |
|---|---|
| **Gantt** | Tareas en timeline con dependencias; mover una mueve las dependientes |
| **Scheduler** | Eventos asignados a recursos (personas, salas, equipos) con drag/drop/resize |
| **Calendar** | Vista día/semana/mes/año/agenda/recurso con editor y filtros |

## Oferta

- Trial **45 días**.
- `npm install @bryntum/scheduler@npm:@bryntum/scheduler-trial`
- Premios: **$1,000 ×3**.
- Jurado: Mats Bryntse (CEO).

## Qué premia

- El mejor uso de Gantt, Scheduler y/o Calendar.
- Timeline limpio, resource booking inteligente o un agente que mueve el calendario.

## Ideas

- **Agency delivery board (Gantt):** hitos multi-cliente con tranches de pago como dependencias; un pago tardío bloquea la siguiente fase.
- **Equipment rental (Scheduler):** slots que se bloquean solo cuando el pago PayPal se captura.
- **Event ticketing (Calendar):** ventas por evento visibles.
- **Subscription revenue radar (Scheduler):** una fila por cliente, periodos de billing, renovaciones y fallos.
- **Dispute triage board (Scheduler):** una fila por agente, bloques por disputa, deadline y evidencia.
- **Agent-driven rescheduler:** el agente mueve hitos cuando un pago falla, llega tarde o se reembolsa.

## Integración con PayPal

- Invoicing: cada hito tiene una factura.
- Webhooks: `INVOICING.INVOICE.PAID` desbloquea la siguiente fase.
- Authorize/capture: reserva de fondos antes de confirmar una reserva.
- Payouts: pagar subcontractors cuando el cliente pagó.
- Disputes: congelar el trabajo si hay una disputa.

## Riesgos

- Competencia baja: solo ~2/100 repos del hackathon lo usan.
- El trial package puede ser pesado; lazy-load.
- El valor está en la interacción, no en una captura estática.

## Enlaces

- [[30 Mapa de sponsors]]
- [[62 Modelo B Scheduler]]
- Docs: https://bryntum.com/products/gantt/
- Ejemplos: https://bryntum.com/examples/
- Trial: https://bryntum.com/download/

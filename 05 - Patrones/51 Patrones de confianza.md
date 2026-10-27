---
title: Patrones de confianza
tags: [patrones, seguridad, agentes, pagos]
updated: 2026-10-27
---

# Patrones de confianza

## 1. La IA propone; el código decide

El LLM genera una propuesta estructurada. Un motor determinista valida límites, destinatarios, moneda, duplicados y estado. Sin `approved: true` no hay acción.

Evidencia: Stood, Refundly, DisputeSteward, AGENT GATE.

## 2. El modelo no tiene credenciales

El agente corre sin `client_secret`. Las tools de escritura viven en el servidor y reciben una propuesta ya validada.

Evidencia: Stood (“rules move money, models only report”).

## 3. Aprobación humana explícita

- Acciones irreversibles siempre escalan.
- Umbral de monto (ej. >$100) exige segunda confirmación.
- Código de un solo uso para payouts.

Evidencia: SarafuPay (`CONFIRM <6 dígitos>`), Refundly, DisputeSteward.

## 4. Read-back independiente

No confíes en el retorno de la tool. Relee el recurso:

- Refund verificado: `GET /v2/payments/refunds/{id}` → `COMPLETED`.
- Cancelación: `GET /v1/billing/subscriptions/{id}` → `CANCELLED`.
- Captura: `GET /v2/payments/captures/{id}` → `COMPLETED`.

Evidencia: Refundly.

## 5. Idempotencia

- `PayPal-Request-Id` en POST críticos.
- Una acción por caso/disputa.
- Dedupe de webhooks por `id`.
- Estado persistido antes y después de la llamada.

Evidencia: SarafuPay, DisputeSteward, Haggle Court.

## 6. Reconciliación

Un cron relee órdenes/payouts pendientes y corrige el estado. Los webhooks se pierden; el dinero no debe perderse.

Evidencia: SarafuPay (cron cada 15 min).

## 7. Mínimo privilegio

- Tools separadas por dominio: billing no puede cancelar; account no puede reembolsar.
- El agente de análisis no tiene tools de escritura.
- Allow-list de destinatarios.

Evidencia: Refundly, Harambee.

## 8. Ledger auditable

- Append-only.
- Hash-chained si quieres detectar manipulación.
- Guarda propuesta, decisión, resultado y evidencia.

Evidencia: DisputeSteward, Stood, Refundly.

## 9. Modo mock honesto

- Sin credenciales, la app funciona con datos simulados.
- La UI lo etiqueta claramente.
- Nunca se presenta un mock como sandbox real.

Evidencia: InvoicePilot, DisputeSteward, Harambee.

## 10. Fallback de modelo

- Cadena de modelos con reintento.
- Si todos fallan, parser/reglas deterministas.
- La UI indica qué modo se usó.

Evidencia: SarafuPay, Harambee, Milestone.

## 11. Frontera de prompt injection

- El contenido del usuario no se pasa como instrucción al ejecutor.
- Las tools de escritura no aceptan texto libre como monto o destinatario.
- El servidor re-deriva la acción desde el caso.

Evidencia: Refundly, DisputeSteward.

## 12. Sandbox only

- `PAYPAL_ENVIRONMENT=SANDBOX`.
- Sin claves live en el repo.
- Datos de prueba, no reales.

## Checklist

- [ ] El LLM no tiene secretos.
- [ ] Policy engine server-side.
- [ ] Aprobación humana.
- [ ] Read-back.
- [ ] Idempotencia.
- [ ] Reconciliación.
- [ ] Ledger.
- [ ] Mock etiquetado.
- [ ] Fallback.
- [ ] Sandbox.

## Enlaces

- [[50 Arquitectura canonica]]
- [[52 Demo y entrega]]
- [[41 Repos clave]]

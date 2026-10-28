---
title: Red team · Renewal Radar
tags: [auditoria, red-team, subscriptions, diferenciadores]
updated: 2026-10-28
---

# Red team · Renewal Radar

Segunda ronda de 3 iteraciones. Objetivo: validar o romper la recomendación anterior antes de escribir código.

## Iteración 1 — Consistencia del vault

- 35 archivos Markdown, 14,285 palabras, 0 wikilinks rotos.
- Todos los `updated` estaban en 2026-10-27; hoy es 2026-10-28.
- `34 Otros sponsors` era huérfano: no estaba enlazado desde el MOC.
- El countdown decía “16 días” (27 oct); hoy son **15 días**.
- Los “TODO” detectados eran falsos positivos del español “todo”, no tareas pendientes.

Correcciones aplicadas: enlace a `34`, countdown y fecha.

## Iteración 2 — Saturación real a nivel README

La primera ronda midió descripciones; esta midió los READMEs de los 30 repos más grandes. Cambia la lectura:

| Capacidad | Cobertura top 30 |
|---|---:|
| Verificación / reconciliación | 26/30 |
| Aprobación humana | 23/30 |
| Webhooks | 20/30 |
| Post-purchase / tracking | 18/30 |
| **AG Grid / AG Studio** | **16/30** |
| Idempotencia | 15/30 |
| Policy / guardrail | 16/30 |
| Disputas / chargeback | 12/30 |
| Budget / spend cap | 12/30 |
| Payouts | 7/30 |
| Invoicing | 7/30 |
| Bryntum / Gantt | 6/30 |
| Split / multi-seller | 6/30 |
| **Subscriptions** | **4/30** |
| Channel3 | 3/30 |
| MCP | 4/30 |
| Prueba formal | 0/30 |

Conclusiones:

1. **Trust patterns ya son table stakes.** Webhooks, aprobación, verificación e idempotencia aparecen en la mayoría. No diferencian por sí solos.
2. **AG Grid está mucho más saturado de lo que parecía:** 16/30. El premio sigue teniendo 5 slots, pero la competencia es alta.
3. **Disputas sigue saturado:** 12/30, con Rebuttal, Docket y FirstReply como referencias.
4. **Subscriptions solo 4/30 y ninguno hace dunning real.** Corrección posterior: solo **1/30 tiene código real** (Quorum, retainer); los otros tres solo mencionan la palabra:
   - `Quorum` implementa Catalog + Billing plan + Subscription para un retainer, pero su producto es reparto de pagos de equipos.
   - `Rebuttal` y `SarafuPay` mencionan la palabra, no el flujo de recuperación.
   - `hibi89` solo tiene documentación y una rama `feature/subscriptions`.
5. **Bryntum 6/30:** más competencia que la estimada, pero sigue por debajo de AG Grid.

## Iteración 3 — Red team de PayPal y Bryntum

### PayPal Subscriptions sí permite recuperar saldo

La documentación confirma:

- PayPal reintenta el pago **cada 5 días, hasta 2 veces por ciclo**.
- Si falla el segundo reintento, el monto se suma al **outstanding balance** del siguiente ciclo.
- Al superar `payment_failure_threshold`, la suscripción se **suspende**.
- Puedes capturar el saldo pendiente:

```http
POST /v1/billing/subscriptions/{id}/capture
{
  "note": "Outstanding balance",
  "capture_type": "OUTSTANDING_BALANCE",
  "amount": { "value": "20.00", "currency_code": "USD" }
}
```

Webhooks relevantes:

- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `PAYMENT.SALE.COMPLETED`

**Implicación:** el producto no debe prometer “retry now”. Debe posicionarse como **recuperación de saldo pendiente + prevención de churn**, usando el flujo real de PayPal.

### Bryntum: el trial expira durante judging

- Trial de **45 días**, funcionalidad completa.
- Si se activa hoy (28 oct), expira ~11 dic; el judging es 1–15 dic.
- Si se activa el **1 nov**, expira ~16 dic: cubre el judging, pero sin margen.
- Solvia explícitamente descartó Bryntum por este motivo.

**Mitigación:** activar el trial el 1 nov, no antes; tener un timeline de fallback (SVG/HTML o una librería libre) si el trial expira; grabar el video antes del 15 dic.

### AG Studio: mismo problema de trial

- Trial de 45 días.
- AG Grid Community es MIT y no expira, pero AG Studio sí.
- Con 16/30 de saturación, no es la apuesta principal.

## Decisión revisada

**GO con condiciones** para Renewal Radar, renombrado **“Recover”**:

1. Detectar `PAYMENT.FAILED` y mostrar próximo reintento y saldo pendiente.
2. Al suspenderse, ofrecer:
   - capturar `OUTSTANDING_BALANCE`,
   - cambiar de plan,
   - pausar,
   - escalar a humano.
3. Verificar la captura con read-back.
4. Dashboard: MRR en riesgo, recuperado y churn evitado.
5. Proof-carrying actions como capa de confianza.

**Condición bloqueante:** spike de 2 horas para confirmar que se puede sembrar un fallo de suscripción en sandbox. Si no, el demo usa una factura vencida (Invoicing) y un evento de fallo sembrado, etiquetado como simulación.

**No hacer:** otro dispute agent, otro shopping agent o un dashboard AG Grid genérico.

## Enlaces

- [[42 Auditoria 3 iteraciones]]
- [[62 Modelo B Scheduler]]
- [[23 Payouts Disputes Reports]]
- [[32 Bryntum]]

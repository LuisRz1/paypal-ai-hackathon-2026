---
title: Modelo A · Merchant CFO
tags: [modelo, ag-grid, dashboard, analytics]
updated: 2026-10-27
---

# Modelo A · Merchant CFO

## Concepto

Un **copiloto financiero para pequeños merchants** que convierte datos PayPal en un dashboard vivo y editable. El agente responde preguntas en lenguaje natural y construye/edita widgets con AG Studio; las acciones de dinero pasan por policy + aprobación + verificación.

## Usuario y problema

- Freelancer o tienda pequeña con ventas, suscripciones, facturas y disputas dispersas.
- No tiene analista ni dashboard propio.
- Necesita saber qué entra, qué se reembolsó, qué está en disputa y qué hacer después.

## Flujo

1. Se conectan datos PayPal (Reports/Transaction Search + webhooks).
2. El dashboard muestra revenue, refunds, disputas, suscripciones y facturas.
3. El usuario pregunta: “¿cuánto facturé por segmento este mes?”.
4. El agente consulta el data engine y crea un widget.
5. El usuario ajusta el widget a mano.
6. El agente propone acciones: reembolsar, recordar factura, pausar plan.
7. Policy + aprobación + ejecución + read-back.

## Pantallas

- **Overview:** KPIs, revenue por producto, refund rate, disputas abiertas.
- **Inbox:** anomalías y acciones sugeridas.
- **Dashboard Studio:** widgets editables, cross-filtering, theming.
- **Evidence:** ledger de acciones y verificaciones.

## PayPal APIs

| Uso | API |
|---|---|
| Transacciones | `GET /v1/reporting/transactions` |
| Balances | `GET /v1/reporting/balances` |
| Órdenes/capturas | Orders v2 |
| Refunds | Payments v2 |
| Disputas | Disputes API |
| Suscripciones | Subscriptions API |
| Facturas | Invoicing API |
| Eventos | Webhooks |

## Sponsor: AG Grid

- AG Studio con data sources, relaciones, tema y report inicial.
- **Custom widget** propio (ej. refund-rate tile).
- **Studio Agent Framework** con un agente custom que delega en los agentes de Studio.
- Proxy IA server-side; la key nunca llega al navegador.

## MVP (16 días)

- [ ] Auth PayPal + cache de token.
- [ ] Ingesta de transactions, invoices, subscriptions, disputes.
- [ ] Dashboard AG Studio con 3 widgets custom.
- [ ] Agente NL que crea un widget.
- [ ] Una acción aprobable (refund o reminder) con policy y read-back.
- [ ] Webhook + reconciliación básica.
- [ ] Modo demo con datos seed.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| AG Studio license | Trial 45 días; empezar por el boilerplate |
| Poco tiempo para pulir | 3 widgets bien hechos, no 20 |
| Datos sandbox vacíos | Seed + fixtures |
| “Otro dashboard” | El agente que **edita** el dashboard y la capa de confianza |

## Reutilizar

- [[41 Repos clave|Boilerplate oficial]]
- SarafuPay (AG Studio custom widget + agente)
- Refundly (verificación)
- DisputeSteward (policy)

## Demo (90 s)

1. Abrir dashboard con datos.
2. Preguntar “show refunds by product this month”; el agente crea el widget.
3. Editar el widget a mano.
4. Pedir un refund; policy pide aprobación; ejecutar; verificar en el ledger.
5. Mostrar el estado final en PayPal.

## Enlaces

- [[31 AG Grid]]
- [[60 Comparativa]]

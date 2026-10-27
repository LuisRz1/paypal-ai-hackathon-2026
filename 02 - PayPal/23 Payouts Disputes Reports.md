---
title: Payouts, Disputes y Reports
tags: [paypal, payouts, disputes, reports]
source: https://developer.paypal.com/payouts/
updated: 2026-10-27
---

# Payouts, Disputes y Reports

## Payouts

- Requiere **solicitar acceso** y cuenta Business con identidad, email y banco confirmados.
- Se financia con el saldo de PayPal.
- 96 países, 24+ monedas.
- Destinatario por email, teléfono o PayPal ID.
- Venmo solo US/USD.
- Un `batch ID` confirma **envío**, no entrega; revisa el estado por item.
- El Agent Toolkit **no incluye payouts**: hazlo por REST directo.

## Disputes

| Tipo | Quién adjudica | Plazos |
|---|---|---|
| Interna | PayPal | 180 días para disputar; 20 días para resolver; 10 días si escala |
| Externa (chargeback/ACH) | Banco/emisor | Pre-chargeback: reembolsar en 20 h para evitarlo |

Etapas: **inquiry → claim → resolution**.

Motivos comunes:

- Item not received (INR).
- Significantly not as described (SNAD).
- Errores de facturación o suscripción.
- Transacciones no autorizadas.
- Solicitud de detalles.
- Pago dirigido a destinatario incorrecto.

PayPal retiene el importe durante la disputa. Hay apelación.

**Integración:** Resolution Center (manual) o Disputes API (automático).

## Reports

| Necesidad | Reporte recomendado |
|---|---|
| Conciliar pagos y fees | Balance Reconciliation Report (BRR) |
| Conciliar payouts | Disbursement Reconciliation Report (DRR) |
| Toda la actividad | Activity Download (ADR) / Transaction Detail (TDR) |
| Fees IC++ | Fee Transaction report |
| Intentos y rechazos | Attempts and Declines report |
| Disputas | Case Report |
| Balance mensual | Monthly Statement |
| Órdenes abiertas | Orders report |
| Billing agreements | Preapproved Payments Agreement |
| Recurrentes | Recurring Payments Profile |
| Auditoría de usuarios | User Audit report |

Acceso: dashboard o suscripción a SFTP.

### Nota práctica

Transaction Search cubre **máximo 31 días por request**, rechaza segundos fraccionados y puede tardar hasta **3 horas** en mostrar actividad nueva. `fields=all` añade `payer_info`.

## Enlaces

- [[25 Webhooks Agent Toolkit MCP]]
- Payouts: https://developer.paypal.com/payouts/
- Disputes: https://developer.paypal.com/disputes/overview/
- Reports: https://developer.paypal.com/reports/overview/

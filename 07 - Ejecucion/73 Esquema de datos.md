---
title: Esquema de datos
tags: [ejecucion, datos, db]
updated: 2026-10-27
---

# Esquema de datos

## Tablas

### `orders`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `orderId` de PayPal |
| merchant_id | text | |
| amount | numeric(12,2) | Calculado en servidor |
| currency | char(3) | |
| intent | text | CAPTURE / AUTHORIZE |
| status | text | CREATED / APPROVED / COMPLETED / VOIDED |
| created_at | timestamptz | |

### `captures`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `captureId` |
| order_id | text FK | |
| amount | numeric(12,2) | |
| currency | char(3) | |
| status | text | COMPLETED / PENDING / REFUNDED |
| verified_at | timestamptz | Read-back |

### `refunds`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `refundId` |
| capture_id | text FK | |
| amount | numeric(12,2) | |
| status | text | PENDING / COMPLETED / FAILED |
| reason | text | |
| verified_at | timestamptz | |

### `invoices`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `INV2-...` |
| customer_email | text | |
| amount | numeric(12,2) | |
| currency | char(3) | |
| status | text | DRAFT / SENT / UNPAID / PAID / CANCELLED |
| due_at | date | |

### `subscriptions`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `I-...` |
| plan_id | text | |
| status | text | ACTIVE / SUSPENDED / CANCELLED |
| next_billing | date | |

### `disputes`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | `PP-D-...` |
| status | text | OPEN / UNDER_REVIEW / RESOLVED |
| reason | text | INR / SNAD / ... |
| amount | numeric(12,2) | |
| deadline | date | |

### `payouts`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | batch/item |
| recipient | text | email/phone |
| amount | numeric(12,2) | |
| status | text | PENDING / SUCCESS / FAILED |
| verified_at | timestamptz | |

### `webhook_events`

| Campo | Tipo | Nota |
|---|---|---|
| id | text PK | ID del evento |
| type | text | |
| payload | jsonb | |
| received_at | timestamptz | |
| processed_at | timestamptz | |

### `agent_runs`

| Campo | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| intent | text | |
| model | text | |
| proposal | jsonb | |
| status | text | proposed / blocked / approved / executed / verified |
| created_at | timestamptz | |

### `approvals`

| Campo | Tipo | Nota |
|---|---|---|
| id | uuid PK | |
| run_id | uuid FK | |
| approved_by | text | |
| approved_at | timestamptz | |
| token_hash | text | Código de un solo uso |

### `audit_events`

| Campo | Tipo | Nota |
|---|---|---|
| id | bigserial PK | Append-only |
| run_id | uuid | |
| event | text | |
| data | jsonb | |
| prev_hash | text | Hash chain |
| hash | text | |

## Invariantes

1. `orders.amount` sale del servidor, nunca del cliente.
2. Un `capture_id` solo puede reembolsarse hasta su monto.
3. Una acción de dinero por `run_id`.
4. `webhook_events.id` es único (dedupe).
5. Toda ejecución tiene `approval` previa.
6. Toda ejecución tiene `verified_at` o queda `pending`.
7. `audit_events` no se actualiza ni se borra.

## Estados del run

```text
proposed → blocked
proposed → approved → executed → verified
proposed → approved → executed → pending_gateway
pending_gateway → verified | failed
```

## Enlaces

- [[50 Arquitectura canonica]]
- [[51 Patrones de confianza]]
- [[70 Stack y estructura]]

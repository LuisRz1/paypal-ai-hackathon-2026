---
title: Subscriptions e Invoicing
tags: [paypal, subscriptions, invoicing]
source: https://developer.paypal.com/subscriptions/about
updated: 2026-10-27
---

# Subscriptions e Invoicing

## Subscriptions

Un plan se construye con dos objetos:

| Objeto | Qué representa |
|---|---|
| **Product** | El bien o servicio |
| **Plan** | Ciclo, precio y trials |

### Crear producto

```http
POST /v1/catalogs/products
PayPal-Request-Id: <uuid>
{
  "name": "Video Streaming Service",
  "type": "SERVICE",
  "category": "SOFTWARE"
}
```

### Crear plan

```http
POST /v1/billing/plans
PayPal-Request-Id: <uuid>
{
  "product_id": "PROD-xxx",
  "name": "Basic Plan",
  "billing_cycles": [
    {
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "TRIAL",
      "sequence": 1,
      "total_cycles": 1
    },
    {
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "REGULAR",
      "sequence": 2,
      "total_cycles": 12,
      "pricing_scheme": {
        "fixed_price": { "value": "10", "currency_code": "USD" }
      }
    }
  ],
  "payment_preferences": {
    "auto_bill_outstanding": true,
    "setup_fee": { "value": "10", "currency_code": "USD" },
    "payment_failure_threshold": 3
  }
}
```

- **Una sola moneda por plan.**
- `total_cycles: 0` = hasta cancelar.
- Soporta trials, setup fee, precios por volumen/tier, pausa/reanudación, upgrade/downgrade y reintento de pagos.

### Botón (SDK v5)

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&vault=true&intent=subscription"></script>
<script>
paypal.Buttons({
  createSubscription: (data, actions) =>
    actions.subscription.create({ plan_id: "P-xxx" }),
  onApprove: (data) => console.log(data.subscriptionID),
}).render("#paypal-button-container");
</script>
```

## Invoicing

```http
POST /v2/invoicing/invoices
{
  "detail": { "currency_code": "USD", "note": "Thanks" },
  "primary_recipients": [{
    "billing_info": { "email_address": "customer@example.com" }
  }],
  "items": [{
    "name": "Website design",
    "quantity": "1",
    "unit_amount": { "currency_code": "USD", "value": "500.00" }
  }]
}
```

```http
POST /v2/invoicing/invoices/{invoice_id}/send
{ "send_to_recipient": true, "send_to_invoicer": true }
```

| Estado | Significado |
|---|---|
| `DRAFT` | Creada, no visible al cliente |
| `SENT` | Enviada |
| `UNPAID` | Enviada y pendiente |
| `PAID` | Pagada |
| `CANCELLED` | Cancelada |
| `OVERDUE` | Vencida |

- Tras enviar **no se puede borrar**, solo cancelar.
- Soporta pagos parciales, descuentos, impuestos, QR, recordatorios y pago por banco.
- Es **one-time**; para recurrente usa Subscriptions.

## Enlaces

- [[21 Checkout]]
- Subs: https://developer.paypal.com/subscriptions/about
- Invoicing: https://developer.paypal.com/invoicing/about
- API Invoicing: https://developer.paypal.com/api/invoicing

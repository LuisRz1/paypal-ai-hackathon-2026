---
title: APMs, Pay Later y Donate
tags: [paypal, apm, paylater, donate]
source: https://developer.paypal.com/payment-methods/
updated: 2026-10-27
---

# APMs, Pay Later y Donate

## Categorías de métodos

| Tipo | Descripción |
|---|---|
| Bank redirect | Redirige al banco del pagador (iDEAL, Bancontact, BLIK, eps, MyBank, Przelewy24, Trustly) |
| Direct banking | Transferencia por rails bancarios (ACH) |
| Voucher | Pago en efectivo/QR en punto físico (Multibanco, OXXO, Boleto) |
| Digital wallets | App con biométrico (PayPal, Venmo, AliPay, GrabPay, Satispay) |
| Deferred payment | BNPL (Pay Later, Pay upon Invoice) |

## Comportamientos

- **Push** (el pagador envía) vs **pull** (el pagador autoriza débito).
- **Instantáneo** vs **diferido**.
- **Directo** (misma página) vs **redirect** vs **offline**.

## Métodos habituales

| Método | País | Moneda | Tipo |
|---|---|---|---|
| iDEAL | NL | EUR | bank redirect |
| Bancontact | BE | EUR | bank redirect |
| BLIK | PL | PLN | bank redirect |
| eps | AT | EUR | bank redirect |
| MyBank | IT | EUR | bank redirect |
| Multibanco | PT | EUR | voucher |
| Przelewy24 | PL | PLN/EUR | bank redirect |
| Trustly | Nórdicos + EU | EUR/GBP/SEK/NOK/DKK | bank redirect |
| OXXO | MX | MXN | voucher |
| Boleto | BR | BRL | voucher |
| AliPay | CN | varias | wallet |
| GrabPay | SG | SGD | wallet |
| Satispay | EU | EUR | wallet |
| Venmo | US | USD | wallet |

## Pay Later (US)

| Producto | Pagos | Frecuencia | Rango |
|---|---|---|---|
| Pay in 4 | 4 | Cada 2 semanas | $10–$2,000 |
| Pay Monthly | 3, 6, 12 o 24 | Mensual | $49–$10,000 |

- Requiere merchant/sitio US, USD e integración de pago único.
- Los mensajes de PayPal **no se pueden editar** ni sustituir.
- No elegible para Reference Transaction ni Recurring Payments.
- Otros mercados: AU, CA, FR, DE, IT, ES, GB con productos y rangos propios.

## Donate SDK

```html
<script src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"></script>
<script>
PayPal.Donation.Button({
  env: "sandbox",
  hosted_button_id: "YOUR_SANDBOX_HOSTED_BUTTON_ID",
  image: {
    src: "https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif",
    title: "PayPal - The safer, easier way to pay online!",
    alt: "Donate with PayPal button"
  },
  onComplete: ({ tx, st, amt, cc, cm, item_number, item_name }) => {}
}).render("#paypal-button-container");
</script>
```

- El botón se crea primero en `sandbox.paypal.com/donate/buttons`.
- `hosted_button_id` para Business; `business` para Personal.
- Go-live: `env: "production"` y botón live.
- `onComplete` devuelve `tx`, `st`, `amt`, `cc`, `cm`, `item_number`, `item_name`.

## Enlaces

- [[21 Checkout]]
- Métodos: https://developer.paypal.com/payment-methods/
- Pay Later: https://developer.paypal.com/pay-later/overview/
- Donate: https://developer.paypal.com/sdk/donate/

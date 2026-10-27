---
title: Autenticación y sandbox
tags: [paypal, oauth, sandbox]
source: https://developer.paypal.com/api/rest/
updated: 2026-10-27
---

# Autenticación y sandbox

## OAuth 2.0

```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

| Dato | Valor |
|---|---|
| Sandbox API | `https://api-m.sandbox.paypal.com` |
| Producción | `https://api-m.paypal.com` |
| Auth | Basic `base64(CLIENT_ID:CLIENT_SECRET)` |
| Grant | `client_credentials` |
| Uso | `Authorization: Bearer <access_token>` |
| Expiración | `expires_in` (~31 668 s en sandbox) |

- **Client ID** puede ir en el navegador; **client secret** solo en servidor.
- Cachea el token hasta `expires_in - 60`; renueva al recibir 401.
- Sandbox y live tienen credenciales distintas.

## Sandbox

| Sitio | Uso | Login |
|---|---|---|
| `developer.paypal.com` | Apps, credenciales, cuentas sandbox | Tu cuenta real de PayPal |
| `www.sandbox.paypal.com` | Aprobar y revisar pagos de prueba | Cuenta sandbox generada |

- Por defecto hay dos cuentas: **Personal** (comprador) y **Business** (vendedor).
- Se crean más en **Testing Tools → Sandbox Accounts**.
- La cuenta Business acumula el dinero de prueba; la Personal necesita saldo para pagar.
- Los emails `sb-xxxx@personal.example.com` / `@business.example.com` son ficticios.

## Tarjetas y errores

- Tarjetas de prueba: cualquier fecha futura; CVV de 3 dígitos (4 para Amex).
- **Negative testing** solo sandbox:

```http
PayPal-Mock-Response: {"mock_application_codes":"INSTRUMENT_DECLINED"}
```

| Código | Simula |
|---|---|
| `INSUFFICIENT_FUNDS` | Fondos insuficientes al capturar |
| `INSTRUMENT_DECLINED` | Método rechazado |
| `TRANSACTION_REFUSED` | Transacción rechazada |
| `INTERNAL_SERVER_ERROR` | Error 500 |
| `DUPLICATE_INVOICE_ID` | Invoice ID duplicado |

- También se activa a nivel de cuenta Business en **Settings → Negative Testing**.
- **Apágala al terminar**: mientras está activa, esa cuenta falla todas las transacciones.

## Seguridad

- Nunca commitear `.env` ni el secret.
- No aceptar montos calculados por el cliente.
- Guardar `captureId`, `orderId`, `subscriptionID` y `debug_id`.
- Loguear `debug_id` de PayPal para soporte.

## Enlaces

- [[21 Checkout]]
- [[25 Webhooks Agent Toolkit MCP]]
- API REST: https://developer.paypal.com/api/rest/
- Sandbox: https://developer.paypal.com/sandbox-testing/overview

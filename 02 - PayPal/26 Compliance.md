---
title: Compliance y límites
tags: [paypal, compliance, seguridad]
source: https://developer.paypal.com/reference/guidelines/policiesAndGuidelines/
updated: 2026-10-27
---

# Compliance y límites

## Requisitos

- Cuenta **PayPal Business** en regla para live y para probar fuera de US.
- El **merchant/seller of record** debe ser el receptor principal de cada transacción.
- Aceptar el PayPal Developer Agreement.
- Seguir las Branding Guidelines y usar solo botones autorizados.
- Publicar Acceptable Use Policy, Refund Policy y Privacy Policy.
- Dar soporte al cliente con email y, idealmente, teléfono y web.
- Registrar la app antes de llamar a producción.
- Respetar rate limits.

## Prohibido

- Servicios de escrow o retención que violen la AUP.
- **Payment aggregation**: agregar dinero de fuentes no verificables.
- Trasladar fees al comprador o añadir recargos.
- Almacenar credenciales, passwords, PINs o respuestas de seguridad de PayPal.
- Personal Payments en India, México, Malasia, Singapur y Taiwán.
- Remesas o pagos personales expandidos.
- Evadir políticas o fees de PayPal.

## Buenos hábitos

- Sandbox para todo el desarrollo.
- Secretos solo en servidor y en variables de entorno.
- Montos calculados en servidor.
- Idempotencia en POST y webhooks.
- Loguear `debug_id` y `PayPal-Request-Id`.
- No usar datos reales de clientes en demos.

## Enlaces

- [[20 Autenticacion y sandbox]]
- [[51 Patrones de confianza]]
- Políticas: https://developer.paypal.com/reference/guidelines/policiesAndGuidelines/
- AUP: https://www.paypal.com/webapps/mpp/ua/acceptableuse-full
- Rate limits: https://developer.paypal.com/api/rest/reference/rate-limiting/

---
title: Modelo C · Storefront
tags: [modelo, channel3, shopping, checkout]
updated: 2026-10-27
---

# Modelo C · Storefront

## Concepto

Un **agente de compras con checkout PayPal**. El usuario pide algo en lenguaje natural; el agente busca en Channel3, compara productos y variantes, aplica un límite de gasto y ejecuta el checkout con aprobación humana.

## Usuario y problema

- Comprador que quiere encontrar y comprar sin abrir 10 pestañas.
- Tienda pequeña que quiere ser “buyable” por agentes.
- El problema no es buscar: es **decidir y pagar con confianza**.

## Flujo

1. “Find a birthday gift under $50.”
2. Channel3 devuelve productos normalizados.
3. El agente compara precio, variante y disponibilidad.
4. Propone 3 opciones con razón.
5. Policy valida presupuesto, moneda y allow-list.
6. El humano elige y aprueba.
7. Servidor crea la orden PayPal.
8. Checkout con JS SDK v6.
9. Captura + read-back + recibo.

## PayPal APIs

| Uso | API |
|---|---|
| Checkout | Orders v2 + JS SDK v6 |
| Reembolsos | Payments v2 |
| Eventos | Webhooks |
| Métodos guardados | Vault (opcional) |

## Sponsor: Channel3

- API o MCP para búsqueda, enriquecimiento y recomendaciones.
- 20,000 créditos con `PAYPAL-HACKATHON-2026`.
- El proyecto debe **llamar** a Channel3, no solo mencionarlo.
- Premio: $1,500.

## MVP (16 días)

- [ ] Búsqueda NL + llamada real a Channel3.
- [ ] 3 resultados normalizados con imagen, precio y link.
- [ ] Carrito simple + budget policy.
- [ ] Checkout PayPal sandbox.
- [ ] Confirmación y ledger.
- [ ] Seed/demo sin credenciales.
- [ ] Una acción de refund para mostrar confianza.

## Diferenciación

El espacio está saturado (~16/100). La ventaja debe ser la **capa de confianza**:

- Límite de gasto duro.
- Allow-list de merchants.
- Verificación de precio antes de capturar.
- Aprobación humana.
- Confirmación contra PayPal, no contra el carrito.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Competencia alta | Enfocar en confianza y evidencia |
| Channel3 créditos | 20k alcanzan; pedir top-up si hace falta |
| Shipping/tax | Empezar con producto digital o envío simple |
| Datos inconsistentes | Mostrar fuente y fecha de cada precio |
| Checkout real | Sandbox only |

## Reutilizar

- [[41 Repos clave|Shelf-Ready]] (auditoría de catálogo + MCP + policy)
- `paypal-examples/v6-web-sdk-sample-integration`
- Channel3 docs

## Demo (90 s)

1. Pedir “find a gift under $50”.
2. Ver 3 opciones con precio y fuente.
3. Elegir una; policy muestra el límite.
4. Aprobar; checkout PayPal sandbox.
5. Confirmar captura y recibo.
6. Mostrar el ledger con la evidencia.

## Enlaces

- [[33 Channel3]]
- [[60 Comparativa]]

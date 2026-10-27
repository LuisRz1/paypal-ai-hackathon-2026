---
title: Landscape GitHub
tags: [github, landscape, investigacion]
updated: 2026-10-27
---

# Landscape GitHub

## Metodología

- Búsqueda GitHub: `"PayPal AI Hackathon"` (frase exacta).
- Resultado: **286 repositorios**.
- Muestra analizada: **100** (orden por estrellas), lectura profunda de ~15.
- Fecha: 27 oct 2026.

## Señales de calidad

| Señal | Dato |
|---|---|
| Licencia | 73 MIT, 3 Apache-2.0, 23 sin licencia |
| Lenguajes | TypeScript 28, Python 23, JavaScript 15, Go 4 |
| Con ≥1 estrella | **12/100** |
| Desplegados y verificados | <10 |
| Repos que son solo scaffold | mayoría |

**Lectura:** terminar el flujo end-to-end es la mayor ventaja competitiva. El jurado premia demo funcional, no ambición.

## Clusters (sobre 100)

| Arquetipo | Repos | Saturación |
|---|---:|---|
| Shopping/commerce agent | 16 | Alta |
| Chat/voz (WhatsApp, asistente) | 16 | Alta |
| Payment firewall / policy / escrow | 11 | Media-alta |
| Invoicing / cobros | 8 | Media |
| Recuperación de pagos abandonados | 7 | Media |
| Disputas / chargebacks | 6 | Media |
| Pagos grupales | 5 | Baja-media |
| Payouts / treasury | 3 | Baja |
| Analytics / dashboard de merchant | 2 | **Muy baja** |
| Booking / scheduling | 2 | **Muy baja** |

## Huecos explotables

1. **Analytics de merchant con AG Studio.** Solo 2/100; el premio pide pulido y Agent Framework. Hay 5 premios AG Grid.
2. **Scheduling que depende de pagos (Bryntum).** Solo 2/100; 3 premios de $1k.
3. **Channel3 usado de verdad.** Muy pocos lo integran; 1 premio de $1.5k.
4. **Payouts/treasury.** Solo 3/100, y el Agent Toolkit no lo cubre: requiere REST.
5. **Verificación contra el ledger de PayPal.** Casi nadie lo hace; es un diferenciador de confianza.

## Anti-patrones vistos

- Dashboard que solo pinta un grid.
- “Agente” que en realidad es un formulario con un LLM decorativo.
- Mock que se presenta como sandbox real.
- Muchas integraciones a medias.
- README sin instrucciones reproducibles.
- Sin licencia o licencia no visible en About.
- Video que no muestra el flujo completo.

## Enlaces

- [[41 Repos clave]]
- [[50 Arquitectura canonica]]
- [[51 Patrones de confianza]]

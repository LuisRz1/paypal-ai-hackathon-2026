---
title: Demo y entrega
tags: [demo, video, submission]
updated: 2026-10-27
---

# Demo y entrega

## Estructura del video (3 min)

| Tiempo | Contenido |
|---|---|
| 0:00–0:20 | Problema y usuario concreto |
| 0:20–0:40 | Solución en una frase |
| 0:40–1:50 | Demo end-to-end: intención → PayPal → confirmación |
| 1:50–2:20 | Fallo + recuperación (rechazo, webhook perdido, disputa) |
| 2:20–2:40 | Arquitectura y confianza: policy, verificación, ledger |
| 2:40–3:00 | Impacto y siguiente paso |

Guion detallado: [[72 Guion del video]].

## Resiliencia de demo

- **Modo mock** sin credenciales, etiquetado.
- **Seed** de datos para que la UI nunca esté vacía.
- **Video grabado** de respaldo si falla internet.
- **Demo hospedada** con keepalive (Render free duerme).
- **Credenciales sandbox** de prueba en el README.
- **Un solo flujo** bien pulido, no cinco a medias.

## Evidencia

Guarda en `docs/evidence/`:

- Capturas del checkout y del ledger de PayPal.
- JSON de órdenes, capturas, refunds, webhooks.
- IDs de sandbox y `debug_id`.
- Fecha y commit de cada corrida.
- Distingue real vs simulado.

## README mínimo

1. Qué es y para quién.
2. Problema.
3. Features.
4. Arquitectura (diagrama).
5. Stack.
6. Setup paso a paso.
7. Variables de entorno.
8. Cómo probar el flujo.
9. Qué es real y qué es mock.
10. Sponsor tool usado.
11. Licencia.

## Judge-proofing

- El jurado puede no ejecutar el proyecto.
- La descripción y el video deben bastar.
- Enlaces del README verificados.
- El video no puede estar privado.
- El repo no puede contener `.env`.
- La licencia debe verse en el About.

## Enlaces

- [[12 Checklist de entrega]]
- [[72 Guion del video]]
- [[40 Landscape]]

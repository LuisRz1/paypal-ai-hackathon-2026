---
title: AG Grid
tags: [sponsor, ag-grid, ag-studio, dashboard]
source: https://paypalaihackathon.devpost.com/details/aggrid
updated: 2026-10-27
---

# AG Grid

## Qué es

AG Grid es la empresa detrás de grids, charts y dashboards usados por más de la mitad del Fortune 500.

**AG Studio** es una librería de analytics embebida: dashboards, charts y grids en un solo componente. El developer define los guardrails; el usuario final construye y edita dashboards sin código. Incluye data engine, cross-filtering y **Studio Agent Framework**.

## Oferta

- Trial **45 días**.
- Boilerplate oficial: https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate
- Premios: **$5,000 / $2,000 / $1,000 ×3**.
- Jurado: Sylwia Vargas (AG Grid).

## Qué premia

- Pulido: widgets custom, theming, layout tools.
- No basta con un AG Grid o AG Charts suelto.
- Usar el **Studio Agent Framework**: agente custom hablando con los agentes de Studio, o un harness intercambiado.

## Cómo integrarlo

El boilerplate oficial ya trae:

| Pieza | Archivo |
|---|---|
| PayPal REST (OAuth, paging, retries) | `lib/paypal.ts` |
| Datos del dashboard | `lib/dashboard-data.ts` |
| Endpoint pages con AG Grid | `app/(endpoints)/` |
| AG Studio dashboard | `app/dashboard/` |
| Config de Studio | `app/dashboard/studio/*` |
| Proxy IA server-side | `app/api/ai/responses/route.ts` |

Configuración:

- `AG_STUDIO` = license key.
- `AG_STUDIO_OPENAI_API_KEY` o `OPENAI_API_KEY` para el asistente.
- `OPENAI_MODELS` para lista de modelos.
- La key nunca llega al navegador.

## Ideas

- Dashboard de revenue, refunds y disputas por producto/cliente.
- Agente que responde “show PayPal revenue by customer segment this month” y crea el widget.
- Alertas de anomalías: picos de refunds o pagos fallidos.
- Scoreboard de facturas impagas con recordatorios.
- Donation dashboard con leaderboard y progreso de campaña.

## Riesgos

- AG Studio requiere licencia; sin ella hay watermark.
- El premio exige **pulido real**, no solo datos en un grid.
- La integración con el Agent Framework puede consumir tiempo; el boilerplate reduce el riesgo.

## Enlaces

- [[30 Mapa de sponsors]]
- [[61 Modelo A Merchant CFO]]
- AG Studio: https://www.ag-grid.com/studio/
- Quick start: https://www.ag-grid.com/studio/react/quick-start/
- Agent Framework: https://www.ag-grid.com/blog/introducing-the-ag-studio-agent-framework/
- Boilerplate: https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate

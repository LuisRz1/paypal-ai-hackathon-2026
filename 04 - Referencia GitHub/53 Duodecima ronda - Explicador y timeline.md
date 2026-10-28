---
title: Duodécima ronda · Explicador y timeline
tags: [auditoria, ia, timeline, browser]
updated: 2026-10-28
---

# Duodécima ronda · Explicador y timeline

Tres iteraciones sobre la capa de explicación y la visualización.

## Iteración 1 — Explicador de `reason_code`

`web/lib/explain.ts` mapea los 8 códigos de PayPal a:

- resumen,
- causa probable,
- acción recomendada,
- confianza,
- playbook.

Códigos: `PAYMENT_DENIED`, `PAYER_CANNOT_PAY`, `PAYER_ACCOUNT_RESTRICTED`, `PAYEE_ACCOUNT_RESTRICTED`, `SENDING_LIMIT_EXCEEDED`, `TRANSACTION_RECEIVING_LIMIT_EXCEEDED`, `CURRENCY_MISMATCH`, `INTERNAL_SERVER_ERROR`, más `UNKNOWN`.

6 tests:

```text
payment denied maps to capture
payer restricted maps to escalate
sending limit maps to plan change
internal error maps to wait
unknown falls back safely
new code falls back safely
# pass 6 / fail 0
```

## Iteración 2 — Timeline

`web/app/timeline.tsx` renderiza una fila por suscripción con barra de estado:

- azul: `ACTIVE`.
- rojo: `SUSPENDED`.
- gris: `EXPIRED` / `CANCELLED`.

Es CSS puro; Bryntum se integrará después. La timeline ya comunica el riesgo sin dependencias.

## Iteración 3 — Verificación en navegador

Chromium headless:

```text
timeline rows: 4
explanation visible: yes
```

Flujo: click `SUB-1002` → explicación “PayPal declined the payment” → aprobar → `VERIFIED`.

## Hallazgos

1. La explicación determinista es suficiente para el demo; el LLM puede añadir redacción, no decisiones.
2. La timeline sin Bryntum ya se entiende; Bryntum aporta drag, dependencias y baselines, no la idea.
3. El botón de aprobar sigue funcionando con la explicación visible.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + timeline + explainer | 25/30 |
| PayPal client + webhook | 5/15 |
| IA determinista | 3/10 |
| Demo/video | 0/15 |
| **Readiness** | **63/100** |

## Próximo paso

1. LLM opcional para redactar la explicación (con fallback determinista).
2. Bryntum real o mantener la timeline CSS.
3. Sandbox real.
4. Deploy + video.

## Enlaces

- [[52 Undecima ronda - Sandbox y webhooks]]
- [`web/README.md`](../web/README.md)
- [[72 Guion del video]]

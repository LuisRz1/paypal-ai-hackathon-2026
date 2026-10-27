---
title: Modelo D · Disputas
tags: [modelo, disputes, refunds, policy]
updated: 2026-10-27
---

# Modelo D · Disputas

## Concepto

Un **copiloto de disputas y cobros** para merchants pequeños. La IA triagea el caso, redacta una respuesta y prepara un refund o recordatorio; el servidor aplica policy; el humano aprueba; PayPal ejecuta; el ledger verifica.

## Usuario y problema

- Freelancer o tienda pequeña con disputas y facturas vencidas.
- El email y el dashboard de PayPal son abrumadores.
- Un refund automático mal hecho es peor que no hacer nada.

## Flujo

1. Llega una disputa o factura vencida.
2. El agente lee el caso y propone acción:
   - refund total/parcial,
   - aceptar claim,
   - enviar recordatorio,
   - pedir más evidencia.
3. Policy valida tipo, monto, captura, estado e idempotencia.
4. El humano aprueba.
5. Se ejecuta en PayPal.
6. Read-back del ledger.
7. Se registra en un audit hash-chained.

## PayPal APIs

| Uso | API |
|---|---|
| Disputas | Disputes API |
| Facturas | Invoicing v2 |
| Reembolsos | Payments v2 |
| Eventos | Webhooks |
| Evidencia | Detalles de disputa |

## Sponsor

No hay sponsor prize directo. Se puede usar AG Grid para el desk, pero entonces el objetivo sería AG Grid, no “disputas”.

## MVP (16 días)

- [ ] Listar disputas e invoices (sandbox o mock).
- [ ] Triage con LLM + plantilla determinista.
- [ ] Policy: monto máximo, una acción por caso, captura fijada.
- [ ] Aprobación humana.
- [ ] Refund o reminder real en sandbox.
- [ ] Read-back + ledger.
- [ ] Dashboard de casos.

## Diferenciación

- Verificación contra PayPal, no contra el retorno de la tool.
- Evidencia lista para el claim.
- Ledger hash-chained.
- Nunca auto-refund sin aprobación.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Sin sponsor prize | Apuntar a Most Impactful / PayPal+AI |
| Sandbox sin disputas | Mock fixtures + modo sandbox |
| Complejidad de evidencia | Empezar con INR/SNAD simple |
| Doble acción | Idempotencia por caso |

## Reutilizar

- [[41 Repos clave|DisputeSteward]]
- [[41 Repos clave|Refundly]]
- PayPal Disputes API

## Demo (90 s)

1. Abrir desk con 3 casos.
2. Seleccionar una disputa; ver recomendación y borrador.
3. Intentar un monto fuera de policy; se bloquea.
4. Aprobar el refund correcto.
5. Verificar en PayPal y mostrar el ledger.
6. Cambiar a una factura vencida y aprobar un recordatorio.

## Enlaces

- [[60 Comparativa]]
- [[23 Payouts Disputes Reports]]

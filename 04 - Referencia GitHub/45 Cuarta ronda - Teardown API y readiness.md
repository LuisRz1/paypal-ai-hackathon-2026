---
title: Cuarta ronda · Teardown, API y readiness
tags: [auditoria, teardown, api, compliance]
updated: 2026-10-28
---

# Cuarta ronda · Teardown, API y readiness

Tres pasadas nuevas: código de los competidores, validación del esquema OpenAPI y preparación real para submission.

## Iteración 1 — Teardown de los competidores

### Rebuttal — el listón real

Código revisado: `backend/rebuttal/paypal/client.py` y `backend/rebuttal/approval.py`.

Lo que hace bien:

- **Write gate en el transporte HTTP**, no solo en la capa de aplicación:
  - `WriteGateTransport` rechaza cualquier POST/PATCH/PUT/DELETE fuera de `permit_writes()`.
  - `ReadOnlyTransport` solo permite GET/HEAD y los POST de OAuth/verify-webhook.
  - El cliente de análisis no tiene `client_secret`.
- **Un solo write path**: solo el nodo `execute` puede escribir; un test escanea el paquete para impedir otro camino.
- **Aprobación con `interrupt()`** de LangGraph; el estado queda checkpointed y sobrevive reinicios.
- **Idempotencia determinista**: `uuid5(proposal_id, index, kind)` como `PayPal-Request-Id`.
- **Fail-closed**: `already_applied` y `not_allowed_now` releen la disputa antes de reintentar; si el estado cambió, no envía.
- **1,000+ tests** y CI con CodeQL, gitleaks, OSV y Playwright.

Debilidad:

- La API de Disputes no documenta `PayPal-Request-Id`; la idempotencia es best-effort.
- Muchos `VERIFY` pendientes; complejidad alta.
- Es específico de disputas, no de suscripciones.

**Lección:** copiar el **write gate + read-only clone + approval interrupt + idempotencia**, no la superficie de tests.

### Stood — arquitectura amplia, no toda shipped

`S17` admite:

- A2A/AP2: **planned**, no implementado.
- HTTP financiero: **off**.
- Evidencia de runner: sintética, no autenticada.
- “What can be shown today”: fixtures sintéticos, no sandbox real.

**Lección:** el README es una visión, no un estado. Para el hackathon basta un flujo real y verificable.

### Docket — solo lectura verificada

`PROJECT_STATUS.md`:

| Capacidad | Estado |
|---|---|
| OAuth sandbox | VERIFIED |
| Listar/leer disputas | VERIFIED |
| Orders create/capture | VERIFIED |
| Evidence reconciliation | **PLANNED** |
| Deterministic policy barrier | **PLANNED** |
| AI extraction | **PLANNED** |
| AG Grid UI | **PLANNED** |
| E2E + video | **PLANNED** |

**Corrección:** Docket no es “reference grade” completo; es un spike read-only con tests. La UI y la evidencia están planificadas.

### Conclusión del teardown

- Solo **Rebuttal** tiene ingeniería de producción real en el cluster de disputas.
- **Stood** y **Docket** tienen READMEs aspiracionales; su valor es de diseño, no de implementación.
- **Terminar un flujo** sigue siendo la ventaja competitiva.

## Iteración 2 — Validación del esquema de Subscriptions

Consultado el OpenAPI `v1.11` (`/api/subscriptions/v1/schema.json`).

### Captura de saldo pendiente

`POST /v1/billing/subscriptions/{id}/capture`

```json
{
  "note": "Outstanding balance",
  "capture_type": "OUTSTANDING_BALANCE",
  "amount": { "value": "20.00", "currency_code": "USD" }
}
```

| Campo | Regla |
|---|---|
| `note` | Requerido, 1–128 caracteres |
| `capture_type` | Requerido; único valor `OUTSTANDING_BALANCE` |
| `amount` | Requerido; **no puede superar el outstanding balance** |
| `PayPal-Request-Id` | Soportado; usarlo para idempotencia |

### Estado de la suscripción

`subscription_billing_info`:

| Campo | Uso |
|---|---|
| `outstanding_balance` | Saldo a recuperar |
| `failed_payments_count` | Fallos consecutivos; al llegar al umbral → `SUSPENDED` |
| `last_failed_payment.amount/time` | Último fallo |
| `last_failed_payment.reason_code` | `PAYMENT_DENIED`, `PAYER_CANNOT_PAY`, `PAYER_ACCOUNT_RESTRICTED`, etc. |
| `last_failed_payment.next_payment_retry_time` | Próximo reintento de PayPal |
| `next_billing_time` | Próximo ciclo |

Estados: `APPROVAL_PENDING`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`.

### Plan

| Campo | Regla |
|---|---|
| `payment_failure_threshold` | 0–999, default 0 |
| `auto_bill_outstanding` | Boolean, default true |

### Implicaciones para “Recover”

1. **No existe “retry now”**: PayPal reintenta cada 5 días, 2× por ciclo.
2. El agente debe leer `billing_info` y mostrar:
   - próximo reintento,
   - saldo pendiente,
   - motivo del fallo.
3. Si está `SUSPENDED` y hay saldo, la acción es **capturar el saldo exacto**.
4. Después de capturar, **verificar si la suscripción vuelve a `ACTIVE` o requiere `activate`**. Esto no está claro en el schema; el spike debe confirmarlo.
5. Si no se puede capturar, ofrecer cambio de plan, pausa o escalado humano.

### Schema de datos mínimo

```text
subscriptions(id, status, plan_id, next_billing_time,
              outstanding_balance, failed_payments_count,
              last_failed_amount, last_failed_reason,
              next_retry_time, updated_at)
recovery_actions(id, subscription_id, kind, amount, status,
                 paypal_request_id, verified_at)
```

## Iteración 3 — Readiness para submission

### Score actual

| Área | Puntos | Nota |
|---|---:|---|
| Research / estrategia | 20/20 | Vault completo |
| Repo público + licencia | 10/10 | MIT visible |
| App funcional | 0/30 | No existe |
| Integración PayPal | 0/15 | No existe |
| IA | 0/10 | No existe |
| Demo hospedada | 0/5 | No existe |
| Video | 0/5 | No existe |
| Texto de submission | 0/5 | No existe |
| **Total** | **30/100** | **No submittable todavía** |

### Gaps bloqueantes

- No hay app, ni sandbox, ni demo URL.
- No hay video.
- No hay credenciales de prueba.
- No hay `README` de ejecución para jueces.
- El sponsor Bryntum no se está usando todavía.

### Reglas de submission

- Repo público con licencia: ✅.
- Demo funcional: ❌.
- Video <3 min público: ❌.
- Inglés: ✅ (README y notas).
- Herramientas de IA explicadas: ❌ (aún no hay IA).

### Plan inmediato

1. **Spike de 2 h**: crear product/plan/subscription y probar `capture OUTSTANDING_BALANCE`.
2. **Esqueleto de app** en Next.js:
   - `/api/paypal/*`
   - `/api/webhooks/paypal`
   - `/api/agent`
   - `/api/recover`
3. **Seed** de 3 suscripciones: activa, fallida, suspendida.
4. **Timeline Bryntum** con 3 estados.
5. **Agente** que propone 3 acciones con policy.
6. **Read-back** y ledger.
7. **Deploy** en Render.
8. **Video** y submission.

## Decisión

**GO**, pero el estado real es **30/100**. La investigación ya no es el cuello de botella; la app sí.

**Prioridad absoluta:** spike + esqueleto. Nada de más notas hasta que exista un flujo end-to-end.

## Enlaces

- [[43 Red team - Renewal Radar]]
- [[44 Tercera ronda - Verificacion y pre-mortem]]
- [[62 Modelo B Scheduler]]
- [[71 Backlog 16 dias]]

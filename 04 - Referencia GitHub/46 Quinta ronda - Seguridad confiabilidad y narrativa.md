---
title: Quinta ronda · Seguridad, confiabilidad y narrativa
tags: [auditoria, seguridad, confiabilidad, narrativa]
updated: 2026-10-28
---

# Quinta ronda · Seguridad, confiabilidad y narrativa

Tres pasadas nuevas: threat model, operación y encaje de mercado.

## Iteración 1 — Threat model

### Activos a proteger

1. Credenciales PayPal (`client_secret`).
2. Capacidad de capturar dinero.
3. Webhook de suscripciones.
4. Datos de suscriptores (email, historial, motivo de fallo).
5. Ledger de acciones.

### Amenazas y controles

| Amenaza | Control obligatorio |
|---|---|
| Prompt injection en email/mensaje del cliente | El LLM **no** decide montos ni destinatarios; todo sale de `billing_info.outstanding_balance` |
| Webhook falso | Verificar firma de PayPal; dedupe por `event.id`; rechazar sin `PAYPAL_WEBHOOK_ID` |
| Doble captura por reintento | `PayPal-Request-Id` determinista + read-back de `outstanding_balance` antes de reintentar |
| Secreto filtrado | `PAYPAL_CLIENT_SECRET` solo server-side; nunca `NEXT_PUBLIC_`; `.env` fuera del repo |
| Herramientas demasiado amplias | Cliente read-only para análisis; write gate; un solo `execute` |
| Sandbox/live mezclados | Allow-list de host `api-m.sandbox.paypal.com`; rechazar live salvo flag explícito |
| PII en logs/LLM | Redactar emails/nombres; enviar solo el motivo y el monto al modelo |
| Monto manipulado | Recalcular desde PayPal; `amount <= outstanding_balance`; validar con Zod |
| Acción sin aprobación | Estado `AWAITING_APPROVAL`; sin aprobación no se entra al write gate |
| Replay de webhook | Tabla `webhook_events` con PK `event.id`; procesar una sola vez |

### Modelo de capas (copiado de Rebuttal)

1. **Write gate en el transporte HTTP**: rechaza POST/PATCH/PUT/DELETE fuera de `permit_writes()`.
2. **Cliente read-only** para análisis: solo GET/HEAD; sin secret.
3. **Un solo `execute`**: recibe la aprobación y hace la captura.
4. **Test de frontera**: escanea el paquete para impedir otro camino de escritura.
5. **Audit log** append-only con `request_id`, propuesta, aprobación y resultado.

### Checklist de seguridad

- [ ] Firma de webhook verificada.
- [ ] Dedupe por `event.id`.
- [ ] `PayPal-Request-Id` determinista.
- [ ] Read-back antes de reintentar.
- [ ] Sin secret en cliente.
- [ ] Host sandbox allow-list.
- [ ] LLM sin acceso a writes.
- [ ] PII redactada.
- [ ] Monto siempre desde PayPal.
- [ ] Aprobación humana explícita.

## Iteración 2 — Confiabilidad y operación

### Máquina de estados

```text
ACTIVE
  └─ PAYMENT_FAILED (failed_payments_count=1, next_payment_retry_time)
       └─ SUSPENDED (count >= threshold, outstanding_balance > 0)
            └─ RECOVERY_PROPOSED
                 ├─ CAPTURED → VERIFIED → REACTIVATED
                 ├─ PLAN_CHANGED
                 ├─ PAUSED
                 └─ ESCALATED
```

### Fallos y respuestas

| Fallo | Respuesta |
|---|---|
| Webhook perdido | Cron de reconciliación cada 15 min |
| Captura con timeout | Leer suscripción y `outstanding_balance` antes de reintentar |
| `422` de PayPal | Refrescar estado; no reintentar a ciegas |
| `409`/estado ya cambiado | Marcar `stale`; pedir nueva propuesta |
| `429` | Backoff exponencial; cachear token; usar webhooks, no polling |
| LLM caído | Reglas deterministas y plantillas |
| DB caída | Cola de reintento; no perder el evento |
| Cold start | Keepalive o instancia paga en Render |
| Trial Bryntum expirado | Timeline fallback |

### SLOs

| Métrica | Objetivo |
|---|---|
| Webhook 2xx | < 2 s |
| Propuesta de recuperación | < 10 s |
| Captura | < 5 s |
| Dashboard | < 3 s |
| Recuperaciones verificadas | > 99% |

### Coste

- El agente solo se invoca en eventos de fallo, no en cada request.
- 1–2 llamadas al LLM por recuperación; modelo barato; fallback a reglas.
- Cachear token OAuth y datos de suscripción.
- Presupuesto: <$5 para toda la demo.

### Rate limits

PayPal no publica política; puede devolver `429 RATE_LIMIT_REACHED`. No hacer polling: usar webhooks y cachear tokens.

## Iteración 3 — Narrativa y mercado

### La categoría ya existe

Productos de dunning/recovery:

- Churn Buster (PayPal integration).
- Slicker (PayPal-specific recovery).
- FlyCode (PayPal subscriptions).
- Recurly, Chargebee, Paddle Retain.

**Implicación:** “recuperar pagos fallidos” no es novedoso por sí solo. La diferenciación debe ser:

1. **PayPal-native**: usa el **outstanding balance** y los reintentos de PayPal, no una tarjeta guardada.
2. **Enfocado en suscripciones suspendidas**, no en cualquier cobro.
3. **Proof-carrying actions**: policy + aprobación + read-back + ledger.
4. **Timeline operativa** (Bryntum) que muestra el próximo reintento y el riesgo de churn.
5. **Open source**.

### Benchmarks

| Dato | Valor | Fuente |
|---|---|---|
| Churn involuntario mensual | ~0.86% de suscriptores | Recurly 2024, vía Builtplain |
| Parte del churn total | ~26% | Recurly 2024 |
| Tasa mediana de recuperación | ~47.6% | Recurly, vía Slicker |
| Pérdida estimada 2025 | ~$129B | Slicker (estimación) |

### Ejemplo de impacto

Asunciones: 1,000 suscripciones, $29/mes, 0.86% de fallo mensual.

- Suscripciones en riesgo: ~8.6/mes.
- MRR en riesgo: ~$249/mes.
- Recuperación al 47.6%: ~$119/mes.
- Anualizado: ~$1,428.

Para 10,000 suscripciones: ~$14,280/año recuperados. Es un problema real, pero el pitch debe hablar de **porcentaje de churn involuntario evitado**, no de millones.

### Pitch en una frase

> “PayPal ya reintenta el pago. Recover hace que el merchant actúe sobre el saldo pendiente antes de que el suscriptor se vaya.”

### Guion del video (2:45)

| Tiempo | Contenido |
|---|---|
| 0:00–0:20 | Un renewal falla; PayPal reintenta; el merchant no se entera; la suscripción se suspende |
| 0:20–0:40 | “El 26% del churn es involuntario; la recuperación mediana es 47.6%” |
| 0:40–1:10 | Timeline: suscripción en riesgo, motivo, próximo reintento, saldo |
| 1:10–1:40 | Agente diagnostica y propone: capturar saldo, cambiar plan, pausar |
| 1:40–2:05 | Aprobación humana; captura `OUTSTANDING_BALANCE` |
| 2:05–2:25 | Read-back: saldo 0, estado verificado, ledger |
| 2:25–2:45 | Impacto y cierre |

### Mapeo a criterios

| Criterio | Evidencia |
|---|---|
| Tech | Subscriptions API, webhooks, capture, read-back |
| Design | Timeline + inbox + estado claro |
| Impact | Churn involuntario y MRR recuperado |
| Innovation | PayPal-native outstanding balance + proof-carrying actions |
| Presentation | Antes/después en 90 s |

## Decisión

**GO**, con un ajuste de narrativa:

- No vender “dunning” genérico.
- Vender **“PayPal-native recovery for suspended subscriptions”**.
- El diferenciador técnico es la captura de `OUTSTANDING_BALANCE` con verificación y aprobación.

## Enlaces

- [[45 Cuarta ronda - Teardown API y readiness]]
- [[51 Patrones de confianza]]
- [[72 Guion del video]]
- [[62 Modelo B Scheduler]]

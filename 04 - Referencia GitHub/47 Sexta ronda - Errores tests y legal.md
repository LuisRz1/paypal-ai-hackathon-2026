---
title: Sexta ronda · Errores, tests y legal
tags: [auditoria, api, testing, legal]
updated: 2026-10-28
---

# Sexta ronda · Errores, tests y legal

Tres pasadas nuevas: errores reales de la API, plan de pruebas y riesgos legales/competitivos.

## Iteración 1 — Errores reales de `capture`

Del OpenAPI `subscriptions.capture-422`:

| Issue | Significado | Acción |
|---|---|---|
| `ZERO_OUTSTANDING_BALANCE` | Saldo 0 | Marcar recuperado/no-op |
| `AMOUNT_GREATER_THAN_OUTSTANDING_BALANCE` | Monto > saldo | Recalcular desde `billing_info` |
| `CURRENCY_MISMATCH` | Moneda distinta | Bloquear y alertar |
| `SUBSCRIPTION_STATUS_INVALID` | Estado no permite captura | Refrescar; si `EXPIRED`, no reintentar |
| `SUBSCRIBER_ACCOUNT_LOCKED` | Cuenta del suscriptor bloqueada | Escalar a humano |
| `SUBSCRIBER_ACCOUNT_CLOSED` | Cuenta cerrada | Escalar; no reintentar |
| `SUBSCRIBER_ACCOUNT_RESTRICTED` | Cuenta restringida | Escalar; no reintentar |
| `USER_ACCOUNT_CLOSED` | Cuenta cerrada | Escalar; no reintentar |

`capture-400`: `MISSING_REQUEST_BODY`, `INVALID_PARAMETER_VALUE`, `INVALID_STRING_MAX_LENGTH`, `MISSING_REQUIRED_PARAMETER`.

### Reglas

- `capture_type` debe ser `OUTSTANDING_BALANCE`.
- `amount` **no puede superar** el saldo.
- `note` requerido, 1–128.
- La captura se permite en `ACTIVE`, `SUSPENDED` o `EXPIRED`.
- Después de capturar, **verificar estado**. Si sigue `SUSPENDED`, llamar:

```http
POST /v1/billing/subscriptions/{id}/activate
{ "reason": "Outstanding balance recovered" }
```

`activate` devuelve `204`; `reason` es requerido para reactivar.

### Máquina de estados con errores

```text
SUSPENDED
  ├─ capture OK → GET subscription
  │    ├─ ACTIVE → done
  │    └─ SUSPENDED → activate → GET → done
  ├─ ZERO_OUTSTANDING_BALANCE → done (nada que cobrar)
  ├─ AMOUNT_GREATER... → recompute → retry once
  ├─ CURRENCY_MISMATCH → block + alert
  ├─ STATUS_INVALID → refresh; si EXPIRED → escalate
  └─ ACCOUNT_* → escalate, no retry
```

## Iteración 2 — Plan de pruebas

### Capas

| Capa | Qué prueba | Sin credenciales |
|---|---|---|
| Unit | State machine, montos, moneda, policy, idempotencia | Sí |
| Contract | PayPal mock con fixtures de error | Sí |
| Integration | Webhook firma, dedupe, replay, timeout | Sí |
| Sandbox E2E | product → plan → subscription → capture → activate | No |
| Demo | 3 suscripciones seed + timeline + agente | Sí (mock) |

### Matriz mínima

| Caso | Esperado |
|---|---|
| `amount == outstanding` | Captura OK |
| `amount > outstanding` | 422; recalcular |
| `amount` con 3 decimales | 400; validar |
| `capture_type` distinto | 400; bloqueado |
| `note` vacío | 400; bloqueado |
| Saldo 0 | No-op |
| Moneda distinta | Bloqueo |
| Suscripción `EXPIRED` | Escalar, no activar |
| Webhook duplicado | Procesar una vez |
| Webhook sin firma | 401 |
| Captura con timeout | Read-back antes de reintentar |
| `429` | Backoff y reintento |

### Criterios de aceptación

- [ ] Una suscripción `SUSPENDED` con saldo se recupera y verifica.
- [ ] Un error `AMOUNT_GREATER...` no produce segunda captura.
- [ ] Un webhook duplicado no duplica la acción.
- [ ] El ledger reconstruye la secuencia completa.
- [ ] El modo mock funciona sin claves.
- [ ] El E2E sandbox se ejecuta al menos una vez.

## Iteración 3 — Legal, licencias y objeciones

### Bryntum

- Trial de **45 días**, funcionalidad completa.
- **End-User License** es perpetua para apps internas donde el usuario final no paga.
- Para **SaaS comercial que se redistribuye por una fee** se requiere **OEM license**.
- Cada developer necesita su propia licencia.
- Para el hackathon, el trial es aceptable; **no** presentar el proyecto como producto comercial listo.

**Acción:** añadir `THIRD_PARTY_NOTICES.md` y no afirmar producción.

### AG Grid / AG Studio

- AG Grid Community: MIT, uso libre.
- AG Studio: suscripción/trial 45 días.
- Si se usa AG Studio, no commitear la license key.

### Channel3

- API key y créditos de hackathon; respetar términos.
- No scrapear ni almacenar datos de producto fuera de lo permitido.

### PayPal

- Branding y botones oficiales.
- No editar mensajes de Pay Later.
- No almacenar credenciales de PayPal.
- Sandbox only; sin datos reales.

### Objeciones previsibles del jurado

| Objeción | Respuesta |
|---|---|
| “Esto ya existe” (Churn Buster, Slicker, FlyCode) | Sí, pero son cerrados y card-first/email-first. Recover es open source, PayPal-native y captura el `OUTSTANDING_BALANCE` con aprobación y verificación. |
| “PayPal ya reintenta” | Sí, 2× por ciclo. Recover actúa **después** del fallo: saldo pendiente, cambio de plan, pausa o escalado. |
| “¿Por qué IA?” | Diagnostica el `reason_code` y redacta opciones; el código decide montos y policy. |
| “¿Por qué Bryntum?” | El timeline hace visible el próximo reintento, el saldo y el riesgo de churn; 3 slots de sponsor. |
| “¿Es seguro?” | Write gate, read-only, aprobación humana, idempotencia, read-back, ledger. |
| “¿Funciona en producción?” | No se afirma; sandbox, trial y demo. |

## Decisión

**GO**, con tres exigencias nuevas:

1. Implementar la matriz de errores de `capture` desde el día 1.
2. Escribir tests de contrato con fixtures de error antes de la UI.
3. Añadir `THIRD_PARTY_NOTICES.md` y no afirmar producción.

## Enlaces

- [[45 Cuarta ronda - Teardown API y readiness]]
- [[46 Quinta ronda - Seguridad confiabilidad y narrativa]]
- [[51 Patrones de confianza]]
- [[73 Esquema de datos]]

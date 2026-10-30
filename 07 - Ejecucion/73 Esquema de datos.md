---
title: Esquema de datos
tags: [ejecucion, datos, policy, evidence]
updated: 2026-10-28
---

# Esquema de datos · Recover Control Plane

La aplicación actual es un demo en memoria. Estos son los contratos implementados, no un esquema Postgres desplegado.

## `RecoveryPolicy`

| Campo | Tipo | Regla |
|---|---|---|
| `schemaVersion` | `1` | Obligatorio |
| `name` | string | 1–80 caracteres seguros |
| `requireHumanApproval` | `true` | No configurable |
| `maxCaptureAmount` | number \| null | Máximo dos decimales |
| `allowedCurrencies` | string[] \| null | Códigos ISO de tres letras |
| `rules` | `RecoveryPolicyRule[]` | Ordenadas; IDs únicos |
| `fallback` | `"BASELINE"` | No configurable |

Cada regla contiene `id`, `reason`, `action` y `when`. Las condiciones disponibles son `status`, `outstanding`, `minFailedPayments` y `reasonCode`.

La política activa añade `id`, `hash`, `intent`, `source`, `activatedAt` y `simulationHash`.

## `Proposal`

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | Identificador del caso |
| `subscriptionId` | string | Suscripción objetivo |
| `action` | string | `CAPTURE` en el flujo actual |
| `amount` / `outstanding` | number | Derivados del saldo, no del LLM |
| `currency` | string | Moneda de la suscripción |
| `note` | string | Nota para PayPal |
| `status` | enum | Ver estados abajo |
| `requestId` | uuid | Idempotency key de PayPal |
| `policyHash` | string | Versión exacta de política |
| `createdAt` | ISO timestamp | Creación |
| `approvedBy` | string opcional | Display name, no identidad verificada |
| `approvedAt` | ISO timestamp opcional | Aprobación |
| `capabilityHash` | string opcional | Hash del token, nunca el token |

Estados:

```text
AWAITING_APPROVAL → EXECUTED → VERIFIED
AWAITING_APPROVAL → EXECUTED → PENDING_VERIFICATION
AWAITING_APPROVAL → FAILED
EXECUTED → PENDING_VERIFICATION
```

## `CapabilityPayload`

| Campo | Contenido |
|---|---|
| `proposalId` | Caso autorizado |
| `subscriptionId` | Suscripción exacta |
| `amount` | String decimal, por ejemplo `49.00` |
| `currency` | Moneda exacta |
| `policyHash` | Política autorizada |
| `requestId` | Idempotencia PayPal |
| `nonce` | Valor único para replay protection |
| `expiresAt` | Expiración en milisegundos |

El token se firma con HMAC-SHA256. El store guarda solo su hash y los nonces consumidos.

## `LedgerEvent`

| Campo | Tipo | Nota |
|---|---|---|
| `id` | uuid | Evento |
| `type` | string | `proposal`, `approval`, `policy`, `capture`, `verify`, `failure`, `webhook` |
| `proposalId` | string | Vacío para eventos globales |
| `at` | ISO timestamp | Tiempo del evento |
| `detail` | object | Snapshot sin secretos |
| `sequence` | number | Secuencia de inserción |
| `previousHash` | string | Hash anterior; vacío en el primero |
| `hash` | string | SHA-256 del contenido canónico |

El passport incluye el **ledger completo** para no romper los enlaces de la cadena.

## `RecoveryEvidence`

Contiene:

- `environment`: `mock` o `sandbox`.
- Política activa y documento completo.
- Snapshot redactado de suscripción antes de capturar.
- Aprobador, timestamp, `requestId` y `capabilityHash`.
- Resultado de captura, read-back y activación.
- `verified` y `pendingVerification`.

No incluye credenciales, token de capability, email ni dirección del subscriber.

## `RecoveryPassport`

Formato: `recover-passport/v1`.

```text
payload
payloadHash = SHA256(canonicalJSON(payload))
signature = Ed25519(payloadHash)
publicKeyPem
keyId = SHA256(publicKeyPem)
algorithm = Ed25519
```

La verificación comprueba estructura, hash del payload, cadena del ledger, key ID, confianza en la clave y firma.

## Stores actuales

| Store | Persistencia | Límite |
|---|---|---|
| Política activa y baseline cache | `globalThis` | Se reinicia |
| `proposals` | `globalThis` | Se reinicia |
| `ledger` | `globalThis` | Se reinicia |
| `recovered` | Flag mock por suscripción | Se reinicia |
| `recoveryEvidence` | `globalThis` | Se reinicia |
| Nonces consumidos | `Set` en proceso | Se reinicia |
| Secret HMAC | Bytes aleatorios en proceso | Rota al reiniciar |
| Par Ed25519 | Generado en proceso | Rota al reiniciar |
| Webhook IDs vistos | `globalThis` | Se reinicia |

## Invariantes

1. El importe de captura viene del saldo de la suscripción.
2. Toda captura tiene aprobación humana explícita.
3. Capability, propuesta, política y request ID deben coincidir.
4. Un nonce solo puede consumirse una vez por proceso.
5. Un outcome incierto queda `PENDING_VERIFICATION`, nunca se reintenta a ciegas.
6. `webhook_events.id` es único por proceso.
7. Los eventos del ledger no se reordenan para presentación.
8. `verified` requiere read-back real en sandbox; mock se etiqueta como mock.
9. La activación de política repite los 288 casos en el servidor.

## Persistencia futura

Postgres, almacenamiento duradero de claves y un reconciliador siguen pendientes. No forman parte del estado implementado ni deben presentarse como existentes.

## Enlaces

- [[74 Recover Control Plane]]
- [[50 Arquitectura canonica]]
- [[51 Patrones de confianza]]

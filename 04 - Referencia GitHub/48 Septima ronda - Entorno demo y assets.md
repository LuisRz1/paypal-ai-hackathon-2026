---
title: Séptima ronda · Entorno, demo y assets
tags: [auditoria, entorno, demo, submission]
updated: 2026-10-28
---

# Séptima ronda · Entorno, demo y assets

Tres pasadas nuevas: viabilidad del entorno, diseño exacto del demo y auditoría de assets de submission.

## Iteración 1 — Entorno de build

| Herramienta | Versión | Estado |
|---|---|---|
| Node | 22.23.0 | OK (Next.js 15/16) |
| npm | 10.9.8 | OK |
| npx | 10.9.8 | OK |
| Python | 3.12.9 | OK para spike/scripts |
| Git | 2.53.0 | OK |
| curl | 8.13.0 | OK |
| jq/jaq | 3.1.1 | OK |

**Hallazgo:** `pnpm` no está instalado. No es bloqueante: usar **npm** en lugar de pnpm.

**Repo:** 250 KB, 40 notas, sin app. Windows; no se necesita Docker.

**Decisión de stack:** Next.js con npm, TypeScript, Tailwind. Scripts de spike en Python o Node. Sin monorepo.

**Riesgos de entorno:**

- Windows + rutas con espacios: la ruta actual no tiene espacios; mantenerla.
- Next.js en Windows: OK.
- Sin Docker: usar SQLite o Postgres local/Neon.
- `pnpm` ausente: no copiar comandos de repos que lo usen.

## Iteración 2 — Demo exacto

### Seed de suscripciones

| ID | Estado | Plan | Monto | Fallos | Saldo | Motivo | Próximo retry |
|---|---|---|---|---:|---:|---:|---|---|
| `SUB-1001` | ACTIVE | Pro | $29 | 0 | $0 | — | 5 nov |
| `SUB-1002` | SUSPENDED | Pro | $49 | 2 | $49 | `PAYMENT_DENIED` | — |
| `SUB-1003` | ACTIVE | Starter | $19 | 1 | $19 | `PAYER_CANNOT_PAY` | 30 oct |
| `SUB-1004` | EXPIRED | Legacy | $99 | 3 | $0 | `SUBSCRIBER_ACCOUNT_CLOSED` | — |

### Pantallas

1. **Timeline (Bryntum Scheduler)**
   - Una fila por suscripción.
   - Barras de periodo de billing.
   - Marcadores de fallo, retry y suspensión.
   - Color por estado: verde activo, ámbar fallo, rojo suspendido, gris expirado.

2. **Detalle**
   - Cliente, plan, monto, estado.
   - `outstanding_balance`, `failed_payments_count`.
   - `reason_code`, `next_payment_retry_time`.
   - Última acción y ledger.

3. **Propuesta del agente**
   - Tarjetas: capturar saldo, cambiar plan, pausar, escalar.
   - Razón y policy checks.
   - Botón “Aprobar”.

4. **Aprobación**
   - Monto exacto, moneda, `PayPal-Request-Id`.
   - Confirmación explícita.

5. **Verificación**
   - Read-back: saldo 0, estado `ACTIVE` o `SUSPENDED`.
   - Ledger con hash.

### Camino de 90 segundos

1. Abrir timeline; ver `SUB-1002` en rojo.
2. Click; ver saldo $49 y `PAYMENT_DENIED`.
3. Agente propone capturar $49.
4. Aprobar.
5. Ver captura y read-back.
6. Timeline cambia a verde/verificado.

### Estados de UI que faltan

- Loading, empty, error.
- Badge de “sandbox” y “mock”.
- Confirmación de acción irreversible.
- Estado `stale` si PayPal cambió.
- Estado `escalated` si la cuenta está restringida.

## Iteración 3 — Assets de submission

| Asset | Estado | Deadline |
|---|---|---|
| Repo público + LICENSE | ✅ | — |
| README de investigación | ✅ | — |
| README de app + setup | ❌ | 9 nov |
| App funcional | ❌ | 8 nov |
| Demo hospedada | ❌ | 9 nov |
| Credenciales de prueba | ❌ | 9 nov |
| Video <3 min | ❌ | 10 nov |
| Texto de submission | ❌ | 11 nov |
| Screenshots | ❌ | 10 nov |
| `THIRD_PARTY_NOTICES.md` | ❌ | 9 nov |
| Seed/demo data | ❌ | 5 nov |

### Ruta crítica

| Fecha | Entregable |
|---|---|
| 28–29 oct | Spike `capture OUTSTANDING_BALANCE` |
| 30 oct–2 nov | Esqueleto Next.js + PayPal + DB |
| 3–5 nov | Timeline + detalle + agente |
| 6–7 nov | Aprobación + read-back + ledger |
| 8 nov | Tests + modo mock |
| 9 nov | Deploy + README + notices |
| 10 nov | Video + screenshots |
| 11 nov | Submission |
| 12 nov | Buffer |

### Score de submission

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App | 0/30 |
| PayPal | 0/15 |
| IA | 0/10 |
| Demo/video | 0/15 |
| **Total** | **30/100** |

## Decisión

El entorno está listo. El demo está diseñado. Los assets faltantes son todos de **construcción**, no de investigación.

**No hay más iteraciones útiles.** La siguiente acción es código:

1. Spike de 2 h.
2. Esqueleto Next.js con npm.
3. Seed de 4 suscripciones.
4. Timeline Bryntum.
5. Agente + policy + read-back.

## Enlaces

- [[47 Sexta ronda - Errores tests y legal]]
- [[71 Backlog 16 dias]]
- [[72 Guion del video]]
- [[73 Esquema de datos]]

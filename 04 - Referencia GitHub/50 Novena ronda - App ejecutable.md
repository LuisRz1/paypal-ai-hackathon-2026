---
title: Novena ronda · App ejecutable
tags: [auditoria, app, nextjs, smoke-test]
updated: 2026-10-28
---

# Novena ronda · App ejecutable

Tres iteraciones sobre código real: esqueleto, APIs y smoke test.

## Iteración 1 — Esqueleto Next.js

Creado `web/` con:

- Next.js 15.5.28, React 19.3.1, TypeScript.
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- `lib/state-machine.ts` con la lógica del spike.
- `seed.json` con 4 suscripciones.

Build:

```text
✓ Compiled successfully
Route (app)
┌ ○ /              1.29 kB
├ ƒ /api/recover     127 B
└ ƒ /api/seed        127 B
```

## Iteración 2 — APIs

- `GET /api/seed`: devuelve 4 suscripciones + metadata (`source`, `environment`, `generatedAt`).
- `POST /api/recover`: recibe `{ subscriptionId }`, valida y devuelve la acción.

Smoke:

```json
{
  "subscriptionId": "SUB-1002",
  "action": {
    "action": "CAPTURE",
    "amount": 49,
    "reason": "outstanding_balance"
  }
}
```

## Iteración 3 — UI

`/` renderiza la tabla de suscripciones, estado, saldo y acción. El botón “Propose recovery” solo se habilita para `CAPTURE`.

Smoke: `curl http://127.0.0.1:3100` devuelve la página con “Recover”.

## Resultado

- `npm run build`: OK.
- `npm run start -p 3100`: OK.
- 4 suscripciones cargadas.
- `SUB-1002` propone capturar $49.
- `SUB-1003` queda en `WAIT`.
- `SUB-1004` escala.

## Lo que falta

| Falta | Estado |
|---|---|
| PayPal mock con fixtures de error | Pendiente |
| Approval gate real | Pendiente |
| Captura `OUTSTANDING_BALANCE` | Pendiente |
| Read-back y ledger | Pendiente |
| IA que explique el `reason_code` | Pendiente |
| Timeline Bryntum | Pendiente |
| Deploy + video | Pendiente |

## Readiness

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App esqueleto + mock | 15/30 |
| PayPal | 0/15 |
| IA | 0/10 |
| Demo/video | 0/15 |
| **Total** | **45/100** |

## Próximo paso

1. Mock PayPal con los 8 errores 422.
2. `/api/recover` con estado `AWAITING_APPROVAL`.
3. Captura mock + read-back + ledger.
4. Sustituir mock por sandbox.

## Enlaces

- [`web/README.md`](../web/README.md)
- [[49 Octava ronda - Spike ejecutable]]
- [[47 Sexta ronda - Errores tests y legal]]

---
title: Decimosexta ronda · API, clean build y submission
tags: [auditoria, api, build, submission]
updated: 2026-10-28
---

# Decimosexta ronda · API, clean build y submission

Tres iteraciones de verificación final.

## Iteración 1 — Matriz de errores de API

Con `APPROVER_TOKEN=secret` y `ALLOW_UNVERIFIED_WEBHOOKS=true`:

| Caso | HTTP |
|---|---:|
| recover sin body | 400 |
| recover suscripción inexistente | 404 |
| recover `SUB-1003` (WAIT) | 409 |
| recover `SUB-1004` (EXPIRED) | 409 |
| propuesta pendiente duplicada | 409 |
| approve sin token | 401 |
| approve propuesta inexistente | 404 |
| approve sin `proposalId` | 400 |
| approve válido | 200 |
| approve duplicado | 409 |
| explain sin body | 400 |
| explain suscripción inexistente | 404 |
| explain válido | 200 |
| webhook JSON inválido | 400 |
| webhook sin `id` | 400 |
| webhook válido | 200 |
| webhook duplicado | 200 |
| ledger / health / page | 200 |

**Resultado:** ningún 500. Todos los errores esperados están cubiertos.

## Iteración 2 — Clean build

```bash
cd web
rm -rf node_modules .next
npm ci
npm run build
npm run start -- -p 3100
```

- `npm ci`: 31 paquetes.
- Build de producción: OK.
- Runtime: health 200, page 200.
- `status: mock` sin credenciales.

Esto valida que el repo se puede construir desde cero, como hará el jurado.

## Iteración 3 — Submission

- Creado `SUBMISSION.md` con pitch, problema, solución, integración PayPal, IA, real vs mock y campos de Devpost.
- Creado `web/DEMO.md` con recorrido de 90 segundos.
- `THIRD_PARTY_NOTICES.md` con licencias.
- El draft **no se debe enviar** hasta tener video, URL hospedada y evidencia sandbox.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + mobile | 28/30 |
| PayPal client + webhook | 5/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + submission draft | 5/10 |
| **Readiness** | **78/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.
4. Bryntum real o aceptar timeline CSS.

## Enlaces

- [[56 Decimoquinta ronda - Dependencias a11y y movil]]
- [`SUBMISSION.md`](../SUBMISSION.md)
- [`web/DEMO.md`](../web/DEMO.md)

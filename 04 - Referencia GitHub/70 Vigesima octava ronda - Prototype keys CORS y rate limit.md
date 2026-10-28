---
title: Vigésima octava ronda · Prototype keys, CORS y rate limit
tags: [auditoria, seguridad, prototype, cors, rate-limit]
updated: 2026-10-28
---

# Vigésima octava ronda · Prototype keys, CORS y rate limit

Tres iteraciones de seguridad sobre el servidor actual.

## Iteración 1 — Prototype keys

**Hallazgo:** `proposals`, `recovered` y `seen` eran objetos planos. Claves como `__proto__` o `constructor` devolvían propiedades heredadas y rompían el flujo:

- `webhook id="__proto__"` se trataba como duplicado.
- `approve proposalId="__proto__"` devolvía 409 en vez de 404.

**Fix:** `Object.create(null)` para los tres stores.

Prueba:

```text
approve __proto__:   404
approve constructor: 404
recover __proto__:   404
webhook __proto__:   {"received":true}
webhook duplicate:   {"duplicate":true}
webhook constructor: {"received":true}
```

## Iteración 2 — CORS

Petición con `Origin: https://evil.example`:

```text
HTTP/1.1 200 OK
vary: ...
content-type: application/json
```

**No hay** `access-control-allow-origin`; el navegador bloquea el cross-origin. Correcto para un demo same-origin.

## Iteración 3 — Rate limit

100 requests a `/api/health`:

```text
100 200
```

**No hay rate limiting.** Aceptable para el demo local, pero un deploy público puede ser martillado. Recomendación: rate limit en Render/Vercel o un middleware por IP antes de publicar.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 4/5 |
| Demo + tests | 10/10 |
| **Readiness** | **88/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[69 Vigesima septima bis - Documentacion vs codigo]]
- [`web/lib/store.ts`](../web/lib/store.ts)
- [`web/app/api/webhooks/paypal/route.ts`](../web/app/api/webhooks/paypal/route.ts)

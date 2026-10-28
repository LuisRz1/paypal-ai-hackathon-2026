---
title: Trigésima ronda · Security headers
tags: [auditoria, seguridad, headers]
updated: 2026-10-28
---

# Trigésima ronda · Security headers

Tres iteraciones de hardening HTTP.

## Iteración 1 — Headers

`web/next.config.mjs`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Iteración 2 — X-Powered-By

`poweredByHeader: false`; el header `X-Powered-By: Next.js` ya no se envía.

## Iteración 3 — Verificación

```text
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Aplicado a página y `/api/health`. Build OK.

**No se añadió CSP**: Next usa scripts inline; una CSP mal configurada rompería la app. Queda como siguiente paso si se necesita.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + seguridad | 30/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 5/5 |
| Demo + tests | 10/10 |
| **Readiness** | **90/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[71 Vigesima novena ronda - Node 22 y dependencias]]
- [`web/next.config.mjs`](../web/next.config.mjs)
- [`web/DEMO.md`](../web/DEMO.md)

---
title: Vigésima novena ronda · Node 22 y dependencias
tags: [auditoria, node, dependencias, deploy]
updated: 2026-10-28
---

# Vigésima novena ronda · Node 22 y dependencias

Tres iteraciones de compatibilidad y deploy.

## Iteración 1 — Node 22

**Hallazgo:** `web/lib/paypal.ts` usa `Promise.withResolvers` (ES2024), pero `engines.node` decía `>=20.9`. Node 20 no garantiza esa API.

**Fix:**

- `web/package.json`: `"node": ">=22"`.
- `render.yaml`: `NODE_VERSION=22`.
- `web/README.md` y `web/DEMO.md`: requisito Node 22+.

## Iteración 2 — Dependencias

`npm outdated`:

| Paquete | Actual | Latest |
|---|---|---|
| next | 15.5.28 | 16.4.3 |
| typescript | 5.9.3 | 7.0.2 |
| @types/node | 22.20.5 | 26.6.5 |

**Decisión:** mantener Next 15 por el override de `postcss` y evitar un major sin necesidad. TypeScript 7 tampoco aporta al demo.

## Iteración 3 — Regresión

```text
build: OK
routes: 11
First Load JS: 105 kB
```

Sin cambios funcionales.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + teclado | 29/30 |
| PayPal client + outcomes | 9/15 |
| IA | 6/10 |
| Deploy readiness | 5/5 |
| Demo + tests | 10/10 |
| **Readiness** | **89/100** |

## Bloqueantes restantes

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video público.

## Enlaces

- [[70 Vigesima octava ronda - Prototype keys CORS y rate limit]]
- [`web/package.json`](../web/package.json)
- [`render.yaml`](../render.yaml)

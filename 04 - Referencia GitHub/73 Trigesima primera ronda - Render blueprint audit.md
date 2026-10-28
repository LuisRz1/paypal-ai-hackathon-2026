---
title: Trigésima primera ronda · Render blueprint audit
tags: [auditoria, render, deploy, blueprint]
updated: 2026-10-28
---

# Trigésima primera ronda · Render blueprint audit

Tres iteraciones de validación del deploy.

## Iteración 1 — YAML

`python yaml.safe_load('render.yaml')` parsea sin errores:

```yaml
services:
  - type: web
    name: recover
    runtime: node
    rootDir: web
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm run start -- -p $PORT
    healthCheckPath: /api/health
```

## Iteración 2 — Campos contra la spec

Revisado contra `https://render.com/docs/blueprint-spec`:

- `type: web`, `runtime: node`, `rootDir`, `plan`, `buildCommand`, `startCommand`, `healthCheckPath` y `envVars` son válidos.
- `sync: false` para secretos es correcto.
- `NODE_VERSION=22` es una env var, no un campo del schema.
- `healthCheckPath` apunta a un endpoint que responde 200.

## Iteración 3 — Validación automática

Intentado con `ajv-cli` y el schema oficial:

```text
schema is invalid
strict mode: missing type "object" ...
unknown format "uri"
```

El fallo es del schema/meta-validación de AJV, no de `render.yaml`. No se modificó el blueprint.

## Resultado

Sin cambios. El blueprint está listo para conectar la cuenta de Render.

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

## Enlaces

- [[72 Trigesima ronda - Security headers]]
- [`render.yaml`](../render.yaml)
- [`web/app/api/health/route.ts`](../web/app/api/health/route.ts)

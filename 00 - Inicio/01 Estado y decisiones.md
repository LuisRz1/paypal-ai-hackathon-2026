---
title: Estado y decisiones
tags: [estado, decisiones]
updated: 2026-10-28
---

# Estado y decisiones

## Snapshot

| Campo | Valor |
|---|---|
| Hackathon | PayPal AI Hackathon 2026 |
| Deadline | 12 nov 2026, 12:00 PT |
| Días restantes | 15 (al 28 oct) |
| Repo | `D:/SISTEMAS/PayPal-Hackathon` |
| Fase | Control plane mock implementado; blockers externos |
| Modelo | Recover Control Plane (pendiente captura real de sandbox) |
| Sponsor objetivo | Ninguno (foco Grand/Impactful) |
| Readiness | 90/100 (research 20, repo 10, app 30, PayPal 9, AI 6, deploy 5, demo 10) |
| Toolchain | Node 22.23, npm 10.9.8, Python 3.12.9, git 2.53 |
| Spike | 16/16 tests; estado y errores verificados |
| App | Mandate + simulation + recoveries + evidence; flujo mock verificado en navegador |
| Control plane | DSL versionado, 288 casos, capability HMAC single-use, passport Ed25519 |
| Explicador | 8 reason codes + timeline CSS, 6 tests |
| LLM opcional | OpenAI-compatible con fallback, 4 tests |
| Deploy | render.yaml listo, no desplegado |
| Seguridad | Approver token + dedupe + webhook 400 verificados |
| Calidad | 0 vulnerabilidades; axe 0 violaciones y móvil 390/390 en las 4 etapas |
| Retry | GET reintenta 429/5xx; capture/activate no reintentan 5xx |
| Tests | 43/43 control plane y explainers; 288 casos de estado, 0 violaciones |
| Outcomes | 5xx/timeout → PENDING_VERIFICATION; mock repetido → 409 |
| Sandbox runner | `web/scripts/sandbox-check.mjs` dry-run/execute/save listo |
| Runner tests | 5/5: dry run, execute, zero, unknown, live refusal |
| Seguridad | Auth antes de lookup; config PayPal parcial → 503; LLM timeout 8s |
| Timeouts | OAuth 8s; requests PayPal 10s |
| Carga | 20 recover/approve → 1 ganador; 50 webhooks → 1 evento; p95 approve 63 ms, webhook 101 ms |
| Docs | Esquema, arquitectura y submission alineados con el código actual |
| Hardening | Stores null-prototype; sin CORS cross-origin; sin rate limit (demo) |
| Runtime | Node 22+ (Promise.withResolvers); Render NODE_VERSION=22 |
| Headers | nosniff, DENY, referrer, permissions, HSTS; sin X-Powered-By |
| Render | YAML parsea; campos contra spec; sin cambios |
| Sponsor | Ninguno; sin tool integrada, no elegible para sponsor prizes |
| Submission | `SUBMISSION.md` draft + `web/DEMO.md`; screenshot listo, video/URL pendientes |
| Equipo | Pendiente de confirmar |
| Licencia prevista | MIT |
| Idioma de entrega | Inglés |

## Decisiones tomadas

| Fecha | Decisión | Motivo | Estado |
|---|---|---|---|
| 2026-10-28 | Compilar políticas y firmar evidencia | Hacer IA y PayPal visibles sin ceder autoridad al modelo | Implementada |
| 2026-10-27 | Usar solo PayPal sandbox | Regla del hackathon; sin riesgo real | Aceptada |
| 2026-10-27 | Un solo sponsor prize como objetivo | Regla: máximo 1 sponsor + 1 grand/honorable | Aceptada |
| 2026-10-27 | Documentar en inglés | Requisito de submission | Aceptada |
| 2026-10-27 | La IA no ejecuta dinero | Patrón dominante en los mejores repos | Aceptada |

## Decisiones pendientes

| Decisión | Opciones | Nota |
|---|---|---|
| LLM | OpenAI-compatible / self-hosted compatible | API compatible + fallback; proveedor real no configurado |
| Hosting | Render / Vercel / local | Render da créditos |
| Alcance MVP | 1 flujo end-to-end | Evitar 5 integraciones a medias |

## Preguntas abiertas

- ¿Hay cuenta PayPal Business para sandbox avanzado?
- ¿Qué identidad y almacenamiento de claves se usarán fuera del demo?
- ¿Habrá demo hospedada o solo instrucciones de ejecución?
- ¿Quién graba y edita el video?

## Plantilla de decisión

```markdown
### ADR-00X · Título
- Fecha:
- Contexto:
- Decisión:
- Alternativas:
- Consecuencias:
- Estado: propuesta | aceptada | rechazada
```

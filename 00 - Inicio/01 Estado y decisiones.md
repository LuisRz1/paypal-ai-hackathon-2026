---
title: Estado y decisiones
tags: [estado, decisiones]
updated: 2026-10-27
---

# Estado y decisiones

## Snapshot

| Campo | Valor |
|---|---|
| Hackathon | PayPal AI Hackathon 2026 |
| Deadline | 12 nov 2026, 12:00 PT |
| Días restantes | 15 (al 28 oct) |
| Repo | `D:/SISTEMAS/PayPal-Hackathon` |
| Fase | Freeze / blockers externos |
| Modelo | Recover (pendiente spike de sandbox) |
| Sponsor objetivo | Ninguno (foco Grand/Impactful) |
| Readiness | 87/100 (research 20, repo 10, app 29, PayPal 9, AI 6, deploy 4, demo 9) |
| Toolchain | Node 22.23, npm 10.9.8, Python 3.12.9, git 2.53 |
| Spike | 16/16 tests; estado y errores verificados |
| App | Approval + ledger + mock PayPal verificados en navegador |
| Explicador | 8 reason codes + timeline CSS, 6 tests |
| LLM opcional | OpenAI-compatible con fallback, 4 tests |
| Deploy | render.yaml listo, no desplegado |
| Seguridad | Approver token + dedupe + webhook 400 verificados |
| Calidad | 0 vulnerabilidades, 0 violaciones a11y, móvil 390/390 |
| Retry | GET reintenta 429/5xx; capture/activate no reintentan 5xx |
| Tests | 288 casos de estado, 0 violaciones; teclado y live regions verificados |
| Outcomes | 5xx/timeout → PENDING_VERIFICATION; mock repetido → 409 |
| Sandbox runner | `web/scripts/sandbox-check.mjs` dry-run/execute/save listo |
| Runner tests | 5/5: dry run, execute, zero, unknown, live refusal |
| Seguridad | Auth antes de lookup; config PayPal parcial → 503; LLM timeout 8s |
| Sponsor | Ninguno; sin tool integrada, no elegible para sponsor prizes |
| Submission | `SUBMISSION.md` draft + `web/DEMO.md`; screenshot listo, video/URL pendientes |
| Equipo | Pendiente de confirmar |
| Licencia prevista | MIT |
| Idioma de entrega | Inglés |

## Decisiones tomadas

| Fecha | Decisión | Motivo | Estado |
|---|---|---|---|
| 2026-10-27 | Usar solo PayPal sandbox | Regla del hackathon; sin riesgo real | Aceptada |
| 2026-10-27 | Un solo sponsor prize como objetivo | Regla: máximo 1 sponsor + 1 grand/honorable | Aceptada |
| 2026-10-27 | Documentar en inglés | Requisito de submission | Aceptada |
| 2026-10-27 | La IA no ejecuta dinero | Patrón dominante en los mejores repos | Aceptada |

## Decisiones pendientes

| Decisión | Opciones | Nota |
|---|---|---|
| Modelo de proyecto | A / B / C / D | [[60 Comparativa]] |
| Sponsor | AG Grid / Bryntum / Channel3 / otro | [[30 Mapa de sponsors]] |
| Stack | Next.js full-stack / FastAPI + Next | [[70 Stack y estructura]] |
| LLM | OpenAI / Gemini / OpenRouter / Ollama | API compatible + fallback |
| Hosting | Render / Vercel / local | Render da créditos |
| Alcance MVP | 1 flujo end-to-end | Evitar 5 integraciones a medias |

## Preguntas abiertas

- ¿El equipo domina React/frontend o backend Python?
- ¿Hay cuenta PayPal Business para sandbox avanzado?
- ¿Se puede solicitar acceso a Payouts con antelación?
- ¿Qué sponsor encaja mejor con la historia del producto?
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

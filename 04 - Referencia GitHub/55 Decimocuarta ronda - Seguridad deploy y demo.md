---
title: Decimocuarta ronda · Seguridad, deploy y demo
tags: [auditoria, seguridad, deploy, demo]
updated: 2026-10-28
---

# Decimocuarta ronda · Seguridad, deploy y demo

Tres iteraciones de revisión sobre el código actual, no sobre teoría.

## Iteración 1 — Auditoría de seguridad

Hallazgos y fixes:

| Hallazgo | Fix | Evidencia |
|---|---|---|
| `/api/approve` sin auth | `APPROVER_TOKEN` opcional; exige `Bearer` si está seteado | 401 sin token, 200 con token |
| Dos propuestas pendientes para la misma suscripción | Guard en `/api/recover` | Segunda llamada devuelve la misma propuesta con 409 |
| Webhook con JSON inválido | Try/catch → 400 | `{bad` → 400 |
| Store en memoria | Documentado; reset al reiniciar | `web/README.md` |
| Sin persistencia | Aceptable para demo; Postgres es el siguiente paso | — |

La app sigue siendo **sandbox/mock only**; el cliente rechaza hosts que no sean PayPal sandbox.

## Iteración 2 — Deploy readiness

- `engines.node >= 20.9` en `web/package.json`.
- `render.yaml` con `rootDir: web`, build, start y `healthCheckPath: /api/health`.
- `docker` no está instalado en la máquina; no se añadió Dockerfile no verificado.
- Build de producción: OK.
- `GET /api/health` responde `mock` sin credenciales.

## Iteración 3 — Demo y submission

- `web/DEMO.md`: recorrido de 90 segundos para jueces.
- `72 Guion del video` actualizado al flujo real: timeline → explicación → aprobación → captura → ledger.
- `THIRD_PARTY_NOTICES.md`: licencias y servicios externos.
- Se aclara que Bryntum/AG Grid/Channel3 **no** están incluidos todavía.

## Evidencia

```text
NO AUTH:        401
WITH AUTH:      { status: "VERIFIED", verified: true }
MALFORMED HOOK: 400
HEALTH:         "mock", paypalConfigured false, llmConfigured false
```

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + timeline + explainer | 25/30 |
| PayPal client + webhook | 5/15 |
| IA | 6/10 |
| Deploy readiness | 3/5 |
| Demo docs/video | 3/10 |
| **Readiness** | **72/100** |

## Riesgos restantes

1. **Sandbox real no probado**: faltan credenciales.
2. **Deploy no ejecutado**: blueprint listo, sin URL.
3. **Store en memoria**: se pierde al reiniciar.
4. **Bryntum no integrado**: timeline CSS, no sponsor real.
5. **Video no grabado**.

## Próximo paso

1. Cargar credenciales sandbox y ejecutar `capture` real.
2. Desplegar en Render.
3. Grabar el video.
4. Integrar Bryntum si queda tiempo.

## Enlaces

- [[54 Decimotercera ronda - LLM opcional y deploy]]
- [`web/DEMO.md`](../web/DEMO.md)
- [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md)

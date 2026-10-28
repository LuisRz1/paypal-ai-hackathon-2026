---
title: Decimotercera ronda · LLM opcional y deploy
tags: [auditoria, llm, health, deploy]
updated: 2026-10-28
---

# Decimotercera ronda · LLM opcional y deploy

Tres iteraciones: explicador con LLM opcional, health endpoint y blueprint de Render.

## Iteración 1 — LLM opcional

`web/lib/explain-llm.ts`:

- Sin `OPENAI_API_KEY`/`LLM_API_KEY`, usa el explicador determinista.
- Con key, llama a un endpoint OpenAI-compatible.
- Valida `recommendedAction` y `confidence`; si el modelo inventa un valor, cae al fallback.
- Si el JSON es inválido o hay timeout, cae al fallback.

4 tests:

```text
no key returns deterministic explanation
valid model answer is merged
invalid action falls back
bad JSON returns fallback
# pass 4 / fail 0
```

## Iteración 2 — Health endpoint

`GET /api/health`:

```json
{
  "status": "mock",
  "checks": {
    "paypalConfigured": false,
    "webhookConfigured": false,
    "allowUnverifiedWebhooks": false,
    "llmConfigured": false,
    "ledgerEvents": 0,
    "environment": "https://api-m.sandbox.paypal.com"
  }
}
```

Útil para jueces y para diagnosticar el deploy sin exponer secretos.

## Iteración 3 — Render blueprint

`render.yaml`:

- `rootDir: web`.
- `npm ci && npm run build`.
- `npm run start -- -p $PORT`.
- Secrets como `sync: false`.
- Default `ALLOW_UNVERIFIED_WEBHOOKS=false`.

No desplegado todavía; solo blueprint.

## Hallazgos

1. El LLM no es necesario para el demo; añade redacción, no decisiones.
2. El health endpoint detecta si faltan credenciales antes de que falle una captura.
3. El deploy necesita `PORT` explícito en `next start`.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + timeline + explainer | 25/30 |
| PayPal client + webhook | 5/15 |
| IA (determinista + LLM opcional) | 6/10 |
| Demo/video | 0/15 |
| **Readiness** | **66/100** |

## Próximo paso

1. Cargar credenciales sandbox y probar `capture` real.
2. Deploy en Render.
3. Bryntum o timeline CSS final.
4. Video y submission.

## Enlaces

- [[53 Duodecima ronda - Explicador y timeline]]
- [`web/README.md`](../web/README.md)
- [`render.yaml`](../render.yaml)

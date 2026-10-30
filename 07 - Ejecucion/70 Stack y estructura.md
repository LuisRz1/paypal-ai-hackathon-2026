---
title: Stack y estructura
tags: [ejecucion, stack, arquitectura]
updated: 2026-10-28
---

# Stack y estructura

## Stack implementado

| Capa | Elección actual | Nota |
|---|---|---|
| Runtime | Node.js 22+ | Crypto nativo y `Promise.withResolvers` |
| Framework | Next.js 15 App Router | API server-side |
| UI | React 19 + TypeScript estricto | Componentes cliente solo donde hay interacción |
| Estilos | CSS plano | `web/app/globals.css`; sin Tailwind |
| PayPal | REST + `fetch` | Sin SDK de servidor |
| IA | OpenAI-compatible JSON + fallback determinista | Compilador de políticas y explicador |
| Validación | Type guards escritos a mano | Sin Zod ni otra dependencia |
| Seguridad | HMAC-SHA256 y Ed25519 | `node:crypto` |
| Persistencia | `globalThis` en memoria | Solo demo |
| Deploy | `render.yaml` | Preparado, no desplegado |

## Estructura actual

```text
web/
  app/
    page.tsx                    Shell de cuatro etapas
    policy-studio.tsx           Mandato y simulación
    recovery-workspace.tsx      Portfolio, caso y aprobación
    evidence-panel.tsx          Recibo y verificación
    timeline.tsx                Timeline CSS
    globals.css                 Sistema visual responsive
    api/
      policies/
        compile/route.ts
        simulate/route.ts
        activate/route.ts
        active/route.ts
      recover/route.ts
      approve/route.ts
      evidence/
        [proposalId]/route.ts
        verify/route.ts
      explain/route.ts
      seed/route.ts
      health/route.ts
      ledger/route.ts
      webhooks/paypal/route.ts
  lib/
    state-machine.ts            Reglas PayPal deterministas
    policy.ts                   DSL y evaluación segura
    policy-compiler.ts          Intención a política
    simulation.ts               Matriz de 288 casos
    policy-store.ts             Versión activa
    capability.ts               Aprobación single-use
    evidence.ts                 Ledger y firma Ed25519
    recovery-passport.ts        Ensamblaje de evidencia
    integrity.ts                JSON canónico y SHA-256
    store.ts                    Estado en memoria
    paypal.ts                   Cliente sandbox
    paypal-mock.ts              Provider mock
    explain.ts                  Explicador determinista
    explain-llm.ts              LLM opcional
  scripts/
    sandbox-check.mjs
    state-matrix.mjs
    paypal-smoke.mjs
    load-check.mjs
    verify-evidence.mjs
  CONTROL_PLANE.md              Arquitectura, APIs, UX y trust model
  DEMO.md                       Flujo guiado
```

## Variables de entorno

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=
ALLOW_UNVERIFIED_WEBHOOKS=false
APPROVER_TOKEN=

OPENAI_API_KEY=
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

El secret HMAC y el par Ed25519 se generan por proceso; no hay variables que configurar en el demo. Una versión durable necesitaría KMS/secret management y directorio de claves públicas.

## Scripts

| Comando | Uso |
|---|---|
| `npm --prefix web run build` | Build de producción |
| `npx tsx --test web/lib/*.test.mjs` | Contratos de librería; también se enumeran en `AGENTS.md` |
| `node --test spike/state_machine.test.mjs` | Spike de estados |
| `node --experimental-strip-types web/scripts/state-matrix.mjs` | Matriz base de 288 casos |
| `node --experimental-strip-types web/scripts/paypal-smoke.mjs` | Cliente PayPal con servidor falso |
| `node --test web/scripts/sandbox-check.test.mjs` | Runner sandbox |
| `node web/scripts/load-check.mjs` | Concurrencia; requiere servidor fresco |
| `npx tsx web/scripts/verify-evidence.mjs <passport.json>` | Verificación independiente |

## Reglas de código

- Secretos y escrituras solo en servidor.
- Importes como strings decimales en capability y evidencia.
- Validación estricta en cada boundary JSON.
- `PayPal-Request-Id` estable por propuesta.
- No retry ciego en captura/activación.
- Ledger en orden de inserción y con hash chain.
- No claims de sandbox sin evidencia ejecutada.

## Verificación actual

- Policy/simulation/capability/evidence/explainers: **43/43**.
- Spike: **16/16**; runner: **5/5**.
- Matriz base: **288/288**, cero violaciones.
- Navegador: mandato → simulación → aprobación → evidencia.
- axe: **0 violaciones** en las cuatro etapas.
- Móvil: **390/390** sin overflow en las cuatro etapas.
- Carga: **1** propuesta y **1** aprobación ganadoras; **1** evento en 50 webhooks.

## Pendientes

- Captura sandbox real y evidencia.
- Persistencia durable, identidad y KMS.
- Reconciliación de `PENDING_VERIFICATION`.
- Deploy y video.

## Enlaces

- [[74 Recover Control Plane]]
- [[73 Esquema de datos]]
- [[72 Guion del video]]

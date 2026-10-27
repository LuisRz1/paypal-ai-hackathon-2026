---
title: Stack y estructura
tags: [ejecucion, stack, arquitectura]
updated: 2026-10-27
---

# Stack y estructura

## Stack recomendado

| Capa | Elección | Alternativa |
|---|---|---|
| Framework | Next.js 15 + TypeScript | FastAPI + Next |
| UI | Tailwind + componentes propios | shadcn/ui |
| DB | Postgres (Neon) | SQLite para local |
| ORM | Drizzle | Prisma |
| Validación | Zod | Pydantic si Python |
| PayPal | REST con `fetch` + SDK v6 | `@paypal/paypal-server-sdk` |
| IA | Vercel AI SDK / OpenAI SDK | OpenRouter, Gemini, Ollama |
| Dashboard | AG Studio (modelo A) | Bryntum (modelo B) |
| Deploy | Render | Vercel |

## Estructura de repo

```text
app/
  page.tsx
  dashboard/
  api/
    paypal/
      orders/route.ts
      capture/route.ts
      refunds/route.ts
      invoices/route.ts
      payouts/route.ts
    webhooks/paypal/route.ts
    agent/route.ts
    approvals/route.ts
lib/
  paypal/
    client.ts
    orders.ts
    invoices.ts
    subscriptions.ts
    disputes.ts
    payouts.ts
  policy/
    engine.ts
    rules.ts
  agent/
    prompt.ts
    tools.ts
    provider.ts
  verify/
    paypal.ts
  audit/
    ledger.ts
  db/
    schema.ts
    queries.ts
components/
  checkout/
  dashboard/
  evidence/
docs/
  evidence/
scripts/
  register-webhook.ts
  seed-demo.ts
tests/
  policy.test.ts
  verify.test.ts
  webhook.test.ts
```

## Variables de entorno

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=

OPENAI_API_KEY=
# o OPENROUTER_API_KEY / GEMINI_API_KEY
LLM_MODEL=

AG_STUDIO_LICENSE_KEY=
NEXT_PUBLIC_AG_STUDIO_LICENSE_KEY=

CRON_SECRET=
```

## Scripts

| Script | Uso |
|---|---|
| `dev` | Desarrollo |
| `build` | Build de producción |
| `seed` | Datos de demo |
| `webhook:register` | Registrar webhook en sandbox |
| `test` | Tests unitarios |
| `test:e2e` | Flujo sandbox |
| `lint` | ESLint/Prettier |

## Reglas de código

- Server-only para secretos.
- Montos como string decimal, no float.
- Validar toda entrada con Zod.
- Idempotencia en POST.
- Errores de PayPal mapeados a mensajes de usuario.
- `debug_id` en logs.

## Testing

1. Unit: policy, montos, estados, dedupe.
2. Integration: PayPal fake server.
3. Smoke: una orden real en sandbox.
4. Manual: flujo completo con dos cuentas sandbox.

## Deploy

- Render Web Service + Postgres.
- Variables en el dashboard, nunca en el repo.
- Cron job para reconciliación.
- Keepalive si el plan es free.

## Enlaces

- [[50 Arquitectura canonica]]
- [[73 Esquema de datos]]
- [[71 Backlog 16 dias]]

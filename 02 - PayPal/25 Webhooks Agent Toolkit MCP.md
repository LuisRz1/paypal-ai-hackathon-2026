---
title: Webhooks, Agent Toolkit y MCP
tags: [paypal, webhooks, agent-toolkit, mcp, ai]
source: https://developer.paypal.com/api/rest/webhooks/
updated: 2026-10-27
---

# Webhooks, Agent Toolkit y MCP

## Webhooks

- PayPal hace `POST` HTTPS a tu endpoint cuando ocurre un evento.
- Hasta **10 URLs por app**.
- Suscripción por evento específico o `*`.
- Solo recibes eventos de **esa app**.
- Debes responder **2xx**; si no, reintenta hasta **25 veces en 3 días**.
- Verifica autenticidad por firma/CRC32 o llamando al endpoint de verificación.
- Deduplica por `id` de evento y guarda el payload.

Casos típicos:

- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `INVOICING.INVOICE.PAID`
- `CUSTOMER.DISPUTE.CREATED`

## PayPal Agent Toolkit

Paquete: `@paypal/agent-toolkit` (TypeScript y Python).

Adaptadores:

- Vercel AI SDK
- OpenAI
- LangChain
- AWS Bedrock
- MCP
- CrewAI (Python)

Herramientas incluidas:

| Área | Tools |
|---|---|
| Invoices | create, list, get, send, send_reminder, cancel, QR, delete, search, update, record_payment, record_refund, recurring series |
| Payments | create_order, get_order, pay_order, create_refund, get_refund |
| Disputes | list_disputes, get_dispute, accept_dispute_claim |
| Shipments | create, get, update |
| Catalog | create_product, list_products, show_product_details |
| Subscriptions | create/list/show plan, create/show/update/cancel subscription |
| Reporting | list_transactions, get_merchant_insights |

Configuración sandbox:

```ts
import { PayPalAgentToolkit } from "@paypal/agent-toolkit/ai-sdk";

const toolkit = new PayPalAgentToolkit({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  configuration: {
    context: { sandbox: true },
    actions: { orders: { create: true, get: true } }
  }
});
```

> **Gotcha:** el toolkit **no incluye Payouts**. Para pagos salientes usa REST directo.

## MCP server

```bash
npx -y @paypal/mcp --tools=all \
  PAYPAL_ACCESS_TOKEN="..." \
  PAYPAL_ENVIRONMENT="SANDBOX"
```

| Entorno | SSE | Streamable HTTP |
|---|---|---|
| Sandbox | `https://mcp.sandbox.paypal.com/sse` | `https://mcp.sandbox.paypal.com/http` |
| Producción | `https://mcp.paypal.com/sse` | `https://mcp.paypal.com/http` |

- Mismas tools que el Agent Toolkit; tampoco incluye payouts.
- Útil para Claude Desktop, Cursor, Cline, Copilot.
- El token de sandbox dura 3–8 h; el de producción ~8 h.

## PayPal AI Toolkit (para desarrollo)

Repo: `paypal/AI-Toolkit`.

- Skills de mejores prácticas (`checkout`, `js-sdk-v6`, `subscriptions`, `invoicing`, `payouts`, `disputes-refunds`, `webhooks`, `agentic-commerce`).
- Comandos `/paypal:doctor`, `/paypal:explain-error`, `/paypal:sandbox`, `/paypal:setup`.
- Hook que obliga al agente a consultar las reglas antes de editar código PayPal.
- Integración MCP sandbox.
- Instalación en Claude Code, Codex y Cursor.

## Enlaces

- [[20 Autenticacion y sandbox]]
- [[51 Patrones de confianza]]
- Webhooks: https://developer.paypal.com/api/rest/webhooks/
- Agent Toolkit: https://github.com/paypal/agent-toolkit
- MCP: https://github.com/paypal/paypal-mcp-server
- AI Toolkit: https://github.com/paypal/AI-Toolkit

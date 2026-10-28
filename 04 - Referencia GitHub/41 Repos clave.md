---
title: Repos clave
tags: [github, repos, referencias]
updated: 2026-10-27
---

# Repos clave

Estrellas al 27 oct 2026; no son señal de calidad, solo de atención.

## Base oficial

| Repo | Qué es | Qué copiar |
|---|---|---|
| [`paypaldev/hackathon-paypal-ag-grid-boilerplate`](https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate) | Next.js + AG Studio + PayPal REST | `lib/paypal.ts`, endpoint pages, `app/dashboard/studio/*`, proxy IA |
| [`paypal-examples/v6-web-sdk-sample-integration`](https://github.com/paypal-examples/v6-web-sdk-sample-integration) | Ejemplos del SDK v6 (148★) | Botones, Venmo, Pay Later, card fields, Fastlane |
| [`paypaldev/getting-started-with-paypal-sandbox`](https://github.com/paypaldev/getting-started-with-paypal-sandbox) | Guía de sandbox (28★) | Setup de cuentas, negative testing, test cards |

## Herramientas PayPal

| Repo | Qué es | Qué copiar |
|---|---|---|
| [`paypal/AI-Toolkit`](https://github.com/paypal/AI-Toolkit) | Plugin para Claude/Codex/Cursor (35★) | Skills, comandos, hooks, MCP sandbox |
| [`paypal/agent-toolkit`](https://github.com/paypal/agent-toolkit) | Function calling PayPal (197★) | Tools de invoices, orders, refunds, disputes, subs |
| [`paypal/paypal-mcp-server`](https://github.com/paypal/paypal-mcp-server) | MCP server (13★) | `npx @paypal/mcp --tools=all` |

## Proyectos del hackathon

| Repo | Arquetipo | Qué copiar | Estado |
|---|---|---|---|
| [`ezekiellemana/sarafupay-ai`](https://github.com/ezekiellemana/sarafupay-ai) | WhatsApp + cobros grupales | Idempotencia, cron de reconciliación, `CONFIRM` fuera del LLM, AG Studio custom widget, fallback de modelos | Muy completo |
| [`ssaglin19/agent-commerce-sandbox`](https://github.com/ssaglin19/agent-commerce-sandbox) | Negociación multiagente | AUTHORIZE → capture/void, payouts, dedupe de webhooks, tests | Funcional |
| [`ma-za-kpe/stood`](https://github.com/ma-za-kpe/stood) | Evidence-gated release | “Rules move money”; modelo sin credenciales; guías AG Studio/Bryntum/KERNEL/APIMatic | Muy completo |
| [`rodriguescarson/refundly`](https://github.com/rodriguescarson/refundly) | Refunds verificados | Read-back del ledger, silent-failure rate, policy gate | Verificado en sandbox |
| [`qinheyi/dispute-steward`](https://github.com/qinheyi/dispute-steward) | Disputas + facturas | Policy engine, ledger hash-chained, mock mode | Completo |
| [`Sarcastic-Soul/milestone`](https://github.com/Sarcastic-Soul/milestone) | Gantt que sigue al dinero | Bryntum + Invoicing + webhooks + aprobaciones | Completo |
| [`Eman2123/Shelf-Ready`](https://github.com/Eman2123/Shelf-Ready) | Storefront agent-ready | Auditoría de catálogo, MCP, policy, checkout | En construcción |
| [`Jeremiah-Sakuda/harambee`](https://github.com/Jeremiah-Sakuda/harambee) | Pagos grupales | Authorizations por persona, consentimiento versionado, `docs/evidence` | Muy completo |
| [`jamesparser/paypal-commerce-mcp`](https://github.com/jamesparser/paypal-commerce-mcp) | x402 + PayPal + AG Grid | MCP propio, ledger de procedencia | Ambitious |
| [`arindewangan/invoicepilot`](https://github.com/arindewangan/invoicepilot) | Invoicing NL | Agent trace, showcase mode sin credenciales | Simple y completo |
| [`manishwvn/rebuttal`](https://github.com/manishwvn/rebuttal) | Disputas / prevención | LangGraph, un solo write path, cliente read-only, guard determinista, 1,000+ tests, AG Studio | Reference grade |
| [`OmkarD09/Docket`](https://github.com/OmkarD09/Docket) | Disputas / evidencia | Barrera de rechazo determinista, AG Grid, disputa live en sandbox | Reference grade |
| [`Jasonsu22/firstreply`](https://github.com/Jasonsu22/firstreply) | Disputas / prevención | Trust tiers, policy engine, evidence PDF, eval 22/22 | Reference grade |
| [`jlhpacheco/solvia`](https://github.com/jlhpacheco/solvia) | Parking permits | Orders + AG Grid + 132 browser checks + capture live | Niche pero muy completo |
| [`sujith-kamme/keel`](https://github.com/sujith-kamme/keel) | Agent commerce guard | Guard, reviews, sessions, 55 tests | Prometedor |
| [`koztechie/paypal-recon-agent`](https://github.com/koztechie/paypal-recon-agent) | Reconciliación cross-border | Invoices, reminders, event journal, evidencia por etapa | En desarrollo |

## Patrones por repo

| Patrón | Mejor ejemplo |
|---|---|
| Verificación contra PayPal | Refundly |
| Policy engine + aprobación | DisputeSteward, Stood |
| Idempotencia + reconciliación | SarafuPay |
| Authorizations y reembolsos | Harambee, Haggle Court |
| AG Studio + agente | SarafuPay, OmegaCommerce |
| Bryntum + pagos | Milestone, Stood |
| Channel3/MCP shopping | Shelf-Ready |
| Evidencia y transparencia | Stood, Refundly, Harambee |

## Enlaces

- [[40 Landscape]]
- [[50 Arquitectura canonica]]

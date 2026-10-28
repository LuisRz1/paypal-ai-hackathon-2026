---
title: Auditoría en 3 iteraciones
tags: [github, auditoria, diferenciadores, estrategia]
updated: 2026-10-28
---

# Auditoría en 3 iteraciones

> Ronda 2 y red team: [[43 Red team - Renewal Radar]].

Ventana: ~30 min. Tres pasadas con método distinto sobre 100 repos que mencionan el hackathon (310 en total en GitHub) y lectura profunda de los 15 más serios.

## Iteración 1 — Nivel de ingeniería

Método: GitHub API, top 30 por tamaño, conteo de archivos, tests, workflows CI y docs. Los “tests” son archivos, no casos; algunos README declaran más (Rebuttal 1,000+, Harambee 185, PayPilot 56).

| Repo | KB | Files | Test files | CI | Docs | Live sandbox |
|---|---:|---:|---:|---:|---:|---|
| `ma-za-kpe/stood` | 6,184 | 1,129 | 322 | 9 | 203 | Sí |
| `manishwvn/rebuttal` | 4,474 | 481 | 82 | 5 | 222 | Sí |
| `OmkarD09/Docket` | 10,822 | 515 | 5 | 0 | 421 | Sí (disputa) |
| `jlhpacheco/solvia` | 24,018 | 414 | 80 | 0 | 54 | Sí (capture) |
| `sujith-kamme/keel` | 929 | 283 | 55 | 1 | 1 | No visible |
| `koztechie/paypal-recon-agent` | 595 | 82 | 2 | 1 | 36 | Parcial |
| `Jeremiah-Sakuda/harambee` | 6,980 | 141 | 13 | 1 | 19 | Sí |
| `KomatikAI/rummage` | 657 | 294 | 77 | 0 | 13 | No hosted |
| `rodriguescarson/refundly` | 24,845 | 261 | 31 | 2 | 9 | Sí |
| `nolankido/canonKeeper` | 21,510 | 179 | 34 | 2 | 14 | Sí |
| `ezekiellemana/sarafupay-ai` | 690 | 86 | 1 | 0 | 7 | Sí |
| `atleekumaar/paypilot` | 216 | 90 | 7 | 0 | 4 | No |
| `midas-png/paypal-agent-firewall` | 141 | 63 | 10 | 0 | 2 | No |
| `Sarcastic-Soul/milestone` | 151 | 67 | 2 | 0 | 5 | No |
| `paypaldev/hackathon-paypal-ag-grid-boilerplate` | 319 | 55 | 0 | 0 | 3 | N/A |

**Lectura:** el listón real está en 5–6 repos. `Stood`, `Rebuttal`, `Docket`, `Solvia`, `Refundly` y `Rummage` tienen ingeniería de producto, no scaffold. La mayoría de los 100 no tiene CI ni tests.

## Iteración 2 — Producto y saturación

Menciones en las descripciones de los 100 repos (señal conservadora; los READMEs mencionan más):

| Capacidad | Repos/100 |
|---|---:|
| Agente / autonomía | 39 |
| Sandbox | 12 |
| Shopping / catálogo | 12 |
| Verificación / reconciliación | 7 |
| Budget / spend cap | 7 |
| Disputas / chargeback | 6 |
| Invoicing / billing | 6 |
| Policy / guardrail | 4 |
| Evidencia / provenance | 4 |
| Aprobación humana | 3 |
| Payouts | 3 |
| MCP | 3 |
| **Subscriptions / dunning** | **0** |
| **Post-purchase / tracking** | **0** |
| **AG Grid / AG Studio** | **0** |
| Bryntum / Gantt | 1 |
| Channel3 | 1 |
| Split / multi-seller | 1 |
| Multi-agent / negociación | 1 |

A nivel README, los clusters reales:

- **Disputas/evidencia (saturado y de altísimo nivel):** Rebuttal, Docket, FirstReply, DisputeSteward, Refundly, Dispute Autopilot. Rebuttal tiene 1,000+ tests, LangGraph, un solo write path, cliente read-only, guard determinista y AG Studio. Docket tiene barrera de rechazo determinista y evidencia live. FirstReply tiene trust tiers y 22/22 eval.
- **AG Grid usado, pero no “auto-built”:** Rebuttal, Docket, Solvia, CanonKeeper, SarafuPay, OmegaCommerce. Casi todos lo usan como grid/dashboard; pocos tienen un agente que **construya o edite** widgets.
- **Shopping agents (saturado):** PayPilot, Rummage, Shelf-Ready, Scam Shield, Doorway, ProcurePilot…
- **Payouts/reconciliación (poco):** Recon Agent, Milestone, SarafuPay.
- **Subscriptions/dunning: prácticamente vacío.** No hay un repo top que lo trabaje.
- **Split checkout: solo Rummage.** Muy diferenciable, pero complejo (multi-seller, Payouts/multiparty).
- **Budget keys: CanonKeeper y Agent Firewall.** Raro y potente.
- **Prueba formal: solo Agent Firewall (Z3).** Diferenciador fuerte, pero ya está hecho.

## Iteración 3 — Viabilidad y elección

Escala 1–5. Ponderación: novedad 20%, valor jurado 20%, viabilidad 16 días 30%, riesgo 15%, demo 15%.

| Diferenciador | Novedad | Valor | Viabilidad | Riesgo | Demo | Total |
|---|---:|---:|---:|---:|---:|---:|
| **Subscription revenue recovery (dunning)** | 5 | 5 | 4 | 3 | 5 | **4.40** |
| **Anomaly-to-dashboard (AG Studio)** | 4 | 5 | 4 | 4 | 4 | **4.20** |
| **Agent budget keys / pay-per-job** | 5 | 4 | 4 | 4 | 4 | **4.20** |
| Multi-seller split checkout | 4 | 4 | 2 | 3 | 5 | **3.45** |
| Formal verification (Z3) | 5 | 4 | 2 | 3 | 4 | **3.45** |
| Dispute autopilot | 2 | 4 | 5 | 5 | 5 | **4.05** |

> El dispute autopilot puntúa alto en viabilidad, pero está saturado: Rebuttal/Docket/FirstReply ya lo hacen mejor de lo que podemos igualar en 16 días.

## Recomendación

### Primaria: “Renewal Radar” — recuperación de ingresos recurrentes

Un **Scheduler/Gantt (Bryntum)** con una fila por cliente, periodos de billing, renovaciones esperadas, pagos fallidos y riesgo de churn. El agente diagnostica el fallo y propone:
- reintentar con otro método,
- cambiar de plan,
- pausar,
- emitir una factura por el saldo,
- o escalar a humano.

Cada acción pasa por policy + aprobación + verificación del ledger. El timeline se actualiza al recuperar el pago.

**Por qué:**
- 0/100 descripciones tocan subscriptions/dunning.
- Bryntum solo aparece en 1/100: poca competencia y 3 premios de $1k.
- PayPal Subscriptions + Invoicing + Webhooks están infrautilizados.
- Métrica clara: MRR recuperado.
- Demo de 90 s: timeline → pago fallido → diagnóstico → aprobación → recuperación → timeline actualizado.

**Riesgo principal:** disparar un fallo de renovación real en sandbox es difícil. Mitigación: usar Invoicing (factura vencida) para el demo y Subscriptions para la profundidad, con modo simulación etiquetado. Verificar antes si PayPal permite forzar el fallo o si hay que sembrar el estado.

### Secundaria: “Merchant Signal” — anomalías → dashboard AG Studio

Si se prioriza el sponsor: ingerir webhooks/transactions, detectar picos de refunds, pagos fallidos o disputas, y que el agente **construya/edite** widgets en AG Studio. AG Grid tiene 5 premios y el jurado pide pulido + Agent Framework. Menos novedoso que Renewal Radar, pero más fácil de demostrar con el boilerplate.

### Tercera: “Budget Keys” — presupuestos para agentes

Copiar el patrón de CanonKeeper (budget con caps, aprobación, refund de sobrante) y aplicarlo a un marketplace de agentes. Muy novedoso, pero ya existe una implementación de referencia.

## Diferenciador transversal

**Proof-carrying actions:** cada acción incluye
1. la decisión de policy,
2. el read-back de PayPal,
3. el hash en el ledger.

La UI tiene un botón “Verify” que reconstruye la cadena. Es barato de implementar y eleva cualquier modelo por encima de “otro agente con botones”.

## Próximo paso

1. Elegir entre Renewal Radar y Merchant Signal.
2. Spike de 2 horas: ¿se puede simular un fallo de renovación en sandbox?
3. Si no: pivotar el demo a facturas vencidas (Invoicing) sin cambiar la tesis.
4. Congelar alcance MVP y empezar [[71 Backlog 16 dias]].

## Enlaces

- [[40 Landscape]]
- [[41 Repos clave]]
- [[60 Comparativa]]
- [[62 Modelo B Scheduler]]

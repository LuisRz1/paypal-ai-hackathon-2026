---
title: Guion del video
tags: [ejecucion, video, demo]
updated: 2026-10-28
---

# Guion del video · Recover Control Plane

Duración objetivo: **2:45**. Límite: 3:00. **Pendiente de grabar.**

## Guion

| Tiempo | Visual | Voz / texto |
|---|---|---|
| 0:00–0:20 | Suscripción suspendida y saldo en Recoveries | “PayPal retries a failed renewal. When retries stop, the merchant still has a suspended subscription and an outstanding balance. Recover handles that state without giving AI unchecked authority.” |
| 0:20–0:45 | Mandate + Compile | “The merchant writes the recovery mandate. AI compiles it into a constrained policy. Without an LLM key, Recover says Deterministic instead of pretending a model ran.” |
| 0:45–1:10 | Run 288 checks + invariants | “Before activation, Recover attacks the policy with 288 combinations of status, balance, failures, thresholds and currencies. The goal is not a happy path; it is proof that unsafe actions stay blocked.” |
| 1:10–1:30 | Checkbox + Sign and activate | “The human reviews and signs this exact policy version. The server repeats the simulation. Browser claims are not trusted.” |
| 1:30–1:50 | `SUB-1002` + explicación | “This suspended subscription has a 49 dollar outstanding balance. Recover explains the failure and prepares a proposal under the signed policy hash.” |
| 1:50–2:10 | Approval mandate + checkbox | “Approval is explicit and exact. It creates a single-use capability bound to subscription, amount, currency, policy and request ID. The AI cannot press this button.” |
| 2:10–2:30 | Evidence + Verify integrity | “The receipt records capture and read-back. The passport includes the policy, approval, PayPal outcome and complete hash-chained ledger, signed with Ed25519. All six integrity checks pass.” |
| 2:30–2:45 | Download JSON + cierre | “AI investigates. Code decides. A human approves. PayPal verifies. Recover returns proof, not just a success label.” |

## Si se graba sin credenciales

Decir explícitamente: **“This run uses the mock provider.”** La pantalla debe mostrar `Mock environment` y `Verified by mock read-back`. No cortar esos badges ni presentar el capture ID como evidencia real de PayPal.

Con credenciales sandbox, utilizar primero `web/scripts/sandbox-check.mjs --execute --save` y guardar la evidencia generada. No afirmar que esa captura existe hasta haberla ejecutado.

## Checklist de grabación

- [ ] 1080p o superior.
- [ ] Escritorio limpio, sin notificaciones ni secretos.
- [ ] Servidor fresco y datos seed cargados.
- [ ] Timeline de cuatro filas visible en Recoveries.
- [ ] 288/288 y las seis invariantes visibles.
- [ ] Checkbox de activación y de captura visibles antes del click.
- [ ] Estado mock/sandbox legible durante toda la ejecución.
- [ ] Seis checks de integridad visibles.
- [ ] Audio claro y subtítulos en inglés.
- [ ] Una toma principal + inserts de simulación y evidencia.

## Edición

- Cortes secos, sin música con copyright.
- Mostrar `policyHash`, `requestId` y `capabilityHash` con zoom, sin exponer secretos.
- No enseñar código ni empezar por arquitectura.
- No superar 3:00.
- Exportar MP4 H.264.

## YouTube

- Título: `Recover Control Plane — PayPal AI Hackathon 2026`.
- Descripción: problema, policy compiler, PayPal Subscriptions, human approval, evidencia y repo.
- Visibilidad: **público**.
- Miniatura legible con “AI proposes. Human approves. PayPal verifies.”

## Enlaces

- [[74 Recover Control Plane]]
- [[52 Demo y entrega]]
- [[12 Checklist de entrega]]

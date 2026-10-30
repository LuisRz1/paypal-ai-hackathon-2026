---
title: Recover Control Plane
tags: [recover, arquitectura, policy, evidence, ux]
updated: 2026-10-28
---

# Recover Control Plane

## Decisión

Evolucionar Recover de un flujo de captura a un **control plane de recuperación PayPal**: la intención del merchant se compila a una política, se simula antes de activarse, la aprobación queda ligada a una operación exacta y el resultado produce evidencia verificable.

La frontera de autoridad no cambia: **la IA propone; el código decide; el humano aprueba; PayPal verifica**.

## Arquitectura implementada

```text
Mandato
  → compilador LLM opcional o determinista
  → validación estricta del DSL
  → simulación de 288 casos
  → firma y activación de una versión
  → propuesta con policyHash
  → confirmación humana
  → capability HMAC de un solo uso
  → captura mock o sandbox
  → read-back
  → passport Ed25519 + ledger hash-chain
```

Contratos y diseño completo: `web/CONTROL_PLANE.md`.

## Componentes

| Pieza | Responsabilidad |
|---|---|
| `policy.ts` | DSL, validación y precedencia de seguridad |
| `policy-compiler.ts` | Intención a política; fallback explícito |
| `simulation.ts` | 288 casos e invariantes |
| `capability.ts` | Autorización exacta, expiración y replay protection |
| `evidence.ts` | Ledger encadenado y passports Ed25519 |
| `recovery-passport.ts` | Snapshots redactados y ensamblaje de evidencia |
| `policy-studio.tsx` | Mandato, simulación y activación |
| `recovery-workspace.tsx` | Casos, explicación y aprobación |
| `evidence-panel.tsx` | Recibo, verificación y descarga |

## APIs nuevas

- `GET /api/policies/active`
- `POST /api/policies/compile`
- `POST /api/policies/simulate`
- `POST /api/policies/activate`
- `GET /api/evidence/{proposalId}`
- `POST /api/evidence/verify`

`/api/approve` exige ahora `confirmed: true` y `approvedBy`, y sigue siendo la única ruta de captura.

## UX

Cuatro espacios separados por decisión:

1. **Mandate**: intención y guardrails.
2. **Simulation**: invariantes, reglas ordenadas, escenarios y firma.
3. **Recoveries**: portfolio, timeline, caso y mandato de captura.
4. **Evidence**: antes/después, hashes, ledger y verificación.

Referencias:

- LaunchDarkly: reglas ordenadas y revisión explícita.
- Temporal: metadata, historial, JSON y descarga.
- Stripe: configuración de recuperación por políticas.
- GitHub Actions: revisión humana antes de una operación con consecuencias.

La interfaz usa controles nativos, landmarks con nombre, foco visible, texto distinto para mock/sandbox y navegación con scroll interno en móvil.

## Límites honestos

- Capturas sin credenciales: **mock**, incluido el read-back.
- Sandbox real: **no ejecutado**.
- Stores, secret HMAC y par Ed25519: proceso local; se pierden al reiniciar.
- El passport incluye el ledger completo para conservar la cadena; es evidencia de merchant, no recibo público.
- El nombre del aprobador es un display name, no identidad autenticada.
- No hay worker de reconciliación para `PENDING_VERIFICATION`.
- Deploy y video siguen pendientes.

## Verificación inicial

- 43/43 tests de policy, simulación, capabilities, evidencia y explainers.
- Matriz histórica: 288/288, 0 violaciones.
- Spike: 16/16; runner sandbox: 5/5; PayPal smoke: OK.
- Smoke API: activación, propuesta, captura mock verificada, replay 409 y tamper detection.
- Navegador: flujo completo y seis checks de integridad.
- Móvil: overflow de navegación corregido y vuelto a medir a 390 px.

La verificación final quedó registrada así:

- Build de producción: OK, 16 páginas generadas.
- axe: 0 violaciones en mandato, simulación, recoveries/aprobación y evidencia.
- Móvil: 390/390 sin overflow en las cuatro etapas.
- Carga: 1 propuesta y 1 aprobación ganadoras; 1 evento en 50 webhooks.
- Screenshot actualizado: `web/public/demo.png`.

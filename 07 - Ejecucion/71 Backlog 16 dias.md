---
title: Backlog 16 días
tags: [ejecucion, backlog, plan]
updated: 2026-10-27
---

# Backlog 16 días

Del 27 oct al 12 nov 2026. Deadline: **12 nov, 12:00 PT**.

## Fases

| Fecha | Foco | Entregable |
|---|---|---|
| 27–28 oct | Decidir modelo y esqueleto | Repo, auth PayPal, orden creada y capturada |
| 29–31 oct | Dinero y confianza | Webhook, ledger, policy, aprobación, read-back |
| 1–3 nov | Agente | Tools, prompt, propuesta tipada, UI de chat |
| 4–6 nov | Superficie y sponsor | Dashboard AG Studio o Gantt Bryntum o storefront Channel3 |
| 7–8 nov | Robustez | Fallos, reconciliación, modo mock, tests |
| 9 nov | Freeze | README, deploy, evidencia, checklist |
| 10 nov | Video | Grabar y editar <3 min |
| 11 nov | Submission | Descripción, tools, links, envío temprano |
| 12 nov | Buffer | Solo correcciones; deadline 12:00 PT |

## Día a día

### 27 oct
- [ ] Elegir modelo A/B/C/D.
- [ ] Crear repo público + licencia.
- [ ] Variables de entorno y auth.
- [ ] `POST /v2/checkout/orders` + capture.

### 28 oct
- [ ] Botón JS SDK v6 end-to-end.
- [ ] Persistir order/capture.
- [ ] Página de confirmación.

### 29 oct
- [ ] Webhook + verificación de firma.
- [ ] Dedupe e idempotencia.
- [ ] Ledger append-only.

### 30 oct
- [ ] Policy engine + reglas.
- [ ] Aprobación humana.
- [ ] Read-back de PayPal.

### 31 oct
- [ ] Reconciliación cron.
- [ ] Manejo de errores y estados.
- [ ] Primer smoke test completo.

### 1–3 nov
- [ ] Tools del agente.
- [ ] Propuesta estructurada.
- [ ] UI de chat/trace.
- [ ] Fallback determinista.

### 4–6 nov
- [ ] Integración del sponsor elegido.
- [ ] Widget/Gantt/búsqueda.
- [ ] Pulido visual.
- [ ] Datos seed.

### 7–8 nov
- [ ] Caso de fallo y recuperación.
- [ ] Modo mock.
- [ ] Tests.
- [ ] Evidencia en `docs/evidence/`.

### 9 nov
- [ ] Feature freeze.
- [ ] README final.
- [ ] Deploy.
- [ ] Checklist de entrega.

### 10 nov
- [ ] Grabar video.
- [ ] Editar a <3 min.
- [ ] Subir a YouTube público.

### 11 nov
- [ ] Descripción de submission.
- [ ] Herramientas usadas.
- [ ] Revisar links.
- [ ] Enviar.

### 12 nov
- [ ] Buffer.
- [ ] Confirmar submission antes de 12:00 PT.

## Cut list

Si vas tarde, elimina en este orden:

1. Payouts.
2. Múltiples APMs.
3. Autenticación avanzada.
4. Mobile.
5. i18n.
6. Widgets extra.
7. Historial avanzado.

## Definition of done

- [ ] Un flujo end-to-end funciona en sandbox.
- [ ] Un fallo se maneja y se explica.
- [ ] La IA participa de forma no trivial.
- [ ] El sponsor se usa de verdad.
- [ ] README reproducible.
- [ ] Video <3 min.
- [ ] Repo público con licencia.

## Enlaces

- [[12 Checklist de entrega]]
- [[72 Guion del video]]

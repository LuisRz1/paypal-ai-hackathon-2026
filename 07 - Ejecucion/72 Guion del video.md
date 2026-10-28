---
title: Guion del video
tags: [ejecucion, video, demo]
updated: 2026-10-28
---

# Guion del video

Duración objetivo: **2:45**. Límite: 3:00.

## Guion

| Tiempo | Visual | Voz / texto |
|---|---|---|
| 0:00–0:20 | Timeline con `SUB-1002` en rojo | “Un renewal falla. PayPal reintenta dos veces. El merchant no se entera y la suscripción se suspende.” |
| 0:20–0:40 | Stats en pantalla | “El 26% del churn es involuntario. La recuperación mediana es 47.6%. El problema no es el reintento: es lo que pasa después.” |
| 0:40–1:10 | Timeline + detalle | Mostrar saldo $49, `PAYMENT_DENIED`, próximo retry y estado `SUSPENDED`. |
| 1:10–1:40 | Explicación del agente | “PayPal declined the payment” + causa + acción recomendada + playbook. |
| 1:40–2:05 | Aprobación y captura | Click “Approve recovery”; mostrar `CAPTURE 49.00 USD` y el `requestId`. |
| 2:05–2:25 | Read-back y ledger | `VERIFIED`, `captureId`, eventos `proposal / capture / verify`. |
| 2:25–2:45 | Impacto y cierre | “PayPal ya reintenta. Recover hace que el merchant actúe sobre el saldo antes de que el suscriptor se vaya.” |

## Checklist de grabación

- [ ] 1080p o superior.
- [ ] Escritorio limpio, sin notificaciones.
- [ ] Datos seed, no vacíos.
- [ ] Sin secretos visibles.
- [ ] Cursor visible y zoom en lo importante.
- [ ] Audio claro; subtítulos en inglés.
- [ ] Una sola toma principal + inserts.

## Edición

- Cortes secos, sin música con copyright.
- Texto en pantalla para los 3 pasos clave.
- Mostrar el nombre del sponsor y la API usada.
- No acelerar tanto que no se entienda.
- Exportar MP4 H.264.

## YouTube

- Título: `ProjectName — PayPal AI Hackathon 2026`.
- Descripción: problema, stack, repo, demo.
- Visibilidad: **público**.
- Miniatura legible.

## Errores a evitar

- Empezar con arquitectura.
- Enseñar código.
- Demo sin voz.
- Video de 4 minutos.
- Música o marcas sin permiso.
- Mostrar un mock como si fuera real.

## Enlaces

- [[52 Demo y entrega]]
- [[12 Checklist de entrega]]

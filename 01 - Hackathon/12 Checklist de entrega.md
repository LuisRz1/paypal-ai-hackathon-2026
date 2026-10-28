---
title: Checklist de entrega
tags: [hackathon, checklist, submission]
updated: 2026-10-27
---

# Checklist de entrega

## Repo

- [ ] Público en GitHub/GitLab/Bitbucket.
- [ ] `LICENSE` MIT o Apache visible en el About.
- [ ] `README.md` con problema, features, stack, setup y demo.
- [ ] `.env.example` con todas las variables, sin secretos.
- [ ] Scripts de instalación y ejecución probados en limpio.
- [ ] Sin credenciales, tokens ni `.env` en el historial.
- [ ] Datos de prueba o modo mock claramente etiquetados.
- [ ] `docs/evidence/` con capturas y JSON de sandbox.

## Demo

- [ ] URL hospedada **o** instrucciones reproducibles.
- [ ] Flujo end-to-end: intención → PayPal → confirmación.
- [ ] Caso de fallo y recuperación visible.
- [ ] Credenciales sandbox de prueba incluidas en el README (sin secretos reales).
- [ ] La demo no depende de un LLM caro o inestable para funcionar.

## Video

- [ ] < 3 minutos.
- [ ] YouTube público.
- [ ] Muestra el proyecto funcionando en su dispositivo.
- [ ] Explica problema, usuario, solución y por qué importa.
- [ ] Sin música ni marcas de terceros sin permiso.
- [ ] Subtítulos en inglés si el audio no es inglés.

## Descripción

- [ ] Features y funcionamiento.
- [ ] Herramientas de IA usadas y cómo.
- [ ] Integración PayPal concreta (API/producto).
- [ ] Sponsor tool usado y para qué.
- [ ] Qué es real y qué es simulado.
- [ ] Impacto y siguiente paso.

## QA previo

- [ ] Probar en una máquina limpia.
- [ ] Ejecutar `sandbox-check.mjs --execute --save` y guardar `docs/evidence/`.
- [ ] Verificar enlaces del README.
- [ ] Verificar que el video no está privado.
- [ ] Verificar que el repo no tiene el `.env`.
- [ ] Revisar [[51 Patrones de confianza]].
- [ ] Confirmar regla de apilamiento de premios.
- [ ] Enviar antes del 12 nov 2026, 12:00 PT.

## Enlaces

- [[10 Reglas y fechas]]
- [[52 Demo y entrega]]

---
title: Decimoquinta ronda · Dependencias, a11y y móvil
tags: [auditoria, seguridad, accesibilidad, mobile]
updated: 2026-10-28
---

# Decimoquinta ronda · Dependencias, a11y y móvil

Tres iteraciones de calidad sobre la app actual.

## Iteración 1 — Dependencias

`npm audit --omit=dev` encontró:

- `postcss <= 8.5.22`: XSS y path traversal (high).
- Next 15.5.28 depends on the vulnerable range.
- Fix automático: Next 16.4.3 (breaking).

**Decisión:** override de `postcss` a `8.5.32` en `web/package.json`, sin saltar a Next 16.

Resultado:

```text
found 0 vulnerabilities
```

Build de producción: OK.

## Iteración 2 — Accesibilidad

`axe-core 4.13.0` sobre la página:

- 1 violación: `empty-table-header` en la última columna.
- Fix: `<th><span class="sr-only">Actions</span></th>` + `scope="col"` en las cabeceras.

Resultado:

```text
violations: 0
passes: 32
```

## Iteración 3 — Móvil

Antes:

```text
scroll: 647 / client: 390
```

Después de `overflow-x`, media query y `table-layout: fixed`:

```text
scroll: 390 / client: 390
```

La tabla ya no desborda el viewport. La timeline pasa a una columna.

## Hallazgos

1. El override de `postcss` evita un major upgrade de Next.
2. La tabla necesitaba `table-layout: fixed`; `overflow-x` solo no bastaba.
3. `axe-core` no detectó problemas de contraste ni labels.

## Estado

| Área | Puntos |
|---|---:|
| Research + repo | 30/30 |
| App + a11y + mobile | 28/30 |
| PayPal client + webhook | 5/15 |
| IA | 6/10 |
| Deploy readiness | 3/5 |
| Demo docs/video | 3/10 |
| **Readiness** | **75/100** |

## Próximo paso

1. Credenciales sandbox y captura real.
2. Deploy en Render.
3. Video.
4. Bryntum si queda tiempo.

## Enlaces

- [[55 Decimocuarta ronda - Seguridad deploy y demo]]
- [`web/DEMO.md`](../web/DEMO.md)
- [`web/package.json`](../web/package.json)

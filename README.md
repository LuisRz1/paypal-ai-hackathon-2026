# PayPal AI Hackathon 2026 — Research Vault

Obsidian vault with the research, rules, PayPal API notes, sponsor analysis, project landscape, architecture patterns, and execution plan for the [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/).

**Deadline:** November 12, 2026, 12:00 PT.

## Open the vault

1. Install [Obsidian](https://obsidian.md/).
2. Open this folder as a vault.
3. Start at `00 - Inicio/00 Inicio.md`.

The vault uses wikilinks, tags, and YAML frontmatter. No plugins are required.

## What is inside

| Folder | Contents |
|---|---|
| `00 - Inicio` | Home MOC, status, decisions, open questions |
| `01 - Hackathon` | Rules, dates, judging criteria, prizes, submission checklist |
| `02 - PayPal` | Auth, Checkout, Subscriptions, Invoicing, Payouts, Disputes, Reports, APMs, Pay Later, Donate, Webhooks, Agent Toolkit/MCP, compliance |
| `03 - Sponsors` | Sponsor map and deep dives on AG Grid, Bryntum, Channel3, plus the rest |
| `04 - Referencia GitHub` | GitHub landscape analysis and key repos |
| `05 - Patrones` | Canonical architecture, trust patterns, demo and delivery |
| `06 - Modelos` | Four project models and a weighted comparison |
| `07 - Ejecucion` | Stack, backlog, video script, data schema, Recover Control Plane |
| `08 - Referencias` | Links and glossary |

## Current status

- Model: **Recover Control Plane** — AI-compiled, human-approved PayPal recovery with signed evidence.
- Sponsor target: **none** (focus Grand/Impactful).
- Application: Next.js app in [`web/`](web/), mock-first; policy compiler, 288-case simulator, single-use capabilities and signed passports implemented. Real sandbox capture not executed.
- Architecture: [`web/CONTROL_PLANE.md`](web/CONTROL_PLANE.md).
- Research vault: complete; see `00 - Inicio/00 Inicio.md`.
- Agent instructions: [`AGENTS.md`](AGENTS.md).

### Run the control plane

```bash
cd web
npm install
npm run build
npm run start -- -p 3100
```

Open http://localhost:3100. Start with **Mandate**, run the 288-case simulation, then review `SUB-1002` under **Recoveries**. See [`web/DEMO.md`](web/DEMO.md).

## Rules of the project

- PayPal **sandbox only**.
- The model proposes; deterministic code decides; PayPal verifies.
- No credentials in the repository.
- Public repo with an open-source license.
- Demo video under 3 minutes, in English.

## License

MIT. See [LICENSE](LICENSE).

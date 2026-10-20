# Bobby: AI-native benefits companion (demo)

A sales demo of the HR-facing dashboard for an AI-native benefits brokerage. **All data is fictitious**: no backend, no auth, no external calls.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run lint
```

Deploys to Vercel with zero config.

## How it's built

- **Next.js App Router + TypeScript + Tailwind v4**, `geist` fonts, `lucide-react`, `framer-motion`. Charts are hand-rolled SVG.
- **`/data`**: typed fake data (employees, plans, findings, compliance, cases, scripted Ask Bobby answers).
- **`/lib`**: every on-screen number is computed here, so edits to `/data` stay consistent.
  - `dates.ts`: `DEMO_TODAY` (Tue, Oct 20, 2026). All relative dates derive from it.
  - `billing.ts`: three-way match engine (HRIS eligibility vs payroll vs carrier invoice) and finding impacts.
  - `aca.ts`: ALE / FTE projection (30+ hrs = full-time, part-time hours ÷ 120).
  - `levelFunded.ts`: claims vs fund, surplus projection.
  - `selectors.ts`: metrics that combine data with approval state.
  - `store.ts`: client-only approval state (localStorage, fail-safe). **Reset demo** lives in the sidebar footer.

## Editing the story

- Change a person or tier in `data/employees.ts`, and premiums, the match grid, findings, and Ask Bobby answers update.
- Billing findings live in `data/findings.ts`; dollar impact is computed from rates, never stored.
- Part-timer hours (`weeklyHoursByMonth`) drive the ACA projection; tune them to move the ALE crossing point.

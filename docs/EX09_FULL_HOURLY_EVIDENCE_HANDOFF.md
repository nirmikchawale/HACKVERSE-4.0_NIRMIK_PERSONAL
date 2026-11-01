# EX-09 — Full hourly model evidence, day-filtered export, trilingual controls

**Baseline:** protected \`main\` merged EX-08 at \`144bde4976fc392555fc4d812ec0c8f0eac7cbb9\`.
**Scope:** \`frontend/public/connected.js\`, \`frontend/public/model-evidence.css\`, this Playwright test, and this handoff. No backend API/forecast-model/Cloudflare Worker changes.

## Features, all inside existing six-page MVP

1. **All returned verified hourly model records in an accessible table.** Prior weather bar view shows first 24 hours only. This table covers the complete accepted response (typically ~72 hours) using backend-native IST timestamps, mm and hourly probability with missing values shown as unavailable. No fabricated readings, rain-onset predictions or safety thresholds.
2. **Daily filter, without losing other source records.** The date dropdown derives only from returned valid model hours. Default shows all model dates. On change it displays the selected day's actual hour rows; source freshness/unsupported place clears all rows.
3. **Controlled proposed-deadline action.** Each **future** model-hour row has a button that fills the existing Page 2 deadline field, explicitly requiring the farmer to click the existing Save button. No auto-saved deadline, triggered simulation or claim that this hour is agronomically safe. Past/current hours are disabled and timestamp/source validity is rechecked at click.
4. **Selected-day CSV evidence export.** Only enabled after choosing an IST day and having a fresh, backend-verified forecast. Exports source-native hours, modeled rain/probability, UTC retrieval/provenance and no-safety disclosure. Missing fields are blank; spreadsheet-formula-leading strings are escaped. The pre-existing full forecast CSV remains unchanged.
5. **English / Marathi / Hindi evidence controls.** Source-quality labels, table headings, state messages, date controls, action labels and distinctions are presented in the chosen language. Source codes, units and machine-readable CSV column names stay consistent and unchanged for auditability.
6. **Accessible responsive interaction:** table headings/scope, keyboard actions, focus rings, horizontal scrolling without losing mobile layouts, an announced status summary, no new dependencies.

## Exact-SHA tests required

- Existing B-01 TypeScript/npm audit/Vite + desktop/mobile Chromium and B-03 genuine Python/API browser smoke green at the same commit.
- Focused Playwright covers full 40-item table beyond first 24 bars; date filtering; valid future candidate; unavailable/unsupported/expired; selected-day CSV with source exactness; English/Marathi/Hindi dynamic text and source stability.
- No automatic merge when GitHub status gates fail. No public Cloudflare or Vercel deployment claims without verified production SHA, GET/POST and visual checks.

## Hosting coordination

The separate \`migration/cloudflare-typography-01\` branch is evolving through chat 1.01; do not override its Material 3 typography, responsive sidebar, Cloudflare Python runtime or public deployment settings. Incorporate EX-09 via a reviewed, conflict-aware integration after testing. This PR starts directly from \`main\` so a protected isolated merge can be considered on its own merits.

# External Reuse Assessment — ECC and Dqnamo

**Date:** 1 November 2026
**Product:** Agri Foresight (Jalna, already-picked cotton), protected source: https://github.com/nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL
**Requested resources:**
- https://github.com/affaan-m/ECC
- https://www.dqnamo.com/list

## ECC — verdict: PARTIALLY ADOPT ENGINEERING PRINCIPLES, do not install wholesale

- Public source `affaan-m/ECC` checked through GitHub on 1 Nov 2026. Its root `LICENSE` is MIT (© 2026 Affaan Mustafa). Reuse/copy requires retaining that licence for substantial source portions. We copied **no ECC source code**.
- `commands/quality-gate.md` documents a post-edit formatting check (not lint/typecheck). `commands/fastapi-review.md` outlines Pydantic/schema, auth, CORS, security, resource and testing checks. `commands/code-review.md` outlines defect and regression checks. `docs/MANUAL-ADAPTATION-GUIDE.md` explicitly supports selective adaptation instead of loading entire repo.
- Applicable now: repeatable tests-first features, explicit FastAPI error/data contracts, minimal-scope PRs, exact-sha tests, provenance, privacy, relevant format/lint tests, structured review and failure accountability. Existing Agri Foresight GitHub checks are authoritative.
- Not approved: running `install.sh`/`install.ps1`, automatically loading hooks/skills or broad IDE modification, agent memory, hosted agents, third-party scanners/plugins, account or CI permissions. Any future ECC dependency/installation needs separate trust and operational review.

## Dqnamo — verdict: ADAPT A SMALL INTERACTION PATTERN, NOT ITS FRAMEWORK

- The exact `https://www.dqnamo.com/list` endpoint could not be accessed during review. The official `https://www.dqnamo.com/kitchen` and `https://www.dqnamo.com/experiments/dynamic-button` describe UI components.
- Dynamic Button indicates real loading/action state and reduced-motion-friendly transitions. Its published code targets React and Motion; Agri Foresight uses vanilla Vite, so adding the framework only for a button would increase bundle/QA scope without helping farmer decisions.
- Implement independently in existing `frontend/public/connected.js`: while genuine forecast/NASA/assessment requests run, show **specific** loading text, disable double clicks and set `aria-busy`; after completion or error, restore actionable label. Keep actual source status visible separately. No copied React/Motion source or third-party runtime dependency.
- Do not show a fake success animation if the API returned unavailable or malformed data. A blocked source must remain labelled unavailable; never fill with samples.
- Other experiments (playing cards, receipt printing, magnetic drop, AI agent dock) do not meet present MVP data/usefulness tests. Agent Dock would misleadingly suggest an autonomous AI farm advisor when the current helper is FAQ-only.

## Minimal acceptance contract (apply per feature, <=20-min active work unit)

1. Identify actual working user action and supported Jalna-only data boundary.
2. List provider URL, observed access result, unit, date range, timezone, attribution, null/stale/failure behavior.
3. Distinguish genuine government **historical** NASA records from Open-Meteo **future** model forecast and unverified farmer declarations.
4. No hidden placeholder, hardcoded farm data, generated weather, stale-as-current, unsupported IMD claims, or unreviewed crop threshold.
5. Write focused regression tests and preserve preexisting passing shards; do not regress language, mobile or keyboard.
6. Run both required GitHub checks on exact PR HEAD, verify READY preview same SHA, then authorized guarded merge and exact-SHA public certification.
7. If Vercel blocks deploy due daily free-plan 402, record BLOCKED and preserve production SHA. Do not bypass plan limits, cycle deployments, or assert success.

## Source review trail
- ECC: `https://github.com/affaan-m/ECC/blob/main/LICENSE`, `commands/quality-gate.md`, `commands/fastapi-review.md`, `commands/code-review.md`, `docs/MANUAL-ADAPTATION-GUIDE.md`.
- Dqnamo: `https://www.dqnamo.com/kitchen`, `https://www.dqnamo.com/experiments/dynamic-button`.
- Brand/UI: preserve Tanisha's six-page design and the user's gold-white circular emblem.

**Status:** CODE ADAPTED LOCALLY IN PR ONLY. No ECC installer was executed, no dependency added, no external account connected.

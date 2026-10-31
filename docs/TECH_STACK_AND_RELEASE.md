# UnlockPlan — Selected Stack and Release Contract

## Repository audit (31 October 2026)
Repository `nirmikchawale/HACKVERSE-4.0_NIRMIK_PERSONAL` is public and writable through the connected GitHub integration. Initial main commit `ba280a887e2a77800e94dde9ccfefdfe4b85d58b` contains only `README.md`. The earlier tested UnlockPlan Python prototype currently exists as a separate local ZIP artifact; it is **not yet present** in this repository. GitHub Auto Merge is currently disabled.

## Frozen stack
| Component | Technology | Why |
|---|---|---|
| Frontend | TypeScript + Vite + native HTML/CSS | Type-safe UI without a React migration; preserve existing static interface |
| Backend | Python 3.12+ / FastAPI / Pydantic | Reuse tested source and existing REST contract |
| Forecast | Open-Meteo model API | Source-labeled public forecast; runtime verification is a mandatory gate |
| Agriculture evidence | ICAR-CRIDA Jalna contingency PDF | Historical context only; not a current executable rulebook |
| Algorithm | Existing Python deterministic constraints + inclusion-minimal change enumeration | No custom model training, no needless optimization dependency |
| Tests | pytest + TypeScript `tsc` + Vite build + focused browser smoke | Minimal critical regressions |
| Hosting | Vercel Git integration; Services if access is enabled | Single public domain; preview and production per Git branch; beta caveat |
| Source | GitHub main + short feature PRs | Auditable SHA, rollback and non-destructive work |

### Intended file tree
```text
/
  README.md
  docs/
    MASTER_EXECUTION_PROMPT.md
    TECH_STACK_AND_RELEASE.md
  frontend/
    index.html
    package.json
    tsconfig.json
    src/main.ts
    src/style.css
  backend/
    main.py
    pyproject.toml
    unlockplan/
      engine.py
      weather.py
      sources.py
    tests/
  vercel.json
  .github/workflows/verify.yml
```
This is an **intended structure**. Do not claim these files have been implemented just because they are listed here. Move existing Python sources before new features. Keep API paths at `/api/health`, `/api/forecast`, `/api/sources`, `/api/evaluate`.

### Build stages
1. Restore the current tested Python source into the GitHub working branch without altering arithmetic.
2. Make a TypeScript/Vite shell using the original HTML/CSS; retain the user-facing evidence labels.
3. Connect the existing API through same-origin `/api` routing.
4. Verify live external forecast and source metadata from a network-enabled runner.
5. Add before/after timeline state and tests without introducing novel agronomic thresholds.
6. Run GitHub Actions and browser smoke; merge only real PASS.
7. Link this exact GitHub repository to Vercel Git in the correct account/team; configure frontend/backend Services if available.
8. Validate preview, production build, live HTML, API endpoints, and exact source SHA.

### Release conditions and deployment caveat
The connected Vercel lookup on 31 October 2026 returned **no Vercel teams or linked projects**, so automatic deploy to an existing public Vercel URL is **not configured or verified**. Project linking and a working account scope are prerequisites. A checked-in `vercel.json` alone will not publish anything.

Vercel Services is beta as of 2026-10-31. Do not choose GitHub Pages alone as a production backend: Pages cannot execute the Python FastAPI API. If beta Services is inaccessible, evaluate one FastAPI deployment serving prebuilt TypeScript static assets, or separate Vercel frontend/backend projects, with explicit validation before committing to the fallback.

### No-synthetic user-facing data
Only authentic weather data plus real user-declared resources may be presented as current inputs. Synthetic abstract units belong in isolated automated tests. Handle missing live data with an honest degraded mode. Serverless local disk is not durable storage.

### Automatic integration semantics
"Automatic publishing" means: once Git integration and safe release checks are established, each **accepted merge to main** triggers a Vercel production build and a public verification step. It does **not** mean every speculative Codex edit is automatically pushed to main or exposed without validation. Each PR should get a preview build and CI check first. Preserve approvals where required and never bypass a failed gate.

## Authoritative references
- https://vercel.com/kb/guide/vercel-services (Services public beta; single-project polyglot)
- https://vercel.com/docs/frameworks/backend/fastapi
- https://github.com/vercel/vercel-plugin/blob/main/skills/vercel-services/SKILL.md
- https://open-meteo.com/en/docs
- https://icar-crida.res.in/CP/Maharastra/MAU,%20Parbhani/Maharashtra%2033-Jalna-31-12-2011.pdf

## Excluded scope
No crop yield predictions, global novelty claims, storage safety guarantees, real-field validation, resource delivery promises, new crop modules, logins, marketplaces, chatbots, satellite systems or heavy infrastructure.

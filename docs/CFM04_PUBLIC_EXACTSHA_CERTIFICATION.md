# CFM-04 — Public production certificate (automated, no secrets)

The workflow `.github/workflows/cfm04-public-certificate.yml` runs on every relevant `main` push and can be manually dispatched by an authorized repository owner. It checks the already configured Cloudflare Workers service at `https://agri-foresight.nirmikchawale1.workers.dev`, but **does not perform a deployment or bypass platform quotas**.

A passing certificate requires: exact public `/_release.json` matching the main commit after bounded retries; public same-origin GET `/api/health`, `/api/sources`, `/api/forecast`, `/api/government-climate`; true FastAPI POST `/api/evaluate`, `/api/compare`, malformed replan/negative units 422; all current static glassmorphism and evidence assets; presence of source code markers for F01,F05,F09,F11,F12,F13,F17,F19,F23,F27 and manual comparison; desktop all-six-page navigation, mobile navigation, Marathi/Hindi/English and print report; no JavaScript exceptions.

The local Cloudflare Worker gate (CFM-03) and the Cloudflare deployment provider build check are independent. A stale preview URL, green GitHub PR, browser screenshot, or provider status alone does NOT certify public production.

Only three kinds of data are sent from Actions: public GETs, narrow abstract test declarations (10 handling units / 6 capacity, 2099 date), and invalid negative test inputs for contract validation. There is no credential, farm identity, mock weather or synthetic live source substitution. The workflow uploads no traces, API payloads or screenshots. The source inspection checks for incorporated code markers, not source provider truth; the real API GET/POST gate checks actual behavior.

If the job fails, diagnose the exact reason once from its logs and apply a scoped recovery, never waive the exact-SHA gate.

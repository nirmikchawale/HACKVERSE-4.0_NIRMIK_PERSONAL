# UnlockPlan frontend — B-01 foundation

Vanilla TypeScript + Vite + accessible HTML/CSS. This **is not a connected MVP**: the existing Python ZIP and original HTML/CSS have not yet been imported into GitHub. The static foundation deliberately shows no synthetic forecast or resource inventory.

## Local commands

    cd frontend
    npm install
    npm run dev
    npm run typecheck
    npm run test
    npm run build
    npm run preview

Run with Node.js 20.19+ or 22.12+. Until the Python API is imported, /api endpoints are **not present**. No Vercel routing or deployment is configured in B-01.

## Next step

B-02: import/preserve the original visual assets when they become available; implement typed forecast, candidate deadline, farmer-resource input and result screens against the actual Python contracts. Do not invent response fields or copy synthetic fixtures into user-facing UI.

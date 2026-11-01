# CFM-R16–R24 recovery checkpoint — 1 November 2026

Main inspected: 13ede23320ae9510bfc021cdad8b53c005a5e0e7. Migration parent: 7d27853bab97171da2787554a5adabd18ae4514f.

Production build 5147395b-326f-4121-99e5-c2c5d47bc948 built main successfully but failed to spawn pywrangler: that checkout lacks root Python deployment configuration. Do not retry it.

Independent preview build a5cadd29-ce06-4d8f-b5cc-d87f3eba32d6 at PR28 head 65528cbc162751010bbad5ccf300e93da947bceb reached deployment with pywrangler, then failed validation code 10021: python_modules/annotated_doc-0.0.5.dist-info/entry_points.txt already added to bundle. Root module discovery scans vendored modules twice and also includes frontend development assets.

Move the Python entry point into backend/ and retain Python packages at the repository root, as supported by Wrangler module-root separation. Do not disable the external SDK. The corrected local dry run assembled 1118 modules, 10401.47 KiB uncompressed / 2592.69 KiB gzip, without frontend development files. SDK resolution: workers-py 1.17.9; workers-runtime-sdk 1.9.5; Wrangler 4.156.0. Commit uv and Pyodide package locks for repeatable dependency resolution.

Reconcile PR18 with current main, preserving EX08–EX14 features. Keep multilingual NASA labels, forecast freshness, hourly evidence, exact IST calendar checks, newer typography and both comparison modes. Retain migration sidebar, source-native forecast summaries, NASA CSV and real loading states. Avoid loading typography twice.

Local tests: 112 Python tests PASS; 13 frontend unit tests PASS; TypeScript/Vite PASS; npm audit zero vulnerabilities. Local Chromium archive download was truncated. Local Worker startup is blocked by host network-interface enumeration (uv_interface_addresses). Neither limitation is a test pass. GitHub Chromium and genuine Pyodide runtime checks remain mandatory before merge.

Cloudflare preview base settings observed: repository root /, npm run build, uv run pywrangler preview. Production must remain main and use root npm run build only after a certified migration merge. Vercel fallback and security settings untouched. No merge, live release or public certification at this checkpoint.

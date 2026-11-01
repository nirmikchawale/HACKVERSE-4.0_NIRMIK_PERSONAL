# UIX-OVERVIEW-TRIM — 2026-11-01
Scope: visual cleanup requested from two user screenshots of Agri Foresight.

## Changed on migration candidate
- Remove the entire **Clear decisions, not guesswork** sidebar footer block (not merely its text).
- Remove the entire **Built for transparency** overview panel and its evidence-page navigation link; other navigation to the evidence route stays functional.
- Remove the large full-width **FastAPI connected · P0 · ...** banner from the overview. Keep the genuine backend health status in the evidence route as an accessible, nonvisual status element `#apiConnectionStatus` to preserve API instrumentation and prior tests. Existing visible provenance/source sections elsewhere remain.
- Apply a two-column-only stretch rule so **Preparation snapshot** ends precisely at the same lower edge as **THE DECISION PATHWAY** on desktop. Below 1051px the cards stack at their natural height.
- Add focused Playwright tests for removed blocks, real FastAPI status, card geometry at 1440/1180px, natural stacking at 960/390px and navigation to Evidence.

No API source, math, crop assumption, theme, navigation or backend file changed. No production merge, Free plan upgrade or force push. The change is committed only to the Cloudflare migration PR #18; public preview requires independent build/deployment evidence.

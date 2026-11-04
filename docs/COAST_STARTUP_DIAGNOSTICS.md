# COAST R8.7 — Pixel 8 first-load diagnostics (dev only)

This is **instrumentation**, not a startup optimization. The public `main` branch is unchanged.

## Run on the actual phone

1. Start the existing `dev` server, reachable from the phone on the same LAN (for example `http://192.168.1.106:5180/`; use the actual active port).
2. Open `/?startupdiag=1` on **Pixel 8 Chrome**. The ordinary scenic journey remains selected. The optional diagnostic strip appears on the loading artwork.
3. Watch the loading percent, the completed nearby road/scenery items, farm chunks 2–4, farm GPU warmup progress, and the outstanding readiness blockers. At 98% you should be able to see whether the holdup is farm GPU warmup, road/scenery, textures, or worker initialization.
4. Tap **匯出啟動紀錄 JSON** (on the loading screen or its small floating button once the game appears) and send the downloaded file to Julia/Codex for analysis. The browser console also exposes `window.__startupDiagnostics.report()` while the query parameter is set.
5. Ideally capture one genuinely cold load (site data/cache cleared or fresh private context) and one warm reload without clearing browser cache. Note elapsed wall time and whether the FPS indicator eventually stabilizes.

The JSON contains stage timestamps, 98%-to-ready wait, detailed readiness gate changes, farm shader-compilation wall time, tiny-render submission wall time, rAF frame gaps, navigation timing, and up to 150 slowest startup asset requests. It does **not** contain a GPU timer query or device temperature reading. Timings of `renderer.render` submission are CPU-side and **must not be called GPU completion time**.

## Files instrumented

- `src/startup-diagnostics.ts`: opt-in trace, on-screen status and JSON export.
- `src/loading.ts`: percentage/finish/failure events.
- `src/main.ts`: route, renderer, world, water, boat and shader phases; throttled readiness samples.
- `src/streamed-scene.ts`: read-only startup blockers and farm warmup progress.
- `src/coast-farm.ts`: optional per-object shader compile/submission timing during the existing warmup.

The following are **not changed**: `StreamedScene.ready` gate, Worker window, farm warmup algorithm, rendering parameters, driving controls, frame budget, Netlify production config.

For analysis: compare time at 98% with `startup-ready`, inspect the last `readiness` event's `blockers`, the `farmWarm` done/total and compile/submit totals, and compare with network resource durations. No conclusions about GPU vs CPU can be drawn solely from a slow percentage.

**Verification:** Physical Pixel 8 timings and build/test execution are pending. The next step is to collect real device JSON before making scheduling changes.

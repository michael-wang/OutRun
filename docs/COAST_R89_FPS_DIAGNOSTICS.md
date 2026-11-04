# COAST R9.0 P0 — Pixel 8 scene-task FPS diagnosis (dev instrumentation only)

**Goal:** identify why real Pixel 8 Chrome reports ~27 FPS around the main golden rice fields, without changing appearance, FFT settings, material density, physics, streaming budgets, or `main`.

## Entrypoints

- **Driving FPS profiler:** `/?fpsdiag=1` — 10-minute bounded one-second samples; export **「匯出 FPS JSON」** from a small floating diagnostic panel.
- **Existing startup profiler:** `/?startupdiag=1` — retained unchanged for first-load analysis. Use separately when comparing driving to avoid unnecessary overlapping instrumentation.
- The accepted R8.8 golden rice renderer is now the **only** live rendering path. `?rice=legacy` / `?rice=hybrid` no longer select variants.
- Dev version label: **`v0.9-coast-r9.0-p0`**. No new `main` release from this diagnostic change.

Open the local `dev` server from the **actual Pixel 8** on the same Wi-Fi (use its current IP and port, for example `http://192.168.1.106:5173/?fpsdiag=1` if that remains the active server).

## What is measured

- `requestAnimationFrame` frame gaps: per-second FPS, p95 gap, worst gap, count of >33 / >50 / >100ms frames.
- Per-frame **CPU wall time** for physics, world/Worker-commit/update, other render setup, Ultra-Water FFT update/submission, boat-shadow rendering and main-scene `renderer.render()`.
- Total JS/render callback CPU duration.
- Main-scene draw calls and triangles, plus renderer texture/geometry counts.
- Every second: outstanding streaming tasks / current Worker request, loaded rice/flower plots, crop clumps, grass blades, flower instances, rice-canopy triangle counts and Ultra-Water state.
- **R9.0 P0:** `extras.streamer.taskProfile` breaks down each main-thread scene task by kind, chunk, average and maximum CPU time, and >3/16/33/50ms counts. `lastSlowTasks` retains recent high-cost individual task records. Also separates `queue-sort` and `pump-overhead`.
- If supported by Chrome/GPU, periodic asynchronous WebGL2 `EXT_disjoint_timer_query_webgl2` timing around **FFT + boat shadow + scene**; logged in `gpuSamples`. No blocking `gl.finish()` calls. Unsupported devices report `gpuTimerSupported=false`.
- Regions based on real route metres: approach **1800–2400m**, main rice **2400–3000m**, first flowers **3100–3600m**, exit **3600–4200m**, plus other rice/flower visits. The export has `regionSummary` and individual `seconds` rows.

## Pixel 8 collection

1. Update the local `dev`, run `npm run build` / `npm test`, start the normal server. Confirm the `-r9.0-p0` suffix.
2. Open **`?fpsdiag=1`** on Pixel 8, rotate to landscape, press Play.
3. Drive past the main **2400–3000m** rice field **and** the nearby 3100–3600m flower field. Drive normally at a consistent fast pace when safe; avoid repeated pauses, focus loss and deliberate off-road tests. Watch the on-screen FPS if needed.
4. After passing about 4200m, tap **匯出 FPS JSON**. The file contains all earlier recorded seconds and spikes; export does not stop recording. Share this JSON and, if helpful, a screenshot where FPS is low.
5. For a second comparable run, close/reopen browser or let device cool, keep orientation/resolution, and repeat. If the issue appears only after prolonged playing, drive longer (capture is capped at 600 one-second records).

## How to interpret

- Low FPS in **all regions** despite little change in main-scene calls may implicate global rendering, FFT, device constraints or thermal throttling rather than rice.
- FPS dropping specifically in **main-rice** with a jump in `drawCalls`, triangles or `mainScene` CPU submission points toward visible geometry, material, fragment work or new uploads.
- `world` CPU increases concurrent with `streamer.queue` / farm counts rising point toward chunk assembly or late-on-screen geometry.
- `ocean` CPU spikes can reflect FFT submission; `boatShadow` separate CPU time is recorded.
- Low GPU query ms alongside high callback CPU supports CPU-side bottlenecks; high GPU query ms alongside low callback CPU is stronger evidence of a GPU/driver bottleneck. **No GPU timer => cannot prove GPU cost from JS timing alone.**
- `renderer.info.render.calls` is the last main scene render, **not** total ocean FFT offscreen GPU draws. `farms` numbers count loaded resources, not necessarily per-frame visible instances.
- Profiling itself has a small runtime cost. Cross-check the ordinary URL's built-in FPS readout if the profiler seems to alter performance.

## Changes and verification boundaries

The R8.8 legacy rice toggles were retired previously; the accepted golden rice look stays unchanged. R9.0 P0 adds per-task streaming attribution and tests so the next performance change targets a proven bottleneck. Shader, water and driving parameters are unchanged. Full repository Build, automated unit tests and real-device measurement need to be executed in the actual development environment; remote GitHub edits alone do not count as a test pass.


For the R9.0 resource architecture decision and current P0 benchmark, see [ADR-009](ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md) and [R9.0 P0 handoff](R90_P0_SCENE_TASK_HANDOFF.md).

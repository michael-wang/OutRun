# COAST R8.8 EXP — Rice Sea Hybrid Renderer + startup gate A/B

## Baseline / rollback

- Original, pre-experiment `dev`: **`b6a4ad3abd91923cf8f162bce5a730e825ec27be`** (still in Git history).
- The experimental changes are committed only to `dev`. `main` stays the approved family-playtest build.
- Immediate fallback without changing any files: append **`?rice=legacy`** (the original R8.7 rice construction, texture and ready gate). The new experiment is selected by default, or explicitly with `?rice=hybrid`.
- No branch was reset or force-pushed. To undo the whole experiment *before introducing unrelated dev commits*, use `git revert --no-commit b6a4ad3abd91923cf8f162bce5a730e825ec27be..dev`, inspect the result, commit and push normally. Review the commit range if other work was added afterward.

## Why

Pixel 8 Chrome, Vite dev-server, Nov 4 baseline:

| Measure | Cold incognito | Warm reload |
| --- | ---: | ---: |
| Script start → startup-ready | **22.00s** | **22.64s** |
| Time at 98% | 7.69s | 7.41s |
| Wait after 98% | **14.31s** | **15.23s** |
| Initial farm prewarm | 226 meshes, ~9.7s | 226 meshes, ~10.2s |
| Farm chunks 2,3,4 ready | ~12.5s | ~12.6s |

The first two nearby road/scenery chunks were ready around 7.4–7.9s. We were blocking the player on the distant rice/flower fields and uploading every Mesh one-by-one. The 226 calls included distinct per-field geometries, not 226 different shader programs.

## Experiment (new default)

1. Rice terrain retains its opaque crop-height mesh, existing farm sampling/terraces, soil/path strips and scarecrow clearing.
2. A single **256² mipped directional rice-head texture** replaces the old 128² random-dot texture. Continuous gold canopy and existing world-space wind form the primary appearance. Mips help prevent distant sparkle.
3. In rice fields only, skip `three-stylized` grass generation and its extra surface clone. Retain a sparse row of real low-poly rice-head clumps in the **roadside band only**, visible near the player. Keep all flower fields, farmhouses and scarecrows unchanged. Preserve chunk-level culling/disposal.
4. Prewarm **one representative per shared material and mesh-instancing variant**, rather than forcing a tiny render for every distant Mesh. The same material remains shared across fields. Other geometry can upload when its chunk becomes relevant. This is an A/B experiment: a new first-visible-buffer stall is a rejection.
5. Let the first **nearby drivable road and scenery** unlock Start. Leave the 2–4 km farm chunk/Shader warmup in the original frame-budgeted background queue; do not stall start on it. Legacy mode retains the old gate.
6. `?startupdiag=1` now records `riceRenderer`, remaining **blocking vs background** tasks, cumulative warmup counters and up to two minutes of real driving (frame gaps, approximate FPS by second, draw calls and recorded first-rice stalls). Its timer is optional and off for normal players.

## Verify

- Build first: `npm run build`, `npm test`, and `npx vitest run tests/rice-sea-hybrid.unit.ts`.
- Open Pixel 8 Chrome with the latest `dev`, confirm **`v0.9-coast-r8.8-exp`**.
- **A/B from the same device**:
  - New: `http://192.168.1.106:5180/?rice=hybrid&startupdiag=1`
  - Old: `http://192.168.1.106:5180/?rice=legacy&startupdiag=1`
  - Use the actual running LAN address/port. Both routes use the same standard scenic journey.
- First record cold + warm load for the new renderer under the same browser conditions as Nov 4 baseline. On one run, drive at 200–300 km/h across the first rice area (roughly 2.4–3.0km) **before tapping 匯出啟動紀錄 JSON**, to include moving-playtest statistics.
- Compare same driving viewpoints around ~2.45, ~2.65 and ~2.85km; photograph golden density, texture, wind, edges, scarecrows, and transition to flowers. Compare old `?rice=legacy` photos if in doubt.
- **Success requires both**: much shorter first startup (target <10s as an experiment, not a guaranteed result) and no unacceptable jank, pop-in or uglier rice at normal driving speed. `main` should not be updated until accepted.

## Cautions

- The 2-minute driving trace is the time between browser animation frames; it cannot distinguish actual GPU timing from JS/GC, scheduling, texture upload or network activity. `renderer.info.render.calls` is only the main-scene visible call count.
- Streamer-ready under hybrid does **not** mean far fields are uploaded. Do not interpret early Ready as proof of smooth 2.4km gameplay.
- First-time program compilation and GPU-buffer uploads are browser/device-dependent. Measure on **physical Pixel 8**, not just desktop mobile emulation.
- The rice reference photos are visual inspiration. The accepted style stays low-poly; no new mesh-heavy crop or particle system is added.
- Legacy fallback is deliberate, and the baseline SHA remains an ancestor. Avoid force-pushing dev for rollback.

# COAST R8.8 — Accepted rice-sea renderer / family playtest release

## Human acceptance (2026-11-05, Asia/Taipei)

Owner accepted the Hybrid Rice Sea appearance on physical Pixel 8 and explicitly authorized promotion of the existing `dev` work to `main`. The user observed an obvious improvement in first-load delay. FPS can be revisited later; one captured game frame shows 27 FPS, but the owner reported the previous build was not clearly faster.

The two attached Pixel 8 Chrome traces have `riceRenderer: "hybrid"`, `completed: true`, no `fatal` errors and no blocking readiness tasks at startup-ready. They were collected through the Vite LAN development server, **not** from the production Netlify build.

| Pixel 8 script-init → ready | R8.7 before | R8.8 after | Change |
|---|---:|---:|---:|
| Incognito first load | 22.003 s | 8.157 s | ~63% less time |
| Reload in same context | 22.639 s | 7.994 s | ~65% less time |
| Time spent at 98% | 14.313 / 15.232 s | 0 / 0.086 s | Essentially eliminated |

R8.8 startup is allowed when the near-road and near-scenery chunks are ready. Distant farm chunks and their shader/buffer warmup continue after launch. The new rice look is mostly an opaque textured golden canopy with world-space wind, plus lower-cost near-road rice clumps. Flower fields, scarecrows, farmhouses and driving behavior remain on the original systems.

### Remaining risk and explicit test gap

The two new JSON files were exported **before driving** (`drive.samples = 0`). They do not establish real driving FPS, stable rendering across the entire field, lack of pop-in, or late GPU stalls. The owner supplied a driving screenshot and accepted the visual result, but **27 FPS** is visible in that frame. No baseline-normalized driving FPS comparison was available. Do not describe a performance regression or absence thereof as proven by these files.

Build/unit test execution was **not independently available through this remote GitHub integration**. Do not claim a fresh CI pass or local build from this publish action. If build failure occurs in Netlify, keep the earlier `main` merge commit as the known rollout fallback.

## Post-acceptance cleanup (dev, Nov 5)

The **R8.8 golden rice sea** is now the only production rendering path. The temporary `?rice=legacy` / `?rice=hybrid` URL modes and legacy startup gate were removed from `dev`; historical A/B experiments are retained in Git history, not as live runtime options.

The optional `?startupdiag=1` remains for first-load measurement. New `?fpsdiag=1` measures the driving FPS and CPU breakdown near rice/flower sections; see [COAST_R89_FPS_DIAGNOSTICS.md](COAST_R89_FPS_DIAGNOSTICS.md). No renderer quality settings were changed by diagnostic work.

The November 4 first-load files were exported **before driving**, so they cannot establish farm-region FPS or absence of late Shader/upload stalls. A single Pixel 8 screenshot showed 27 FPS; the new profiler targets this unresolved issue.

## Next phase

- Gather `?fpsdiag=1` JSON after passing the main rice and flower fields, comparing region FPS, CPU timing and (where available) async GPU timer samples.
- Reduce draw calls, improve land-side scene efficiency, and preserve the accepted rice appearance before proposing additional visual changes.
- Preserve the original user's visual references for future fine-tuning.

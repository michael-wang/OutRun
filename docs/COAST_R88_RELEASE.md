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

## Rollback

- Runtime A/B/fallback in the same build: `/?rice=legacy` activates the previous rice construction **and** its slow startup gate. `/?rice=hybrid` (or no rice parameter) is the accepted R8.8 default.
- Full pre-experiment dev tip: `b6a4ad3abd91923cf8f162bce5a730e825ec27be`.
- Previous published main merge commit: `b63ec3bdcad02e24fe8b46d27d5a8f569a063d1f`.
- For a full production rollback, use a follow-up Git revert PR of this release merge on `main`; **never force push** or rewrite main history.
- `?startupdiag=1` is optional. The JSON now carries `riceRenderer` and the first two minutes' drive stats **when exported after driving**.

## Next phase

- Gather driving JSON exported after passing the main rice field, and compare frame-gap spikes / FPS with legacy.
- Reduce draw calls, improve land-side scene efficiency, and preserve the accepted rice appearance before proposing additional visual changes.
- Preserve the original user's visual references for future fine-tuning.

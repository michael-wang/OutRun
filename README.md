# 極速漫遊 (OutRun)

Original Three.js + TypeScript arcade racing game. The first playable stage is **海濱公路** (sunset coast), featuring eight race entrants, AI traffic, a two-thumb mobile control layout, keyboard and PS4 support.

**Play the approved release:** https://michael-wang.github.io/OutRun/

**Before taking work:** read the [Production Pipeline Tracker](docs/PRODUCTION_PIPELINE_TRACKER.md) and [P0 checkpoint / review package](docs/DOT_P0_PILOT_REPORT.md). Michael authorized P0-1–P0-4 and a final Draft PR; P0-1 live issue sync is blocked; P0-2/P0-3/P0-4 have limited independent technical acceptance. The branch is review-ready, paused for Julia’s final report/diff review before push and Draft PR. This temporary stage gate does not revoke the remaining pilot authorization. Historical R7 work orders are on hold.

**Task dispatch:** use the [RESEARCH/SPIKE and PRODUCTION contracts](docs/TASK_CONTRACTS.md); the Riviera 62 example mechanically blocks production.

**Opt-in asset metadata checks:** see the [P0-2 manifest contract](docs/ASSET_MANIFEST_PILOT.md); `npm run assets:check` does not certify art or device acceptance.

## Local development

```powershell
npm ci
npm run dev
```

Use the loopback address printed by Vite. An ordinary visit opens the existing coast and waits for START (or offers the normal saved-race recovery). In development, `?beach2=1&at=4600` opens the accepted Kenting Beach 2 composition before the reveal; `?beach2=1&at=5549` starts alongside the swimmers. `at` is a track station in metres; the HUD reads 350 m less. Effective developer options start driving when ready, bypass ordinary race saves, and restart at the selected station. Unrecognised tracking parameters alone keep the ordinary startup flow. The right stick looks around, R3 returns to chase, and F8 or the photo control takes a screenshot.

`npm run dev` bakes the shoreline caches from the tracked road and terrain sources. The Beach 2 scenery is built from the project's Three.js geometry and stage layouts. A clean checkout shows the explicit classic-car fallback when the private Option B is unavailable. An authorised local workspace can use its existing loopback-only Option B model. The private model and personal preview builds are excluded from Git; public release packaging remains license-gated.

```powershell
# For an authorised private build, stage the approved model first (see docs/OPTION_B_LOCAL_DEMO.md).
$env:OUTRUN_PRIVATE_PREVIEW="1"
npm run verify:dev # authorised private build plus all retained unit tests
npm run build       # TypeScript + Vite, subject to the same packaging gate
npm run test:p0     # minimal deterministic release safeguards
npm run test:p1     # advisory Critical diagnostics
npm test            # all retained unit tests, manually
```

## Project rules

- `dev`: ongoing work. `main`: the last owner-approved public release; no ordinary `dev` deploy.
- **P0 launch/playability blockers prevent release. P1 Critical problems must be reported, but are the owner's decision.** Other issues never delay personal playtests by default.
- Hand-authored finite courses and scenery are the direction. Three.js and Ultra Water stay. Future stages will be created with reusable engine capabilities + stage data rather than another procedural L1/L2/L3 runtime.
- Read [current architecture](docs/CURRENT_ARCHITECTURE.md) for active dependencies and current stage boundaries; [finite-stage resources](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md) for streaming invariants; [agent rules](AGENTS.md) for concise engineering constraints.

Old specifications and reports were removed from the active documentation to reduce AI context noise; Git history preserves earlier versions.


Normal `dev` pushes and draft PR synchronizations **do not auto-run CI**.
For local Codex work, use `npm run verify:dev` before pushing. If a
second independent check is needed, start `Dev checks (manual)` on branch
`dev` from GitHub Actions. Only an owner-approved push to `main`
automatically runs release validation and deployment.

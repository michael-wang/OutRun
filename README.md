# 極速漫遊 (OutRun)

Original Three.js + TypeScript arcade racing game. The first playable stage is **海濱公路** (sunset coast), featuring eight race entrants, AI traffic, a two-thumb mobile control layout, keyboard and PS4 support.

**Play the approved release:** https://michael-wang.github.io/OutRun/

**Before taking work:** read the [Production Pipeline Tracker](docs/PRODUCTION_PIPELINE_TRACKER.md) and [P0 checkpoint / review package](docs/DOT_P0_PILOT_REPORT.md). Michael authorized P0-1–P0-4 and a final Draft PR; P0-1 live issue sync is blocked; Julia’s independently delegated P0-2 tooling checkpoint is paused for review before further work. This temporary stage gate does not revoke the remaining pilot authorization. Historical R7 work orders are on hold.

**Opt-in asset metadata checks:** see the [P0-2 manifest contract](docs/ASSET_MANIFEST_PILOT.md); `npm run assets:check` does not certify art or device acceptance.

## Local development

```powershell
npm ci
npm run dev -- --host 0.0.0.0
```

Use the LAN address printed by Vite for mobile device playtesting (subject to firewall). The active supported query parameters are `fpsdiag`, `startupdiag`, `at`, `trafficSeed` and `rivaldebug`. Retired lab/showcase URLs are not product features.

```powershell
npm run verify:dev # before pushing to dev: build + all retained unit tests
npm run build       # TypeScript + Vite
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

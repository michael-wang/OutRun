# 極速漫遊 (OutRun)

Original Three.js + TypeScript arcade racing game. The first playable stage is **海濱公路** (sunset coast), featuring eight race entrants, AI traffic, a two-thumb mobile control layout, keyboard and PS4 support.

**Play the approved release:** https://michael-wang.github.io/OutRun/

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

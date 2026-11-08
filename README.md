# Project OutRun

A local Three.js and TypeScript arcade driving game with keyboard, controller, and mobile controls.

## Branches

- `main`: human-approved stable family-playtest build, currently **COAST R8.8**.
- `dev`: ongoing **R9.1 sunset-coast** development (scenery refinement; shadow/performance diagnostics available but paused).

Codex commits and pushes completed milestones to `dev`. Promote a version to `main` only when the owner explicitly approves it. Previous branch tips are retained as `archive/codex/*` Git tags. The historical documentation and reviews are in `docs/`; pre-consolidation versions of conflicting documents are also in `docs/archive/`.

## Current architecture decision

**Finite levels, finite resource budgets.** 極速漫遊 does not target an infinite road/world. Each authored stage has bounded geometry, textures and draw/CPU budgets; designed transition-buffer segments safely retire previous-stage resources and prepare the next. The incremental Scene Resource Pipeline plan (P0 task scheduling, P1 road/scenery priorities, P2 asset sharing and flower fields) is in [ADR-009](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).

## Run locally

### GitHub Pages production preview

The production workflow builds and tests the project-site path on `dev`. An approved push to `main`, or a manual workflow run on `main`, publishes `dist/` to GitHub Pages using the **GitHub Actions** publishing source. Netlify and ordinary local builds use the default root path.

To preview the Pages build in a separate PowerShell session:

```powershell
$env:OUTRUN_SITE_BASE = '/OutRun/'
npm run build
npm run preview
# Open http://127.0.0.1:4173/OutRun/
```

### Development server

From the repository directory, install dependencies if needed and start the development server:

```powershell
npm ci
npm run dev -- --host 0.0.0.0
```

Open the local URL printed by Vite. A phone on the same network can use the printed network URL if the firewall permits it. The development entry is now **the sunset coast** at `/` (or the local Vite network URL). There are only three supported query parameters: `?fpsdiag=1` for an optional FPS JSON export, `?startupdiag=1` for optional startup measurements, and `?at=6500` to begin near that route distance. These can be combined. Old `showcase`, `qa`, shadow overrides, and automatic performance benchmark URL modes are retired; scene and driving visuals are unchanged unless explicitly edited.

```powershell
npm run build
npm test
npm run test:e2e
```

See [R8.8 release](docs/COAST_R88_RELEASE.md) for the accepted stable version, [ADR-009](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md) for resource policy, and [R9.0 P0 handoff](docs/R90_P0_SCENE_TASK_HANDOFF.md) for the current performance milestone.

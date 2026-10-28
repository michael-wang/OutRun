# Project OutRun

A local Three.js and TypeScript arcade driving game with keyboard, controller, and mobile controls.

## Branches

- `main`: human-approved stable version, currently v0.8.5.
- `dev`: latest development version, currently v0.9, awaiting human Road Trip playtesting.

Codex commits and pushes completed milestones to `dev`. Promote a version to `main` only when the owner explicitly approves it. Previous branch tips are retained as `archive/codex/*` Git tags. The historical documentation and reviews are in `docs/`; pre-consolidation versions of conflicting documents are also in `docs/archive/`.

## Run locally

From the repository directory, install dependencies if needed and start the development server:

```powershell
npm ci
npm run dev -- --host 0.0.0.0
```

Open the local URL printed by Vite. A phone on the same network can use the printed network URL if the firewall permits it. The v0.9 Road Trip on `dev` is available at `/?trip=10m&seed=1`; the original short Stage is at `/?stage=1&seed=1`.

```powershell
npm run build
npm test
npm run test:e2e
```

See [v0.8.5 handoff](docs/V0.8.5_HANDOFF.md) for the stable release and [v0.9 handoff on `dev`](https://github.com/michael-wang/OutRun/blob/dev/docs/V0.9_HANDOFF.md) for the long-drive recordings, test results, and remaining device checks.

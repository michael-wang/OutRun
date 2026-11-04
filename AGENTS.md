# Project OutRun — working agreement

## Branches and releases

- `main` is the latest human-approved, playable stable version.
- `dev` is the latest development version. Work directly on `dev`; do not create additional permanent branches.
- At the end of each authorized Codex milestone, run appropriate checks, commit the completed work, and push `dev` to GitHub.
- Promote a version to `main` and push only after the owner explicitly approves that version. Preserve history; do not force-push.
- Do not discard uncommitted work. Before deleting an old version branch, tag its exact tip, push the tag, and verify that the remote archive is restorable.
- `archive/codex/*` tags preserve the previous development-branch tips. Historical specifications, handoffs and human reviews remain in `docs/`; conflicting pre-consolidation documents are preserved in `docs/archive/` and in Git history.

## Product architecture: finite stages, bounded assets (accepted)

Read **[docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md)** before modifying any level/scenery streaming, GPU warmup, resource lifetime, or stage transitions.

- **No infinite-world requirement.** 極速漫遊 is a journey of finite, authored levels. Each level must have a bounded resource budget. Scenic composition is constrained by that budget.
- **Stage-transition buffers** intentionally provide time to retire previous-stage resources and prepare the next stage, with at most a measured, bounded overlap. The next stage's drivable road remains the highest safety priority.
- Build-time scene baking and resource sharing are encouraged for authored stages; keep procedural runtime generation only where it improves gameplay.
- Implement the Scene Resource Pipeline incrementally: P0 task attribution / oversized-work control → P1 stage-scoped road/scenery priority windows → P2 shared resources and hybrid flower fields. Do not rewrite all systems in one PR.
- Do not optimize by removing user-approved golden rice fields or Ultra-Water visuals without device A/B evidence. Use `?startupdiag=1` for startup and `?fpsdiag=1` for driving on physical Pixel 8.

## Scope and verification

The owner authorizes each development milestone. Preserve accepted driving behavior, input controls, screenshot archives, telemetry and human reviews unless the owner explicitly requests a change. Work only in this repository; do not deploy publicly or modify other projects without separate authorization. Test actual gameplay as appropriate and clearly distinguish browser emulation from physical-device results.

Current state (2026-11-05): `main` contains human-approved COAST R8.8 with the hybrid golden rice sea and faster startup; `dev` is authorized for the staged R9.0 Scene Resource Pipeline work, starting with P0 task-latency attribution. See `docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md` and `docs/R90_P0_SCENE_TASK_HANDOFF.md` (once created). No public promotion without separate owner approval.

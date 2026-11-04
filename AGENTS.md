# Project OutRun — working agreement

## Branches and releases

- `main` is the latest human-approved, playable stable version.
- `dev` is the latest development version. Work directly on `dev`; do not create additional permanent branches.
- At the end of each authorized Codex milestone, run appropriate checks, commit the completed work, and push `dev` to GitHub.
- Promote a version to `main` and push only after the owner explicitly approves that version. Preserve history; do not force-push.
- Do not discard uncommitted work. Before deleting an old version branch, tag its exact tip, push the tag, and verify that the remote archive is restorable.
- `archive/codex/*` tags preserve the previous development-branch tips. Historical specifications, handoffs and human reviews remain in `docs/`; conflicting pre-consolidation documents are preserved in `docs/archive/` and in Git history.

## Scope and verification

The owner authorizes each development milestone. Preserve accepted driving behavior, input controls, screenshot archives, telemetry and human reviews unless the owner explicitly requests a change. Work only in this repository; do not deploy publicly or modify other projects without separate authorization. Test actual gameplay as appropriate and clearly distinguish browser emulation from physical-device results.

Current state: `main` contains human-approved v0.8.5; `dev` includes the owner-requested COAST-SUNSET-R7 scenery pass and awaits human coastal/phone playtesting. The v0.9 Road Trip human review remains pending. See `docs/COAST_R7_HANDOFF.md`. Do not begin another milestone without the owner's request.

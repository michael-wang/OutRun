# Codex autonomous kickoff — v0.2 Driving Is a Game

**Continue the existing playable v0.1. This is not a greenfield project.**

## Before starting
- Repository: `michael-wang/OutRun`, local `C:\astra-dev\OutRun`. Verify git remote/branch/status.
- The v0.1 **source code is on a local `codex/first-drive` branch** as reported by the previous Codex run, while remote `main` currently contains requirements documents. Do **not** reset to `main` or replace the working car/road implementation.
- Integrate the new v0.2 documentation commit from `origin/main` into the **playable local branch**, after ensuring local work is committed or otherwise safely preserved. Easiest on a clean, compatible feature branch: `git fetch origin` followed by `git cherry-pick <V0.2_DOCS_COMMIT_SHA>`. If this is not appropriate for your branch history, copy **only** `AGENTS.md` and the four new v0.2 docs from `origin/main` while preserving code, resolve conflicts carefully and continue.
- Create a new v0.2 development branch from the playable v0.1 branch if useful. Do not merge or push without human approval.

## Paste into a **new Goal** in the existing Codex Local OutRun project

```text
/goal Upgrade the EXISTING playable Project OutRun v0.1 to v0.2 Driving Is a Game without rebuilding it. Read AGENTS.md, docs/V0.2_SPEC.md, docs/V0.2_ACCEPTANCE.md and docs/PIXEL8_PLAYTEST.md. P0 driving: road curvature must not steer the car; neutral steering at speed through left and right bends must result in off-road departure and speed penalty, while deliberate steering can stay on the same road and recover after leaving it. Preserve independent gas/brake and recoverable drift. P0 phone: Pixel 8 landscape true fullscreen after user tap, gracefully handled orientation lock, installable fullscreen/landscape PWA manifest + icons, safe areas, and simultaneous two-thumb input including persistent left/right swap. P1: remove speed-based FOV/dolly zoom, improve chase-car scale and scenery-based speed, build a pronounced climb/crest/descent, improve bright arcade contrast without starting a new game. Autonomously run and inspect the actual browser game; add paired hands-off/steered driving regressions for BOTH turn directions, verify off-road drag, fullscreen success/error handling, mobile touch and PWA metadata. Run build/unit/Playwright tests and inspect desktop/landscape mobile screenshots. Do not claim real Pixel hardware testing unless connected; mark it UNVERIFIED and provide the USB/ADB test steps when unavailable. Produce docs/V0.2_HANDOFF.md listing actual PASS/FAIL/UNVERIFIED evidence and known issues. Do not merge to main, deploy publicly, touch TopWar or start v0.3. Stop after v0.2 for human review.
```

Use the actual Codex Goal Mode rather than sending a regular chat containing the word `/goal`. If a workspace update step is needed, have Codex do that safely first, then submit the Goal after the docs exist locally.

## What counts as success?
A human must **steer through turns**, off-road reduces speed, drift remains recoverable, camera never zooms according to speed, and the app is designed to run in immersive **landscape on Pixel 8**. Desktop emulation cannot prove real-device PWA/fullscreen success; label the remaining phone checks honestly. No new opponents, races, leaderboards or extra content until these pass.

When v0.2 is ready, stop and hand over a playable local URL, screenshots, test evidence and `docs/V0.2_HANDOFF.md` for Michael's playtest.

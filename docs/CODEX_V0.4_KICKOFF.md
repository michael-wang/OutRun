# Codex v0.4 — autonomous arcade handling and rhythm

The user explicitly accepted **1.75× as the new default pace**, requested less-sensitive turning, exact desktop keyboard mapping, and a visible major speed HUD. The previous deferred bundle **drift and arcade road rhythm** is now in v0.4 scope. Convertible/passenger reactions and scenic biomes remain later milestones.

## Critical local-vs-remote state

- The latest playable **v0.3.2 is on the user's local Windows machine** at `C:\astra-dev\OutRun`, with commits `43fba35` (code) and `cd36798` (handoff); check actual latest local HEAD.
- Remote GitHub `main` has milestone documentation and is **not a substitute for the game source**. Do not merge, reset, checkout or reclone main over local game code.
- As part of the same autonomous handoff: verify repository/cleanliness, safely create `codex/v0.4-arcade-handling` from playable HEAD (preserve unexpected changes), fetch `origin/main` and **selectively restore only** `AGENTS.md`, `docs/V0.4_SPEC.md`, `docs/V0.4_ACCEPTANCE.md` and `docs/CODEX_V0.4_KICKOFF.md` from latest `origin/main` into this development branch. Keep previous app/feature files.
- Work locally: no push, merge to main, public deployment, paid services or edits to TopWar.

## Goal authorization reminder

Prior Codex auto-approval sometimes treats an earlier "stop after vX" as binding despite a new Goal. A "stop" marks the end of **that version**, not a permanent ban. If requested, user can send the following in an ordinary chat (not /goal), then restart/resume the Goal:

`I authorize Project OutRun v0.4 Arcade Handling & Rhythm, superseding the earlier stop-after-v0.3.2 instruction. You may create a local feature branch, import only v0.4 specs and AGENTS.md, implement, test and commit v0.4 within the OutRun workspace. Do not push, merge, deploy or edit any other repo.`

## Paste into actual Codex Goal Mode

```text
/goal Continue the EXISTING playable Project OutRun v0.3.2 to v0.4 Arcade Handling & Rhythm, with 1.75x arcade world pace accepted as the default. First verify remote, local playable HEAD and clean status; create codex/v0.4-arcade-handling from the existing game, fetch origin/main and selectively import AGENTS.md plus docs/V0.4_SPEC.md, docs/V0.4_ACCEPTANCE.md and docs/CODEX_V0.4_KICKOFF.md; do NOT merge documentation-only main or overwrite game source. Read those specs. P0: fix excessive steering sensitivity at 1.75x by inspecting/measuring steer ramp, yaw and lateral road offset; light taps give small accurate corrections and sustained steering still takes sharper bends, with no road-follow or hidden lane assist. P0: PC driving keys are A/D steer, Space held gas, Enter held brake; handle focus, default Space/Enter browser behavior, concurrent key holds and releases; preserve Pixel 8 independent touch and long-press fixes. P0: redesign HUD so a bold high-contrast arcade km/h speed display is prominent and readable on Pixel and desktop, away from the road's forward view/controls. P1 after P0: intentional recoverable arcade drift with more visible car sideways yaw (~20-40 degrees at strong drift), but no routine squeal from gentle steering; add hysteresis and actual slip-based audio. P1: road beat map at nominal fast 1.75x — 6-7s easy acceleration, 3-5s exciting bend, 6-7s breather, 3-5s exciting bend, 2-3s dangerous corner, 3-5s recovery — authored as distance segments, not an elapsed-time timer. Independently run actual browser drive and motion screenshots/videos, tune controls and track together, regression-test default pace/offroad bounded shoulders/no auto-steer/Pixel fullscreen-PWA/touch, then run production build, unit and Playwright suites, fix issues, commit locally and create docs/V0.4_HANDOFF.md with measured before/after steering, HUD screenshots, video, segment map, PASS/FAIL/UNVERIFIED and local play URL. Do not implement new convertible/passenger assets or scenic transitions now; do not push, merge, deploy, touch TopWar or start v0.5. Stop at v0.4 for human playtest.
```

## What the user should see when v0.4 is handed off

- Speed still feels fast at accepted 1.75×, but direction controls feel precise enough on Pixel 8.
- On desktop A/D + Space/Enter work, with no accidental UI activations.
- Speed HUD is unmistakable and readable, yet doesn't hide the racing road.
- Tire squeal happens on hard/slipping cornering, and the car visibly yaws during an intentional drift.
- Track beats alternate speed enjoyment and tense corners, without arbitrary steering twitchiness.

User judges the subjective handling and fun. Automated tests and screenshots are evidence, not an assertion that subjective arcade quality is solved.

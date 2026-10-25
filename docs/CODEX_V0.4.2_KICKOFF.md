# Codex — v0.4.2 Gameplay-First Driving Prototype

**This replaces the older, UNEXECUTED v0.4.2 Corner Exit & Road Rhythm draft.** The product owner explicitly chose a different core model and wants the next delivered version to prove it PLAYABLY. Do not re-use an older Goal from another chat.

## Local starting state

- Windows checkout `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`.
- Latest existing playable base: local v0.4.1 implementation `4d4b05c` and handoff `34b6a3e` (verify actual local HEAD; preserve any later work).
- GitHub origin/main is primarily documentation. **Never merge/reset/checkout the game checkout onto documentation-only main.**
- Codex should inspect git status/remotes, create `codex/v0.4.2-gameplay-first` from playable local HEAD, fetch origin/main, selectively import current `AGENTS.md`, `README.md`, `docs/V0.4.2_SPEC.md`, `docs/V0.4.2_ACCEPTANCE.md`, `docs/CODEX_V0.4.2_KICKOFF.md` and `docs/ARCADE_DESIGN_BACKLOG.md`. Protect uncommitted source; don't copy obsolete v0.4.2 drafts.
- The earlier "stop after v0.4.1" refers to a completed milestone. If auto-review insists, a normal-chat explicit authorization can supersede it; do not work around actual denied permissions.

### Optional normal-chat authorization

`I authorize the new Project OutRun v0.4.2 Gameplay-First Driving Prototype, replacing the earlier unexecuted v0.4.2 draft and superseding the prior stop-after-v0.4.1 instruction. You may safely branch from my current playable OutRun code, selectively integrate the new v0.4.2 documents, implement and test, and commit locally. Do not push, merge, deploy or touch another repo.`

## READY-TO-PASTE NEW GOAL

```text
/goal Implement Project OutRun v0.4.2 Gameplay-First Driving Prototype ON THE EXISTING playable v0.4.1 local code, replacing the previous unexecuted v0.4.2 plans. Verify git remote/status and preserve playable HEAD 4d4b05c/34b6a3e or later; create codex/v0.4.2-gameplay-first from that HEAD. Fetch origin/main and selectively restore ONLY latest AGENTS.md, README.md, docs/V0.4.2_SPEC.md, docs/V0.4.2_ACCEPTANCE.md, docs/CODEX_V0.4.2_KICKOFF.md and docs/ARCADE_DESIGN_BACKLOG.md; do not replace source with documentation-only main. Read docs. Primary goal: REAL playable Gameplay-First Track + Arcade Lateral Balance driving. Replace yaw/slip momentum-driven path control with road-relative s (progress) and x (lateral offset) where curve outward pressure and player effective steering correction oppose each other; neutral on straight freezes x, but hands-off curve pushes x outward; no automatic road centering or free lane-keeping. Preserve 1.75x world pace and bounded off-road speed penalty. Quantize the existing continuous-looking phone strip and PC A/D virtual steering to neutral + FOUR active levels per side (±0.25/0.5/0.75/1) with tunable step count, center dead zone and small hysteresis for finger jitter; preserve touch swap, simultaneous gas/brake and PC Space/Enter. Define challenge SEGMENTS FIRST by desired required-steering at ~230 km/h, road width, duration/length and optional elevation; INVERT this demand into curvature and generate real continuous 3D road (not label arbitrary splines afterward). One ~60–90s replayable course must let the owner drive LOW ~0.25, MEDIUM ~0.5, HIGH ~0.75, TOO-FAST >1.0 requiring brake at reference speed, plus one signed S-CURVE; both left/right directions. Show each stage truly playable. For each normal bend record no-steer versus matching notch; at too-fast record full-steer high-speed failure versus player-achievable brake+steer success; at straight exit neutral must not carry unwanted drift. Keep fixed camera/car-left needle gauge, Pixel 8 fullscreen/PWA/two-thumb long-press safeguards, original scenery and no road gaps/occlusion; run ≥120s rendered road continuity check. Work autonomously, run real browser game and visually inspect recorded five-challenge gameplay, test keyboard/mobile control, build/unit/Playwright, fix failures, commit locally, write docs/V0.4.2_HANDOFF.md with measured calibration, actual videos/screenshots, PASS/FAIL/UNVERIFIED, known limits and exact Pixel 8 URL. No push, merge, public deployment, TopWar edits, editor, DDA director, car variants, rivals or v0.5. Stop for human playtest.
```

## What constitutes success

A runnable phone/PC v0.4.2 lets the player *feel the difference* between single-notch easy bend, two-notch middle bend, three-notch hard bend, too-fast bend requiring slowing, and an S-curve — all using the same consistent simplified driving mechanism. Actual gameplay has **no secret autopilot** and recovers immediately when the curve ends and steering is neutral.

Tests and design documentation are evidence, **not** the finished artifact. If any stage is not actually drivable, report it honestly and improve before calling milestone done.

# Codex kickoff — v0.4.1 Arcade Rescue

**The user has rejected v0.4 driving feel and reported a road discontinuity. This is a focused regression hotfix, not general v0.5.**

## Source of truth and branch preparation

- The existing **playable** v0.4 is on the user's LOCAL OutRun checkout at `C:\astra-dev\OutRun`, reported commits `04a1f2b` implementation and `ba76b22` handoff. Verify actual local HEAD and preserve later work.
- GitHub remote `main` only contains planning/specification documents; do not replace game with it, hard reset, merge the entire main tree or repeat v0.1 scaffolding.
- In the authorized workspace, Codex should independently verify git status and remote, create `codex/v0.4.1-arcade-rescue` from playable local HEAD, fetch `origin/main`, and bring in **only** `AGENTS.md`, `docs/V0.4.1_SPEC.md`, `docs/V0.4.1_ACCEPTANCE.md` and `docs/CODEX_V0.4.1_KICKOFF.md`. Preserve existing source and user modifications.
- Prior stop-after-v0.4 means pause for review, not ban user-authorized v0.4.1. If Codex's approval system needs direct confirmation, user can authorize in a **normal chat**, separate from `/goal`:
  `I explicitly authorize Project OutRun v0.4.1 Arcade Rescue, superseding the earlier stop-after-v0.4 instruction. You may create a local feature branch, selectively import v0.4.1 specs, modify/test the OutRun game and commit locally. Do not push, merge, deploy or edit another repository.`

## Paste into an actual Codex Goal (after ordinary authorization if needed)

```text
/goal Fix Project OutRun v0.4 gameplay regression in the EXISTING playable local game as v0.4.1 Arcade Rescue. First verify C:\astra-dev\OutRun remote/status and preserve local v0.4 source (04a1f2b, ba76b22 or later), create codex/v0.4.1-arcade-rescue from playable HEAD, fetch origin/main and selectively bring in AGENTS.md and docs/V0.4.1_SPEC.md, docs/V0.4.1_ACCEPTANCE.md, docs/CODEX_V0.4.1_KICKOFF.md without overwriting game source. Read these docs. P0 HANDLING: diff/measure v0.3.2 vs v0.4 input/yaw/slip, find why early steering is sluggish but post-release drift/overshoot continues; restore immediate precise arcade steering and fast decay of uncommanded yaw while keeping strong sustained cornering, 1.75x world pace, deliberate player steering and bounded off-road punishment. Do not auto-center or auto-follow the road. P0 ROAD: investigate the user's visibly interrupted/ending road, reproduce using long fast driving and inspect spline/mesh/segment loop/culling/streaming; fix root cause, test ≥120s at 1.75x with real rendered-browser frame inspection. If not reproduced, report UNVERIFIED rather than claiming fixed. P0 HUD: replace the v0.4 top-right rectangular speed number with an ORIGINAL analog needle dial and digital km/h integrated LEFT OF THE CAR, responsive for desktop and Pixel 8 landscape, with no steering-thumb overlap. Preserve desktop A/D steering + Space gas + Enter brake, Pixel 8 fullscreen/PWA/two-thumb/long-press fixes, fixed chase camera and existing sound. No new tracks, cars, traffic, visual themes or v0.5. Work autonomously: run real game, inspect driving clips, tune/fix, write deterministic steering/track/HUD regressions, run build/unit/Playwright, capture desktop/mobile screenshots and road-through-loop video, then local commit and docs/V0.4.1_HANDOFF.md with evidence and PASS/FAIL/UNVERIFIED. Do not push, merge, deploy, modify TopWar or falsely mark a missing-road bug solved without verification. Stop for human playtest at v0.4.1.
```

## Required delivery

- Local playable v0.4.1, genuine video evidence of corner entry/release/reversal and long road drive, car-left analog speedometer/screenshots.
- Tests: full build + unit + Playwright and deterministic response/surface checks.
- `docs/V0.4.1_HANDOFF.md`: code root causes, before/after steering logs, exact road-gap verification, any outstanding issues, local URL and commit.
- Stop for human acceptance, not v0.5. No subjective "fun" claims from green tests alone.

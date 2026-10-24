# Codex autonomous kickoff — v0.3 Arcade Velocity

## Important: start from v0.2.1 local game code

User's latest Codex delivery: v0.2.1 committed locally as `9bdc6d8` and clean; it contains long-press browser protection and the bounded off-road corridor. The remote GitHub `main` contained documentation only when this v0.3 brief was committed. **Never replace, reset or re-clone over the playable v0.2.1 checkout.**

Workflow for Codex (do these engineering chores autonomously):
1. At `C:\astra-dev\OutRun`, inspect `git remote -v`, `git status --short`, branch and recent log. Check the game source and `9bdc6d8` are present. Preserve any later work; never force-discard.
2. From the current playable HEAD, create `codex/v0.3-arcade-velocity` (or use a safe existing matching feature branch).
3. Fetch `origin/main`, then integrate **only** the v0.3 documentation commit `<V0_3_DOCS_COMMIT_SHA>` (cherry-pick if compatible); or restore only these new docs and `AGENTS.md` from origin/main if history conflicts. Resolve conflict without losing app code. **Do not merge remote main onto the local game blindly.**
4. Confirm `docs/V0.3_SPEC.md` and `docs/V0.3_ACCEPTANCE.md` now exist locally. Start the Goal below; do not revert to v0.2 kickoff.

## Paste into an actual Codex Goal in the OutRun Local project

```text
/goal Upgrade the EXISTING playable Project OutRun v0.2.1 to v0.3 Arcade Velocity without rewriting its engine, and read AGENTS.md, docs/V0.3_SPEC.md and docs/V0.3_ACCEPTANCE.md. P0 priorities are 1) bold car-and-road framing and 2) unmistakable high-speed motion. Use the user-reference ratios: current car about 12% of screen width versus OutRun 2 about 25%; on Pixel 8 landscape aim about 20–25% car width, lower in the frame and with plenty of readable road ahead, adjusting a FIXED chase-camera FOV/distance/height rather than speed-based zoom. Reduce oversized top HUD to a compact Pause/Menu while preserving two-thumb safe-area controls, fullscreen, PWA and layout swap. Make 80 vs 200-style driving speeds genuinely look different by auditing world travel distance, roadside props, lane markings, parallax and engine response. Show actual browser motion clips for acceleration and low/high speed, not just a speed HUD or static screenshot. After satisfying P0, P1 increase arcade curve density/strength with an S-bend, sharper corner and crest so maintaining high average speed requires braking/steering skill; retain v0.2.1 bounded off-road penalty and NO auto-road-follow. P2 optional bonus is ONE scenic theme transition only if P0/P1 fully work. Preserve long-press touch fix, Android Pixel 8 landscape/fullscreen, two-thumb controls, sound and all regressions. Independently run the app, visually inspect desktop/Pixel-like screenshots plus motion recordings, fix defects, run build/unit/Playwright suites and supply docs/V0.3_HANDOFF.md with PASS/FAIL/UNVERIFIED evidence and local URL. Work only on a branch from the v0.2.1 playable HEAD; no push, merge, public deployment, TopWar edits or v0.4. Stop for human playtest.
```

## User handoff

The milestone is NOT done when speed text says a larger number, nor when the car image gets bigger while the road becomes unusable. Codex must demonstrate both composition and **moving speed** in a running browser, show evidence, protect Pixel 8 input and off-road behavior, and leave the program locally playable for Michael's review.

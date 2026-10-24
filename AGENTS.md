# Project OutRun — Codex operating rules

## Active milestone: v0.3.2 Arcade Pace Experiment

The user reviewed the v0.3.1 game and the OutRun 2 reference side by side. **Perceived speed is still unacceptable; this is a product go/no-go issue.** The v0.3.1 stop-for-review instruction is superseded by the newly authorized v0.3.2 work, not by an authorization to continue into unrelated future milestones.

Read `docs/CODEX_V0.3.2_KICKOFF.md`, `docs/V0.3.2_PACE_EXPERIMENT.md`, `docs/V0.3.2_ACCEPTANCE.md`, then the existing `docs/V0.3.1_HANDOFF.md` if available and earlier gameplay specifications as needed. `docs/ARCADE_DESIGN_BACKLOG.md` contains **future-only** drift/track/convertible/scenery ideas: do not implement them now.

## Workspace and history

- Work in `C:\astra-dev\OutRun` and verify git remote `michael-wang/OutRun`. NEVER modify `C:\astra-dev\topwar`.
- The most recent playable v0.3.1 build exists in the user's **local repository**, with implementation commit `ef93e41` and handoff commit `df0782f`. GitHub remote `main` presently contains documentation only. Do not check out, merge, reset or re-clone remote `main` over the playable game.
- Safely create `codex/v0.3.2-arcade-pace` from the latest playable HEAD. Preserve and report any unexpected uncommitted changes before altering files; never discard work. Fetch `origin/main` and import **only** v0.3.2 docs and this AGENTS.md into that local branch. Do not push, merge or deploy.
- For a permission or goal continuation concern, use the user's normal-chat authorization and actual Codex policy; do not repeatedly trigger a denied action or bypass security.

## Autonomous implementation and verification

- Inspect the actual v0.3.1 movement integration and measurements before coding. Existing measured movement at 234 km/h was approximately **64.92 world meters/second**, so a stock Three.js speed ceiling is not the supported explanation.
- Implement a **consistent arcade world-pace multiplier** on real forward/world travel, not a disconnected animation of roadside objects. **1.75× high-speed pace is the first default experiment**; provide reproducible 1.0×/1.5×/1.75×/2.0× variants for playtesting.
- Apply boost smoothly as speed rises; low-speed driving must remain intelligible. Maintain car world pose, spline road projection, shoulder/collision tests, audio/FX and camera coordination. Never secretly auto-steer.
- Avoid camera speed zoom/FOV changes, artificial HUD speed inflation, isolated background scroll, engine rewrite, scenery expansion, road generation rewrite, new vehicle, new gameplay systems and unrelated UI changes. A fixed-FOV framing change is optional only as a separate proven follow-up with car/frame occupancy preserved.
- Run real game, inspect actual moving comparisons, tune high-speed steering only if necessary for recoverability, then rerun tests; work autonomously on routine tasks.
- Preserve v0.3.1 two-thumb Pixel 8 input, landscape fullscreen/PWA, long-press prevention, bounded off-road shoulder, off-road penalty, pause/mute and fixed follow camera. No new paid dependencies or licensed SEGA/Ferrari content.

## Deliver

Run build/unit/Playwright and record honest PASS/FAIL/UNVERIFIED. Create `docs/V0.3.2_HANDOFF.md` with branch/commit, exact local phone/browser URLs for speed variants, source-code changes, measured movement and marker-rate comparison at each pace, real clips, screenshot review, frame timing, regressions and limits.

Human acceptance is mandatory. **Stop after v0.3.2 and ask the user to choose GO or NO-GO on speed.** No automatic v0.4 or backlog implementation.

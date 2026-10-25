# Project OutRun — Codex working agreement

## ACTIVE milestone: v0.4.2 Gameplay-First Driving Prototype

**The previous v0.4.2 "Corner Exit & Road Rhythm" was designed but NOT handed off for implementation.** This revised owner-approved v0.4.2 completely supersedes that draft. DO NOT execute an older v0.4.2 Goal or merely tune the existing car yaw model.

Read in order:
1. `docs/CODEX_V0.4.2_KICKOFF.md`
2. `docs/V0.4.2_SPEC.md`
3. `docs/V0.4.2_ACCEPTANCE.md`
4. `docs/ARCADE_DESIGN_BACKLOG.md` only for later work.

## Working tree protection

- Confirm `C:\astra-dev\OutRun` and git remote `michael-wang/OutRun`. NEVER touch `C:\astra-dev\topwar`.
- The latest playable **v0.4.1** exists on the user's LOCAL repository with implementation commit `4d4b05c` and handoff commit `34b6a3e`. As last checked, GitHub `main` contains project specifications, **not the playable app**. Do not switch/reset/merge documentation-only main over working game code.
- Preserve unexpected local changes. Create `codex/v0.4.2-gameplay-first` from the latest playable local HEAD. Fetch `origin/main` and selectively import ONLY current `AGENTS.md`, `README.md` and `docs/V0.4.2_*.md` plus `docs/ARCADE_DESIGN_BACKLOG.md`, after checking for conflicts. Don't discard local handoffs/code.
- For an auto-review conflict with an older "stop after v0.4.1" instruction, get explicit **ordinary chat** authorization, not a loop of rejected Goal retries. Respect sandbox approvals.
- No push, merge, public deployment, paid services, unlicensed SEGA/Ferrari assets, or modifications outside OutRun.

## Product and engineering contract

**Goal: a playable, deliberately designed challenge course, not a grand system diagram.**

- Replace the existing yaw/slip-driven core navigation with a small **Arcade Lateral Balance** road-relative model: road bend demands outward lateral drift, and player's steering level counters it. No accumulation of uncontrolled yaw/lateral inertia into the next straight. Don't simulate real tire forces or use physics engine.
- Inputs remain continuous-looking, but effective steering is **quantized**: first experiment has neutral and four steps on each side (±0.25, ±0.50, ±0.75, ±1.00), with adjustable step count behind a simple configuration. A center dead zone and boundary hysteresis reduce annoying fingertip jitter. Mobile horizontal absolute-position strip and PC A/D virtual wheel remain, with Space gas/Enter brake and touch-hand swap.
- Build track **from required steering demand at a reference speed**: low/mid/high and >100%-at-reference requiring braking. This is genuine inverse difficulty-to-geometry design, NOT hand drawing curvy mesh then assigning labels afterward.
- Deliver one short playable continuous course: low, medium, high, mandatory slow-down, plus **one reversible S-curve**. Each segment's actual required steering is tested against input steps, road width and speed. The course and scenery must render in genuine Three.js 3D without holes and stay drivable when looped.
- Preserve human-approved `1.75×` world pace, 3D car/road/frame scale, car-left analog speedometer, Pixel 8 landscape/fullscreen/PWA/long-press safeguards, bounded shoulder/off-road speed penalty, no automatic lane centering or hidden "drive the bend" helper, audio/pause.
- Keep modules/data small; avoid new authoring editor, procedural open world, RL driver, adaptive-difficulty director, traffic, other cars, new biomes, vehicle art, or unrelated UI overhaul in this milestone.

## Definition of done

Codex must **run the game in a real browser**, demonstrate the five challenges with actual recorded steering+brake behavior, and show that:
1. no-steering fails a meaningful curve;
2. a matching discrete level balances representative low/mid/high curves near the reference speed;
3. on the hardest curve full lock at reference speed is **insufficient**, but slowing down makes the same curve controllable;
4. after a curve ends and steering returns neutral, lateral position doesn't keep drifting from an old input;
5. the generated path, elevated roadway, off-road boundaries and render mesh agree across loops.

Test deterministic driving logic AND real rendered browser input, including Pixel-like multitouch. Run `npm run build`, `npm run test` and `npm run test:e2e`, visually inspect screenshots/video, fix failures, and create `docs/V0.4.2_HANDOFF.md` with observed PASS/FAIL/UNVERIFIED, source changes, inverse-calibration proof, playable links and known issues.

**Stop after v0.4.2 for human playtest.** This ends this milestone, not future owner-approved work.

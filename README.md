# Project OutRun

**An original browser-based 3D arcade racing game inspired by the *experience* of classic Out Run and OutRun 2 — not a licensed SEGA remake.** `Project OutRun` is an internal codename; `SUNSHIFT GT` remains an uncleared public-name candidate. Use original/license-cleared art and sound, not protected cars/logos/music/game assets.

## CURRENT milestone: v0.4.2 — Gameplay-First Driving Prototype

**The older, not-yet-executed v0.4.2 "Corner Exit & Road Rhythm" specification has been REPLACED.** The owner now wants a real playable experiment demonstrating an intentional **gameplay-first paradigm shift**:

- **Driving rule:** arcade road curvature pushes the car toward the outside, the player's steering correction counters it; if demand exceeds maximum correction, the driver must slow down. When the bend ends and steering is neutral, no latent yaw/slip should continue moving the car laterally.
- **Discrete steering control:** continuous-looking phone horizontal strip and keyboard virtual wheel; underlying effective input has neutral plus four levels each side (±0.25/0.5/0.75/1.0). Dead zone/hysteresis make input practical, with an easily adjustable level count.
- **Gameplay-first track:** authored list of low (~0.25), medium (~0.5), high (~0.75), >1.0-at-reference **mandatory-slowdown** curves and one reverse-direction S-curve. Difficulty at a documented reference speed (initially ~230 displayed km/h) drives curvature generation, not the other way around.
- **Existing production constraints:** preserve **1.75× world pace**, real Three.js 3D car/road, Pixel 8 landscape fullscreen/PWA/two-thumb hand swap/long press, PC A/D+Space/Enter, car-left needle speedometer and bounded off-road speed penalty.
- **Not yet:** dynamic difficulty director, branching races, traffic, extra car choices, convertible, elaborate editor or scenery changes. These are future work after a positive human playtest.

### Safety: local playable code is not remote main

The current working **playable v0.4.1** lives in the user's LOCAL Windows Git checkout. Last reported commits: `4d4b05c` implementation and `34b6a3e` handoff. GitHub remote `main` is primarily these planning documents. **Never overwrite or reset the playable local branch with remote main**.

## Start here

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Active Codex instructions and local branch safety |
| [v0.4.2 specification](docs/V0.4.2_SPEC.md) | Arcade Lateral Balance, quantized steering and inverse challenge-track construction |
| [v0.4.2 acceptance](docs/V0.4.2_ACCEPTANCE.md) | Required playable low/mid/high/brake/S turns, actual calibration and device tests |
| [v0.4.2 kickoff](docs/CODEX_V0.4.2_KICKOFF.md) | Autonomous setup, full Codex Goal and evidence checklist |
| [Product vision](docs/PRODUCT_VISION.md) | Intended sunny 3D coastal racing experience |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Later Experience Director, DDA, route forks, cars, scenery |

## Development handoff

Open Codex **Local** at `C:\astra-dev\OutRun` on the playable branch and start the new `/goal` from the v0.4.2 kickoff. Codex should inspect/branch existing working source, selectively import **current** documentation from origin/main without merging all of main, then autonomously implement, actually play in a browser, measure and test, and commit locally. A green build or design document alone is not enough.

**This milestone only ends after a runnable PC/Pixel 8 game demonstrates all five challenge types.** Then the human decides whether the gameplay-first model is fun and whether it should become the permanent architecture.

Do not push, merge to main, public deploy, pay for services or change TopWar without explicit authorization.

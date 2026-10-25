# Project OutRun

**An original 3D arcade racer inspired by the *feel* of classic Out Run / OutRun 2, not an authorized SEGA remake.** `Project OutRun` is an internal codename; `SUNSHIFT GT` is only an uncleared candidate brand name. Use original/license-cleared artwork, cars and sound.

## CURRENT milestone: v0.4.3 — Soft Steering & Honest Curves

The owner **accepted the core v0.4.2 Gameplay-First / Arcade Lateral Balance direction** after playing on desktop and phone. It is worth polishing, **not replacing**.

**Next corrections:**
1. **P0:** The virtual steering still has four stable active notches each direction plus neutral, but the **discrete jumps feel too harsh**. Use rapid *soft transitions* in applied correction while retaining thumb-jitter deadzone/hysteresis and immediate release; do not reintroduce physical yaw inertia.
2. **P0:** **Visual truth:** some road bends look gentle despite requiring full steer/braking. Calibrate shared curvature/pressure mapping and *inverse-generate* actual 3D bends with visual severity proportional to designed required steering. Smooth transitions between road difficulty sections.
3. **P1:** Minor steering should leave the car body mostly calm. Strong intentional High/Extreme driving should show visibly dramatic, short-lived rendered drift yaw (~25–45° candidate) plus proper skid feedback without moving the authoritative road-relative game position incorrectly.
4. **Regressions:** accepted **1.75× world pace**, five playable Low/Medium/High/Too-Fast/S challenges, original 3D scene, car-left needle speedometer, PC A/D + Space/Enter, Pixel 8 20:9 landscape fullscreen/PWA two-thumb steering strip/pedals/hand swap/long-press, bounded off-road slowdown and track continuity.
5. **Deferred:** new cars/convertibles, rivals, adaptive director, road forks, scenic themes and extra game modes.

### Code and version control caution

The current playable v0.4.2 **source is in the user's local Windows checkout** (implementation `d44c8e5`, handoff `f7ed029`). Remote `main` is chiefly a specification repository and **MUST NOT replace/overwrite the local playable application**. Codex should branch from the latest playable LOCAL HEAD and selectively import only current v0.4.3 docs and `AGENTS.md`.

## Current docs

| Resource | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Active Codex instructions and safe workflow |
| [v0.4.3 specification](docs/V0.4.3_SPEC.md) | Soft detents, visible difficulty vs geometry, rendered drift |
| [v0.4.3 acceptance](docs/V0.4.3_ACCEPTANCE.md) | Calibration, real driving videos, regression and Pixel layouts |
| [v0.4.3 kickoff](docs/CODEX_V0.4.3_KICKOFF.md) | New autonomous Goal prompt and safe Git preparation |
| [Product vision](docs/PRODUCT_VISION.md) | Long-term feel/art goals |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Later Experience Director, vehicles, traffic, biomes |

## Hand-off workflow

In the existing Codex **Local** OutRun workspace (`C:\astra-dev\OutRun`), open a new `/goal` from the kickoff. Codex handles its own branch preparation, selective spec import, implementation, browser playtests/screenshots/motion, unit/E2E builds and local commits; Michael makes the final subjective playtest judgment. Do not push, merge or deploy without permission.

**The north star:** Required Steering → regenerated visually legible 3D road → precise, forgiving player control → exaggerated arcade feedback. Fun and perceptual honesty before adding content.

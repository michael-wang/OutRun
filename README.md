# Project OutRun

**An original 3D arcade racing game inspired by the *joy* of classic Out Run and OutRun 2, not an authorized SEGA remake.** `Project OutRun` is an internal codename; `SUNSHIFT GT` is an uncleared prospective public name. Use original/licensed art, music, vehicles and character designs.

## Current milestone — v0.6 Scenic Journey

The playable **v0.5** now has human-approved core high-speed arcade handling, a coherent 1.75× world pace, distinctive dramatic body drift and a new original open-top sports car with two visible occupants. The user's next requests are **scenery variety and road variety first**, plus fixing static-looking wheels during big drifts and adding simple lively characters / exaggerated long-haired female wind animation.

**Scope and priorities:**
1. **P0 Wheel fix:** front and rear wheels actually roll visibly at high speed (and stop at zero), front wheel steer pivots remain correct, including ~50–60° rendered body yaw.
2. **P0 Scenic route:** continuous Azure Coast → Golden Canyon → Sunlit Coastal City tour. Distinct near-road prop families, mid/distant silhouettes and landmarks, with two smooth travel-distance-triggered transitions (~30–45 seconds per act at representative 1.75× speed).
3. **P0 Road variety:** preserve Gameplay-First Required Steering track generation while adding coast fast sweepers/crest, canyon S + technical brake corner/grade and city sweeping descent. More visual road drama, not a new driving physics model.
4. **P1 Characters:** modest head/body/arm lean/reactions, with very visible high-speed flowing hair for a long-haired female occupant. Inexpensive procedural animation only, after P0 is sound.
5. **Deferred:** rivals/traffic, route forks, adaptive difficulty director, more vehicles, score/progression, full character rigs, multi-scene asset systems.

**Preserve the fun:** User-approved 1.75× pace, Arcade Lateral Balance, soft 4-detent steering each way, bounded off-road slowdown, full-speed and brake-required corners, left-of-car analog needle speedometer, Pixel 8 20:9 landscape fullscreen/PWA/swappable two-thumb controls and desktop A/D + Space gas + Enter brake.

### Git safety

The latest playable v0.5 is in the user's **LOCAL Windows checkout**, implementation `645b7ed` and handoff `9a05fc3` (verify latest HEAD). GitHub `main` is mainly specifications, **NOT a replacement for the working game**. Codex must branch from the local playable v0.5 code and selectively import current docs, never reset/merge all of `main` over it.

## Current docs

| Link | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current Codex policy and milestone scope |
| [v0.6 spec](docs/V0.6_SPEC.md) | Wheel fix, three scenic acts, road rhythm, occupants |
| [v0.6 acceptance](docs/V0.6_ACCEPTANCE.md) | Rendered transition, wheel, track, mobile and character checks |
| [Codex v0.6 kickoff](docs/CODEX_V0.6_KICKOFF.md) | One-shot autonomous Goal and safe branch prep |
| [Product vision](docs/PRODUCT_VISION.md) | Joyful, sunny, fast original arcade driving |
| [Product roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Deferred director, cars, stages, traffic and progression |

## Workflow

Open existing **Codex Local** at `C:\astra-dev\OutRun`. For this new milestone, first provide explicit **ordinary chat authorization** if necessary to supersede the v0.5 stop instruction; then start a new actual `/goal` from `docs/CODEX_V0.6_KICKOFF.md`.

Codex owns safe Git branching, docs-only selective import, original art implementation, browser QA, screenshot/video review, tests, local commits and honest `docs/V0.6_HANDOFF.md`. The human evaluates whether the full journey actually looks richer and remains fun. No public deployment/push/merge without approval.

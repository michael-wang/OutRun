# Project OutRun

Original browser 3D arcade-driving game inspired by classic Out Run joy, not a licensed SEGA game. Original/license-cleared models and sounds only; project name not public brand cleared.

## Current product milestone

**v0.7D THREE-PILOT HUMAN GO:** all L2P-A/B/C r1 playable local courses earned real KEEP (difficulty 2,3,2). Exact file: [Human pilot feedback](docs/reviews/V0.7D_PILOT_R1_HUMAN_FEEDBACK.json), [summary](docs/V0.7D_PILOT_HUMAN_REVIEW.md). Previous failed one-triple-per-L2 generator replaced by true distance-localized multi-placement L2 composition, now personally accepted.

### ACTIVE: v0.7D.1 — Driving & Input Quality

User wants:
- Road's actual upslope to decrease full-gas acceleration and make coasting slow faster; downhill feel different.
- Same bend noticeably harder/more slide-prone at 300 vs 150 km/h, preserving calibrated arcade pleasure near 230 and honest brakes.
- Fix intermittent missing tire squeal on left drift without destroying accepted warm engine sound.
- Mouse-free PC menus, especially P=Play Again and native focused Enter activation (while driving Enter remains brake).
- Desirable PS4 DualShock 4 gamepad direct support via browser API, real USB/BT status honestly hardware dependent.

Full specifications: [v0.7D.1](docs/V0.7D1_DRIVING_INPUT_SPEC.md), [acceptance](docs/V0.7D1_ACCEPTANCE.md), [Codex kickoff](docs/CODEX_V0.7D1_KICKOFF.md).

### NEXT: v0.8 — First Procedural Stage (prepared, dependent)

First **genuinely generated and replayable Stage 01: Pacific Getaway**, nominal 100–150s distance-based, combining the accepted multi-event L2 motifs, seed-varying actual turn/grade/width/scenic experience, stage end and Replay Same/New Route code. Only existing three biomes and content, no large Stage Composer/RPG/traffic. Launch only when human GO received for v0.7D.1 driving/control fixes.

Prepared specifications: [Stage One](docs/V0.8_STAGE_ONE_SPEC.md), [Stage acceptance](docs/V0.8_STAGE_ONE_ACCEPTANCE.md), [future Codex kickoff](docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md).

### Git and handoff warning

The latest playable **v0.7D code is LOCAL** at `C:\astra-dev\OutRun` (reported `367fe15` implementation, `4a9ec77` handoff). The GitHub `main` branch holds primarily DESIGN DOCS, not a safe source replacement. Never reset/merge docs-only main into the working app.

Send plain non-/goal Codex authorization for v0.7D.1 in the existing OutRun conversation, then use the first Goal only. Codex branches locally, selectively imports task docs, builds/tests/commits, stops for human review. Do not run future Stage One Goal simultaneously.

### Technical baseline

Three.js/TypeScript/Vite; human-accepted Arcade Lateral Balance, real 300 km/h six-gear car with 1.75× visual flow and warm sound, 144px four-soft-detent steering mobile bar, original roofless car/hair/wheels, realistic 3D road with 2–8 lanes and elevation, coast/canyon/city scenery and seeded L2 Lab with in-drive praise/issue, JSON export. Android Pixel 8 landscape fullscreen PWA two-thumb/hand swap + PC A/D/Space/Enter. No public deploy/push/merge without permission.

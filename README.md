# Project OutRun

Original 3D arcade driving web game inspired by classic Out Run / OutRun 2; not an authorized SEGA remake. Project name is internal, assets must be original/licensed.

## Latest user-validated baseline: v0.7D.1

Three pilot L2P-A/B/C were personally played again and ALL received KEEP (difficulty 1/2/2), and PS4 DualShock4 controller driving received PASS. The locally playable game is in Windows `C:\astra-dev\OutRun` (last reported code commit `30e6f54` + handoff `710d184`; check local status). Remote GitHub `main` is mostly DOCS, not the playable app. Never merge/reset/check out main over local game.

[Original v0.7D.1 human feedback](docs/reviews/V0.7D1_PILOT_R1_HUMAN_FEEDBACK.json) · [Review summary](docs/V0.7D1_HUMAN_PLAYTEST.md). The real export has 3 KEEP and 2 completion praise tags; autoQA stays PENDING in those records. Older v0.7D, v0.7C, BRK R1/R2 reviews must remain unchanged.

## ACTIVE: v0.7D.2 — In-Drive Retrospective Feedback & Tire Audio

User's remaining problems: loud/shrill low-speed false-positive tire squeal, PC keyboard shortcut hints missing from menu labels, cumbersome praise while steering with PS4, and praise currently anchored to the wrong location after the moment has passed.

**Current delivery target:** softer, more meaningful skid sound below the already human-accepted warm engine mix; real visibly labeled PC shortcuts; **L1/R1 → Dpad one of four praise tags → Cross X commit/resume**, plus PC G/arrow/Enter; feedback defaults to a REAL saved snapshot ~2–3 seconds before button press, adjustable across recent actual drive history, export both reaction and target-event positions.

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Active safe Codex scope |
| [v0.7D.2 specification](docs/V0.7D2_FEEDBACK_AUDIO_SPEC.md) | Audio gating/timbre, keyboard and controller rating, retrospective anchor |
| [v0.7D.2 acceptance](docs/V0.7D2_ACCEPTANCE.md) | Audible/touch+gamepad/keyboard and timing replay tests |
| [v0.7D.2 Codex kickoff](docs/CODEX_V0.7D2_KICKOFF.md) | Current autonomous development Goal |

## NEXT (prepared only): v0.8 — First Procedural Stage

**Stage 01: Pacific Getaway**, a nominal ~100–150s seed-reproducible continuous arcade drive, procedurally composing distance-localized L1/L2 beats and real coast/canyon/city scenery. Five deterministic test seeds, three actual browser-driven seed comparisons, visible Stage Code, Replay Same/New Route, end review and compact in-drive retrospective praise. The actual 3-pilot multi-placement L2 composition was human-KEEP, but a Stage seed MUST meaningfully vary real driving events rather than re-labeling 3 fixed roads.

[Stage spec](docs/V0.8_STAGE_ONE_SPEC.md) · [Stage acceptance](docs/V0.8_STAGE_ONE_ACCEPTANCE.md) · [Future Stage Goal](docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md). **Do NOT run this task until owner confirms v0.7D.2 audio/ratings controls and separately authorizes it.**

### Gameplay invariants

Three.js + TypeScript + Vite, 1.75× arcade world pace, Arcade Lateral Balance, six-speed 300km/h gear and grade/speed-sensitive driving, original roofless 3D car+occupants/wheels/hair, 18 L1 families, multi-placement L2 pilot/Brick Lab, 2–8 actual lanes, current 3 environments, fixed chase view, car-left compact needle HUD, recoverable offroad, Pixel 8 landscape fullscreen PWA with 144px two-thumb steering and PC keyboard + actual PS4 controller.

**Workflow:** same existing LOCAL Codex OutRun conversation → ordinary authorization for v0.7D.2 if needed → a separate v0.7D.2 Goal → local commits/tests → human playtest. No push/merge/deploy, RPG or unapproved public website changes.

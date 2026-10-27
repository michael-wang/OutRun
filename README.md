# Project OutRun

Original browser 3D arcade-driving game inspired by the fun of classic Out Run / OutRun 2; not a licensed SEGA remake. Project name is internal, game art/music must be original or appropriately licensed.

## ACTIVE: v0.8 — First Procedurally Generated Stage One

**Human base:** Codex delivered v0.7D.2 locally (reported `71476fb`). The owner tested **three L2 pilots and rated all KEEP (difficulty 1/2/2)**, including precise positive feedback using retrospective positions. Original user export: [v0.7D.2 review](docs/reviews/V0.7D2_PILOT_R1_HUMAN_FEEDBACK.json); [review summary](docs/V0.7D2_HUMAN_PLAYTEST.md). The export has `generatorVersion=v0.7D.1-r1` and `autoQA=PENDING`; do not change real historical values to make them look more current/passed.

**The owner delegated three compact improvements to be implemented TOGETHER with v0.8**, before the Stage generator:

1. **L3 biome verticality preference:** dramatic cliffs/crests are more often canyon/mountain-like; city and coast prefer gentle/rolling, but are NOT prohibited from hills or exceptional dramatic passages. Present art packs are only city/coast/canyon; mountain remains future. Use seeded *soft weights*, not a sophisticated rule engine or retroactive changes to accepted pilot geometry.
2. **Compact accelerator hints:** show `[P]lay`, `[R]eplay same`, `[N]ext`, NOT spaced prefix `[P] Play`. Use actual relevant keyboard hints when keyboard is active, controller glyphs when a connected supported PS4 controller was meaningfully used, minimal icons for touch. Handle disconnect and input switching.
3. **In-drive mapping hints:** PC displays `[G]讚 · [I]問題`, actual gamepad displays `L1 讚 · □ 問題`. Praise on L1 (R1 remains alternate), Square for issue flag, D-pad praise choice, Cross save and Circle cancel. Preserve historical `eventAt` / `reactionAt` retrospective sampling.

### Stage 01: Pacific Getaway (placeholder)

One genuinely seed-generated and replayable **~100–150s nominal** Stage, start/finish, Stage Code, Replay Same and New Route. Integrates the existing 18 L1 families and verified multi-placement L2 beat grammar with REAL seed differences in curves, elevation, road width, scenic views and challenge/release rhythm. Current city/coast/canyon 3D scenery must reflect biome/hill preferences and actual road shape, not arbitrary pasted objects.

**Technical proof:** deterministically generate at least 5 Stage Codes, FULLY drive and record 3 different seeds, run build/unit/Playwright with no steering/menu/PS4/sound/history regressions. The human then rates if the Stage is fun enough to replay without RPG coins or unlocks.

### Current handoff docs

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Active v0.8 boundaries and safe local Git workflow |
| [v0.8 First Stage Specification](docs/V0.8_STAGE_ONE_SPEC.md) | Full stage product/technical requirement + compact input hints |
| [v0.8 Acceptance](docs/V0.8_STAGE_ONE_ACCEPTANCE.md) | Actual seeded geometry, biome, UI, gamepad and feedback tests |
| [L3 Verticality Preferences](docs/V0.8_BIOME_VERTICALITY_METADATA.md) | Soft environment-specific weighting and scenic plausibility |
| [Codex v0.8 Kickoff](docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md) | Ready-to-paste ordinary authorization + one autonomous Goal |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Long term toward curated infinite road trips |

### Local code safety

The ACTUAL playable game is only in the user's **LOCAL** `C:\astra-dev\OutRun` checkout (latest reported commit `71476fb` on `codex/v0.7d2-feedback-sfx`). GitHub `main` contains mostly specs, not game code. **DO NOT merge/reset/checkout documentation-only main over playable code.** In the SAME existing OutRun Codex chat, send a plain authorization message and THEN the separate `/goal` from kickoff, creating a NEW LOCAL feature branch from the playable HEAD. No push, merge, public deployment or changes to other projects.

### Preserved game

Three.js + TypeScript + Vite; human-approved Arcade Lateral Balance, 1.75× world pace, 300km/h automatic six-speed, real grade/velocity corner response, warm engine/softer squeal, four soft mobile steering detents with 144px active horizontal thumb travel, compact analog speedometer, 2–8 actual lanes, animated original convertible/occupants/hair/wheels, Pixel 8 landscape PWA two thumbs/swappable hands, PC keyboard and tested PS4 DualShock 4, local deterministic positive/issue feedback export.

**Deferred:** Stage 02, 5-minute Pacific Road Trip, full Mystery Drive, live AI generation, traffic/rivals, weather/snow/volcano, RPG coins/garage, general Stage Composer/editor. Owner will judge Stage 01 first.

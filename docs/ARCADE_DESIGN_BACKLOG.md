# Project OutRun — roadmap after v0.7C L2 design NO-GO

## ACTIVE TASK 1 — v0.7C.1

Shorten REAL phone steering travel (adult & child usability), six meaningful automatic gears, pleasurable slower acceleration toward a true 300 km/h, warmer non-shrill engine sound. Keep old accepted driving feel, real road physics/difficulty and R1/R2 user reviews. Benchmark old/new, test full steering reach with gas held and all five upshift events. After local commit and recorded tests, STOP for human phone/powertrain/audio playtest.

See `docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md`, `docs/V0.7C1_ACCEPTANCE.md`, `docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md`.

## PREPARED DEPENDENT TASK 2 — v0.7D, NOT AUTO-EXECUTED

Original 16 L2 batch lacked sequential timed/distance-localized events: one C + one E + one W extended over full road. Screenshotted classic ~37s reference shows many evolving bends/grades/scenic/traffic/speed beats; sampled stills cannot reveal exact count of underlying L1 nodes. See `docs/REFERENCE_37S_DRIVE_BEATS.md` and `docs/V0.7C_L2_DESIGN_POSTMORTEM.md`.

New L2 model: several L1 C/E/W placements with start/end distance, overlapping across channels where relevant, sequential within the same channel. Build ONLY 3 distinct ~25–40s micro-journey pilots and user-validate, before bulk generating any new 16 candidate routes.

Task 2 is dependent on approved car speed/gear/steering UX of Task 1. Owner must explicitly authorize later; do NOT run two Goals in parallel. See `docs/V0.7D_TRUE_L2_COMPOSER_SPEC.md` and `docs/CODEX_V0.7D_COMPOSER_KICKOFF.md`.

## After L2 pilot HUMAN GO

Revisit systematic 16-L2 batch with event timelines, then ~5-minute Pacific Road Trip, Mystery Drive, later diverse world/traffic packs and only then RPG currency/Garage/car unlocks. Reuse accepted BRK r2, 18 L1 tech family shape code and live praise/issue feedback UI. Human pleasure is validation, technical tests alone are not.

No speculative massive game-engine rewrite, custom AAA constraint system, concurrent checkout modifications or public deployment without approval.

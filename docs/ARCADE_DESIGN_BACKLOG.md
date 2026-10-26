# Project OutRun — roadmap after successful v0.7A.1 human review

## HUMAN-ACCEPTED FOUNDATION

**BRK-01..08 r2:** 8 KEEP / 0 REWORK / 0 REJECT and eight autoQA PASS. Archived first and second rounds:
- `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json`
- `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json`

These eight L2 reference experiences are approved **only at their exact r2 content versions**, not arbitrary stacked variations.

## ACTIVE AUTHORIZED: v0.7C — L1 Library & L2 Feedback Lab

User requests:
- **Complete first systematic L1 vocabulary:** eight Curvature, six Elevation, four Width parameterized shapes; Codex audits existing engine, fills gaps and auto-tests geometry. No player time spent individually rating primitives.
- **Sixteen representative L2 mixes:** systematically cover all C/E/W types in 16 real ~30–60s drives with current coast/canyon/city scene rules, single seeded replay ID per candidate, in 4 review batches. Different combinations may have different human-rated difficulty (even Godlike) instead of prematurely enforcing a speculative AAA solver.
- **Instant feedback (praise AND issues):** location-anchored issue text and four named player praise reactions — **超好玩!**, **超刺激!**, **超難! 但是過了超爽!**, **風景優美**. Pause/input/resume safely, allow just-completed challenge praise. End L2 KEEP/REWORK/REJECT + perceived difficulty and notes; local persistence & JSON export.
- **Protect gameplay:** old accepted BRK history, 1.75× Arcade Lateral Balance, 4 soft detents, 2–8 real lanes, dramatic grades, three original scenic packs and phone input.

Source of truth: `docs/V0.7C_SPEC.md`; acceptance `docs/V0.7C_ACCEPTANCE.md`; matrix `docs/V0.7C_L2_COVERAGE_MATRIX.md`; shape library `docs/L1_PRIMITIVE_CATALOG.md`. Latest full Codex handoff `docs/CODEX_V0.7C_KICKOFF.md`.

## NEXT AFTER HUMAN L2 REVIEW — NOT AUTHORIZED

- Revise weak generated L2 and strengthen composition rules based on issue/praise *locations and tags* rather than guesses.
- Then revisit **v0.7B Pacific Road Trip — Intermediate — 5 minutes**, using only exact approved L2 versions in a reproducible full journey.
- Mystery Drive using same generator but unknown-to-player scene order, future world packs (snow/volcano only after actual assets/mechanics), traffic/rivals, real obstacles, and Stage Composer only where needed.
- RPG completion-based earnings/garage/car upgrades/unlocks **after** generated journeys are fun to replay without money.

## Working principle

**AI engineers technically correct L1; human rates playable L2.** Capture both positive and negative moments while actually driving, so the game learns what to preserve as well as what to fix. Keep process/code minimal and don't confuse green tests with a fun game.

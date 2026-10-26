# Project OutRun — roadmap after second-round brick approval

## ACCEPTED: v0.7A.1 Brick Library r2

**The owner reviewed ALL eight revised v0.7A.1 bricks on 26 October 2026. Result: 8 KEEP, 0 REWORK, 0 REJECT.** Each r2 record has autoQA PASS. The prior r1 result was 6 KEEP and 2 REWORK; BRK-03 Crest & Reveal and BRK-05 Downhill Acceleration moved from REWORK to KEEP.

Immutable input archives:
- `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json`
- `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json`

Approval is of these exact revision-2 experiences, **not** every future combination of their curvature, elevation, width and scenery. Existing Brick Lab records and user local review storage must not be overwritten.

## NEXT RESEARCH / PLAYABLE EXPERIMENT PROPOSED: L1 profile stacking

See `docs/L1_STACKING_EXPERIMENT_PLAN.md`. **NO NEW CODEX GOAL AUTHORIZED YET.**

- Keep L1 **road-geometry profiles** focused: curvature, elevation, road width (one effective value per channel and distance).
- Keep L2 **approved experiential recipes**: create small variants by stacking different L1 profiles. User judges both fun and *perceived difficulty*; unknown combination is UNREVIEWED.
- L3 **world/biome and journey** chooses supported environment/surface/props, influences which L2 profiles are allowed and directs terrain/scenery generators after real road geometry exists.
- First try BRK-01/03/06, a small set of variants, and only minimal structural validity checks (geometry/terrain overlap and continuity). Avoid speculative AAA grading, a giant editor or safety/difficulty algorithms; player can classify an extreme challenge as Godlike.
- Make near/mid/far scenery react to terrain/roads and maintain seeded reproducibility.

## LATER: v0.7B Guided Pacific Road Trip

Only after we establish whether vertical stacking yields actually distinct appealing driving moments, consider composing an approximately five-minute theme-guided trip from HUMAN-APPROVED L2 variants, with replayable seeds. Current Guided Journey and Mystery Drive are planned directions, **not** ongoing engineering tasks.

## FARTHER LATER

Scenic biome expansion (snow/forest/volcano only once real content exists), hazards/traffic and rivals, RPG earnings/upgrades/new cars, time challenges, route choices, and Stage Composer only when proven useful for editing; human fun before economy/grind.

**Development rule:** small testable experiences, human approval, simple geometric consistency, preserve Arcade Lateral Balance and Pixel 8 quality. No public deployments or local code changes implied by this documentation update.

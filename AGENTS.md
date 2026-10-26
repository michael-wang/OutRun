# Project OutRun — Codex collaboration status

## No new implementation Goal authorized as of 26 October 2026

**Human milestone result:** v0.7A.1 has received second-round player feedback: all eight BRK-01..BRK-08 revision 2 bricks were **KEEP**, each with autoQA PASS. This follows v0.7A r1 (6 KEEP, 2 REWORK). The reviews are archived at `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json` and `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json`.

The next **PROPOSED** research/playable prototype is small L1 road-profile stacking across selected L2 experience bricks, with L3 world/terrain/scenery rules. See `docs/L1_STACKING_EXPERIMENT_PLAN.md`. This is **not** approval to implement that proposal or begin the previously envisioned v0.7B 5-minute Journey.

## Preserve existing local game code

- The playable OutRun app and its newest v0.7A.1 version are in the user's LOCAL `C:\astra-dev\OutRun` checkout; its latest implementation commit is **not confirmed in these remote planning docs**. Inspect local HEAD and any active state before making changes.
- Remote GitHub `main` is primarily documentation and is not the playable game's source. Never merge/reset/check out docs-only main over the working app.
- Do not change `C:\astra-dev\topwar`, push/merge/deploy, spend funds or use unlicensed SEGA/Ferrari assets without explicit user authorization.
- Normal Brick Lab play, review votes/localStorage/exports, full-speed Arcade Lateral Balance, 1.75× travel, four soft detents, Three.js road/world/scenery, Pixel 8 fullscreen/two-thumb/PWA, PC A/D+Space/Enter and approved eight r2 challenge variants are to be preserved in any future commissioned work.

## Human-controlled review integrity

- Machine QA PASS != human KEEP. The r2 KEEP votes belong to exact BRK ID + revision + geometry/content version; they must not silently authorize arbitrary changed variations or new stacked combinations.
- For any later change to effective steering demand, height/grade, lane width, sightline or hazards, create a new explicitly labeled content revision and leave its human vote UNREVIEWED. Preserve r1/r2 history unchanged.
- Future tasks should remain narrowly scoped: read the new authorized spec, create a feature branch from current playable LOCAL HEAD, selectively import only relevant docs, build and visibly drive in browser/Pixel-like view, run tests, hand off with PASS/FAIL/UNVERIFIED and stop for real owner evaluation.

**No current instruction to start a new milestone automatically.**

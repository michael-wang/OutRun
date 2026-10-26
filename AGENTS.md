# Project OutRun — Codex working agreement

## ACTIVE: v0.7A.1 — Verticality & Variable Width (owner-approved)

**Owner has actually driven all eight v0.7A bricks.** Six original r1 bricks received KEEP and two (BRK-03, BRK-05) received REWORK, both explicitly requesting "More radical height delta". Owner also reports all roads look the same width and requests authentic **2- to 8-lane roadway changes**. Their direction: **finish making the bricks good BEFORE composing journeys**. This milestone improves the existing eight; it is NOT v0.7B.

Read in order:
1. `docs/CODEX_V0.7A1_KICKOFF.md`
2. `docs/V0.7A1_SPEC.md`
3. `docs/V0.7A1_ACCEPTANCE.md`
4. `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json` (historical real user votes)
5. `docs/CHALLENGE_BRICK_CANDIDATES.md` (r1 candidate descriptions).

The old stop-after-v0.7A was to obtain human reviews, which have now occurred. The owner has requested the NEXT revision, v0.7A.1, **not** authorization for v0.7B. If Codex authorization still blocks git actions, request explicit *normal chat* owner approval and honor actual sandbox permission denial; no repeated bypass attempts.

## Preserve local playable app
- Work only at `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. Never touch `C:\astra-dev\topwar`.
- v0.7A is PLAYABLE on user's LOCAL checkout: code commit `b6ee7ea`, handoff `e6e80f0` on `codex/v0.7a-brick-lab` (verify actual local HEAD/status). GitHub `main` is documentation-first, NOT a replacement game branch.
- Branch `codex/v0.7a1-vertical-width` from latest local playable v0.7A HEAD, preserve uncommitted edits, fetch origin/main and selectively import ONLY new `AGENTS.md`, `docs/V0.7A1_SPEC.md`, `docs/V0.7A1_ACCEPTANCE.md`, `docs/CODEX_V0.7A1_KICKOFF.md` and `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json` after checking conflicts. Never reset/merge/checkout docs-only origin/main over app.
- User votes may also live in the browser's localStorage. Keep them intact across version changes; do not overwrite real R1 votes with guesses, fixture test values or R2 defaults. The R1 JSON records user feedback, not automatic proof of approval of new R2 geometry.
- No push, merge, public deployment, paid services, SEGA/Ferrari assets, unrelated repos or new full-blown editors.

## Deliverable
1. Real 3D **vertical road drama**: significant visible rises, crests and descents, especially BRK-03 and BRK-05. Verify at actual chase camera; not a graph-only elevation change or an artificial camera tilt. Safe roads and meaningful sightline warning.
2. True **variable road width**: 2 / 4 / 6 / 8 TOTAL lanes across the eight bricks, and smooth playable lane-count changes along some bricks. Width must affect actual road mesh, lane lines, shoulder/offroad corridor, road-edge props and player margin, not only paint or scenery.
3. Eight still playable/replayable deterministic `?lab=bricks` scenarios with previous distinctive gameplay. KEEP r1 votes historically intact; increment candidate revision and reset ONLY that revised candidate's human vote when its play/geometry materially changes. Technical AUTO_PASS never automatically promotes to HUMAN_APPROVED.
4. Preserve approved v0.7A driving: Arcade Lateral Balance, inverse RequiredSteer-to-curvature, 1.75× pace, four soft detents per side, physical steering and brake semantics, full-speed sweepers + brake-required corners, convertible/wheel/hair visuals, 3 scenes, Pixel 8 full screen/PWA/two-thumb handedness, PC A/D+Space/Enter, bounded offroad.
5. Actual real-browser visual drive and mobile/desktop screenshot comparisons of elevation and width transitions; deterministic + gameplay tests, ≥180s repeat/scene/road continuity sample, build/unit/Playwright and local commit/handoff.

**Stop after v0.7A.1 for second-round human reviews. Do not compose a five-minute Pacific Road Trip or launch v0.7B yet.**

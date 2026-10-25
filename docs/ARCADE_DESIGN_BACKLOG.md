# Project OutRun — Roadmap: Curated Procedural Journeys

## LAST DELIVERED: v0.7A Challenge Brick Lab — owner-reviewed

The owner played all eight original candidate bricks. Six received **KEEP** (01,02,04,06,07,08), two received **REWORK** (03,05: "More radical height delta"), none REJECTED. Exported record: `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json`.

Cross-cutting critique: elevation changes too timid, roads all feel equal width. Gameplay concepts are promising, but physical 3D road vocabulary still too narrow.

## ACTIVE NEXT: v0.7A.1 Verticality & Variable Width

**Owner instruction: fix bricks first, THEN assemble them.**

- Make BRK-03 ridge climb/crest/valley dramatic from real chase view, and BRK-05 a substantial, sustained steep downhill. Add only worthwhile secondary elevation beats while preserving good corner timing.
- Actual drivable width spans **2, 4, 6, 8 TOTAL lanes**, including visible 2↔4 and 6↔8 merges/expansions; unify road mesh, lane lines, offroad bounds/penalty, shoulder, rails and props through a distance-dependent width function.
- Retain original eight challenge identities, review UI/export, seeded replay, 1.75× world pace and accepted Arcade Lateral Balance. Treat meaningful geometry changes as **NEW CONTENT REVISIONS** requiring second-round human votes; preserve six original r1 KEEP and two REWORK as history.
- Compare pre/post on BRK-03/05 via actual browser footage; prove 2-lane road vs 8-lane road yields different playable side margins and remains fair.
- Only after human second-round evaluation can we promote new bricks into curated generation.

Source of truth: `docs/V0.7A1_SPEC.md`, `docs/V0.7A1_ACCEPTANCE.md`, `docs/CODEX_V0.7A1_KICKOFF.md`.

## WAITING (not authorized): v0.7B Pacific Road Trip / Intermediate / 5 Minutes

Use ONLY HUMAN_APPROVED versioned bricks to create a deterministic approximately five-minute seeded scenic road through the existing coast/canyon/city packs. Evaluate 10 seeds, visually inspect 3 meaningfully different runs, retain replay/share code, reject unfair roads. Do not call it successful if it's repetitive. See `docs/V0.7_PLAYABLE_PROTOTYPE_PLAN.md`.

## LATER (not authorized)

- Mystery Drive: surprise route/themes/seed using the same approved generator.
- Broader approved challenge vocabulary: traffic, actual lane obstacles, better mountains, forest/snow/volcano, time and weather.
- Optional simple Stage Composer when it solves a proven authoring burden.
- RPG progression/garage: earned currency, upgrade grip, brakes, engines, new original cars, equipment for specific surfaces. Add after trips are fun without monetary rewards.
- Player-aware challenge/route forks after the generator is validated; no silent grip manipulation.

**The test of success is repeatable driving pleasure, not more random meshes or extra menu systems.**

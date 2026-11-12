# Current architecture — R0 decision map (2026-11-12)

## Goal
The engine provides composable, reusable **capabilities**; authored stage data determines *what* and *where*. Choose **composition over inheritance**, shallow interfaces, no speculative abstractions and the smallest context required for a task.

- **Engine:** static/instanced meshes, deformers/wind, lighting/shadows, water, resource loading/streaming, collision and road samples.
- **Game:** player handling, opponents, traffic, scoring, input, HUD, race recovery.
- **Content:** finite road description, placed GLB/prefabs, scenery zones, effects parameters. No stage-specific engine source edits just to place a boat, house or rock.
- **Editor tools:** Blender or experimental 67.js create assets; Three.js remains the runtime. Keep Ultra Water and the approved coast.

## Current dependencies — do not delete blindly

The v0.9.43 coast still uses `coast-ultra-stage.ts` → `pilot-composer.ts` → `l1-profiles.ts` and `bricks.ts` / `challenges.ts` for **road coordinates and types**. The worker and collision both sample that same road. Do not delete them until a replacement road contract is in use.

Legacy `trip.ts` and `scenic-director.ts` originally served randomly assembled L1/L2/L3 journeys. They are **not a design requirement**. The previous city second stage is retired; no migration or behavior-preservation obligation. The old L2/Brick review labs, speculative road generation and inactive journey transition code may be removed **after** the accepted coast can run without importing them.

## R0, then next tasks

- **R0 (now):** remove obsolete documents and instructions, separate P0/P1 gates, retire unused stage definitions without modifying actual coast behavior. Keep old reviews/evidence in Git history; screenshots used for visual comparison can remain in evidence.
- **R1:** define the minimal capability catalog and Stage/Prefab/Asset data contract, proven by replacing one static scene object using data only.
- **R2:** make authored road the sole source of truth for camera, geometry, rivals and collisions (use existing `fixed-road.ts` where helpful), then remove replaced procedural generators and old Lab code.
- **R3+:** rebuild coast corners for controllable drifts; only then hand-author hero scenery. New stage content follows the same workflow.

**Stop condition:** no mass rename or cosmetic directory reorganization. Favor removing actual dependencies and shrinking the number of modules read for a small content edit. Each milestone must leave the playable coast intact.

## R1 — first data-authored prefab

The coast house at absolute road metre 1085 is declared in `content/stages/coast/scene.json`; its swappable GLB asset path is in `content/prefabs/catalog.json`. The lightweight GLB lives in `public/assets/coast-props/`. The shared loader `src/content/static-props.ts` handles static models, while `src/content/coast-static-props.ts` supplies the existing coast terrain height.

The matching old Worker-generated farmhouse is suppressed by the **same authored replacement metadata**. Swapping/moving this object requires only editing JSON or GLB. See `content/README.md` for QA. This R1 slice does not add an entity framework, general collision physics or wind deformation; accepted road and Ultra Water remain untouched.

## R2a — road content is data, unchanged coast geometry

`content/stages/coast/road.json` is the source of truth for its nine manual turns, the original mild rise and its width. `src/content/authored-road.ts` validates absolute HUD-metre spans and adapts them into the existing sampler. `src/coast-ultra-stage.ts` now has **no canyon-stage inheritance** and supplies stage identity / environment metadata only. The same stage feeds the road worker, baked shoreline, rivals, car handling and collision paths; no duplicate curve planner.

This preserves the currently approved route exactly and clears the way to revise curve strengths by editing road data. **R2 remains in progress:** the older `pilot-composer` and generated profiles are still compatibility machinery. Do not remove them until a full authored spline/fixed-road path has parity and owner playtest acceptance.

## R2b — direct road sampler, one content source

The coast stage now exposes `authoredRoad` directly, and `pilotSample` selects `sampleAuthoredRoad` for that stage. Curvature, elevation, grade and lane width are read from `road.json`, including in the road Worker. A one-time cache prepares the existing C02/E02 mathematical knot shapes without rebuilding curves every frame; the shape and accepted route are unchanged.

`placements` remains a **derived compatibility projection** for the old course/AI metadata and inactive stages. The legacy sampler is retained only for non-authored candidates and parity tests. Never hand-edit the derived placements. R2b tests sample the entire route and knot boundaries against the R2a accepted road, and reject height discontinuities before loading any chunk.

**Next:** move the remaining course/track contract off Pilot/Brick, then retire unused generators and labs. Do not delete the old code while the playable coast still imports it.


## R2c — coast course and track no longer come from Pilot/Brick

`src/content/authored-track.ts` directly translates `content/stages/coast/road.json`
into the spans used by the existing shared `createTrack` integrator. It does
not depend on Pilot, Brick, Trip or their placement planner. Its coast banking
uses the existing math and the existing fixed coastline weights; the familiar
600m post-finish relief still provides a road safety buffer.

`pilotCourse` and `createPilotTrack` dispatch an `authoredRoad` stage
to this new path, so the current game/Worker and inactive historic stages can
coexist during migration. From this point, hand-edited `placements` **cannot**
change the coast route. Keep the derived placements only for compatibility
metadata until all consumers stop importing them.

The blocking R2c test compares the direct road's full poses (position, tangent,
bank, heading, curvature, segment metadata) against the accepted R2b evaluator,
and proves that edits to road JSON work with obsolete placements removed.

**Next:** migrate remaining coast consumers from Pilot/Trip metadata to the
stage content contract. Retire legacy code only after confirming its remaining
call sites are genuinely inactive. R2c intentionally does not redesign curves.

## R2d — stage content vs legacy Trip boundary

Coastal authoring is now represented by three simple files:
`content/stages/coast/stage.json` (identity / race metadata),
`road.json` (finite route) and `scene.json` (placed prefabs).
`src/content/coast-stage.ts` composes these with the existing scenic acts
and validates IDs, finite road, content and chapter coverage. **This content
contract does not inherit from Pilot, Brick or Trip.**

`src/coast-ultra-stage.ts` is a narrow compatibility bridge which creates
the *same* `TripCandidate` that existing Worker and game still accept.
Historical IDs, event metadata, world phase and empty legacy fields remain
there temporarily; they are not authoring requirements. The R2d P0 tests
assert the exact accepted runtime identity, feature boundaries and track.

**Next:** migrate the remaining live game/Worker consumers to read a
narrow runtime stage contract. Only then delete legacy generated fields and
inactive Pilot/Trip machinery; avoid changing multiple systems at once.


## R2e — lean coastal Worker init, pending full runtime migration

`StreamedScene` now sends `coastStage:'coast'` instead of transferring
the entire derived `TripCandidate` during coastal Worker init. The Worker
resolves the equivalent versioned coastal runtime compatibility adapter locally.
Non-coast mode retains the previous payload. No gameplay, road, traffic,
scenery or fallback behavior was intentionally changed.

This is an **init transport boundary** only: the Worker still consumes legacy
stage fields internally; retiring those fields is a later separate slice.
See [ADR-010](ADR_010_STAGE_DATA_FORMATS.md): human-readable JSON is not an
engineering goal, binary runtime data is a measured later decision, and AI
authoring must have queryable/range-based access rather than full-file dumps.

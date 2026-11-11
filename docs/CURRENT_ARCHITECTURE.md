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

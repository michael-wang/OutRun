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

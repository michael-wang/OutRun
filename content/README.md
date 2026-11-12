# Stage content — R1 static prefab slice

Stage recipe: `content/stages/coast/scene.json`
Prefab registry: `content/prefabs/catalog.json`
Model: `public/assets/coast-props/r1-farmhouse.glb`

**Visual verification:** start the local Vite dev server and open `/?at=985&prefabdebug=1`. Choose 海濱公路. The upper-right Prefab QA panel shows the actual player distance, target distance (1085 m), load state and model path. A golden wireframe highlights the **loaded GLB**, and a floating `▼ GLB · 1085m` marker points to the exact farm house. No guessing which distant building is the target.

The QA overlay only runs in Vite development with `prefabdebug=1`; it is unavailable in production. Normal play and release assets are unchanged. The HUD rounds the course distance to tenths of a kilometre, so `0.9 km` means roughly 900 m, *not* the 1085 m prefab. For an ordinary unmarked view, use `/?at=985` or `/?at=850`.

- Change `prefabs['taiwan-farmhouse'].model` to any local compatible GLB path to swap the house, **without editing TypeScript**.
- Change `staticProps[0].roadDistance/lateral/yaw/scale` to move/rotate/resize it. Road distance is an **absolute** metre, not a segment-local parameter. Yaw is relative to the road direction, in radians; model entrance faces local -X.
- The `replaces` field hides the matching original Worker-generated house, avoiding doubled geometry. Its distance identifies the **old house** and stays unchanged when you move the new one.
- `src/content/static-props.ts` is a reusable static GLB loader using the current stage scene and disposal lifecycle. `src/content/coast-static-props.ts` supplies coast terrain height. Rendering, road and gameplay are unchanged.
- First GLB is a lightweight, original, hand-authored Taiwanese farm-house study (320 triangles, one material, vertex colors). It is deliberately a functionality proof, **not** the final hero scenery design.
- Optional GLB load errors log a warning and do not prevent starting the race. No dynamic collision or wind effect is implied by a static prefab.
- Later stages can use the same loader with different JSON data and a terrain height adapter; no new entity framework is needed.

R1 acceptance: current coast can be played and the prefab appears at the specified position. Test changing only the JSON model path or a placement coordinate, rebuilding, and inspecting the difference.

## R2a — manually authored road

The coast road is now authored in `content/stages/coast/road.json`; its turns are **data**, not code in `src/coast-ultra-stage.ts`. The file describes:

- `startDistance: 350`, `length: 10000` and `lanes: 5`.
- `turns`: `start` / `end` in **absolute road metres** (the same coordinate system as the HUD and `scene.json`), signed `steer` demand, `shape` and display label. For example, the first sunset sweep spans HUD metres **350–1000**.
- `elevations`: absolute road metre spans, base height and signed rise in world metres.
- The validated adapter `src/content/authored-road.ts` translates this authored data to the *existing* road sampler. Road meshes, AI, vehicle/camera and shoreline baking therefore share the exact same road without special per-stage code.

To edit a curve, change its `start`, `end` or signed `steer` in **road.json**, then reload the development build. The original coast layout is intentionally preserved by this R2a conversion; the actual drift-focused corner redesign starts **after** you accept the data route.

The first slice uses the one existing `sweep` curve and `gentle-rise` elevation, rather than inventing future shapes. When a planned hairpin or 3D spline needs a new capability, add it to the common road evaluator or import/bake its control points through `fixed-road.ts`. Don't put per-curve algorithms back into stage files.

**Not yet done:** fully retiring the historic Pilot/Brick/Trip runtime evaluator and old inactive Lab interfaces; that requires the later fixed-road migration. These are transitional implementation dependencies, **not** requirements for procedural authoring.

## R2b — runtime road sampling

`sampleAuthoredRoad` now consumes the stage road JSON directly at runtime. Road rendering, the Worker, player and traffic continue to sample the *same* route; the old `placements` array is a derived compatibility view, not a separate authoring source. The previously accepted R2a coastal geometry is unchanged.

QA: compare familiar coastline and farm house at `/?at=985`, then drive the long sweep from `/?at=3150`. No new gameplay or scenery is expected in this architecture milestone. The P0 `tests/authored-road.unit.ts` includes a whole-route numerical comparison to the prior sampler.


## R2c — authored course and track

`src/content/authored-track.ts` builds the coast's road spans and actual
drivable track directly from `road.json`. The old Pilot course builder is no
longer involved for the coast; player/camera, road Worker, collision and
scenery all continue to use the resulting shared track. Legacy `placements`
is now a derived compatibility projection only, not a geometry dependency.

For QA, drive from `/?at=985` and `/?at=3150`. The accepted R2b geometry
and gameplay should appear **identical**. `tests/authored-track.unit.ts`
provides exact course and dense track-position / bank parity checks.

## R2d — coastal stage content independent of Trip

`content/stages/coast/stage.json` now owns the stage identity and basic race
metadata (name, seed, entry, warning). The existing `road.json` and
`scene.json` still own road geometry and the static farmhouse. The small
`src/content/coast-stage.ts` joins and validates these three sources against
the existing four scenic acts; it imports **no** Pilot/Trip/Brick generator.

`src/coast-ultra-stage.ts` is now only a **temporary adapter** producing the
unchanged legacy `TripCandidate` required by game, Worker and diagnostics.
When editing the coast, change the data files, not that adapter. Runtime IDs
and historical compatibility tags remain pinned there until consumers migrate.
No changes to road, traffic, water, scenic act positions or other visuals.

QA: `/?at=985` for the authored farmhouse, `/?at=3150` for the sweep.
`tests/coast-stage-content.unit.ts` is a P0 guard against data mismatches
and unintended changes to the existing runtime stage.


## R3 closure (2026-11-12)
The old Pilot/Brick/Trip generators and history labs are removed. See
`docs/R3_ROAD_SYSTEM_CLOSURE.md`. Native road data and the worker use
`src/content/coast-worker-road.ts`; do not recreate legacy `placements`
as an editable source. The archived compatibility view for feedback exports
is derived on demand from the current authored road.

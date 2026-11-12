# Current architecture — after R3 closure (2026-11-12)

## Goal and boundaries

- **Engine:** Three.js geometry/road sampling, renderer, shadows, water,
  collision, chunked preparation/streaming, resource lifetime.
- **Game:** steering/physics, traffic and rivals, score, race checkpoints,
  controller, HUD and QA/feedback.
- **Content:** finite authored road, explicit stage metadata, placed prefabs,
  scenic acts and assets; no stage-specific procedural road lottery.
- **Tools:** may edit/interchange any efficient versioned format; JSON is
  provisional and not a human-readability goal (ADR-010).

The accepted 10km coastal road is currently the **only playable stage**.
Composition > inheritance, prefer small nearby sources, no speculative
entity or region abstraction. Do not change accepted coast visuals or handling
as a side effect of refactoring.

## Active data path

`content/stages/coast/{stage,road,scene}.json` ->
`src/content/coast-stage.ts` ->
`src/content/road-shapes.ts` and `authored-road.ts` ->
`src/content/authored-track.ts` ->
`src/content/coast-worker-road.ts` ->
`src/world.ts` + `src/road-worker.ts` (same road sample) ->
`src/streamed-scene.ts` (bounded chunks and safety gate).

The exact authored coast C02/E02 easing math is preserved. Game telemetry
and review access `coast-gameplay-sample.ts` and `coast-review.ts`, never a
Pilot/Trip candidate. Static GLBs are placed via the shared `static-props.ts`
loader and the coast terrain adapter. Long-lived coast effects remain their
existing capabilities until specific R4 requests.

Historical unused Brick/L2/Pilot/Stage/Trip composers, labs and old journey
joins were deleted, not hidden behind URL flags. Git history preserves them.

## Next work

R3 code migration and unit/regression CI are complete. See
[R3 closure notes](R3_ROAD_SYSTEM_CLOSURE.md) for exact evidence and
remaining owner-device acceptance.
R4: only as needed, decouple rice/flowers, water, shadows and vegetation from
coast-only conditions so hero scenery can be configured.
**New scenery regions/road extension are not yet agreed requirements**:
retain room for them without building speculative scaffolding.

Follow ADR-009 for streaming/lifecycle and ADR-010 for storage/tool
efficiency. P2 startup lag remains [Issue #32](https://github.com/michael-wang/OutRun/issues/32).


The retired canyon art route is no longer a dynamic import, and
`prebuild`/`predev` only bake the authored **coastal shoreline**.
Build-time canyon GLB downloading, inactive regional camera flags and
local Blender prototype serving were removed. Disabled city and canyon
stage-select images remain presentation placeholders, not gameplay.

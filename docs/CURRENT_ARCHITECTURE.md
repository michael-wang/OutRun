# Current architecture — R4 accepted / map remake handoff (2026-11-12)

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


## R4a — first configurable scenery capability slice

`content/stages/coast/effects.json` owns the **accepted** Ultra Water
wind/wave scales and FFT budgets, coastal vegetation-density transition,
and flower palette and two detail budgets. These are validated in
`src/content/coast-effects.ts` alongside the finite Stage data. The
existing water simulator, coast foliage producer and farm plot materials
consume those settings; their numerical defaults are unchanged.

One file changes only authored scenery parameters, **not** road layout,
race logic, terrain topology, lighting direction or shadow caster policy.
No hypothetical scene/region inheritance layer was introduced.
The next R4 task should address a concrete new scenery need rather than
expose every existing visual constant. GPU-expensive shadow *rendering* changes remain deferred until Pixel 8
profiling can guard its FPS budget.

## R4b — lighting and shadow configuration boundary

The same validated stage effects now hold sunset direction/strength,
hemisphere and fog, and the mobile/desktop shadow-map launch policy with
bounded texture sizes. The shared coast sun vector flows into the already
existing sky/water/scene/boat-shadow components. `coast-shadow-techniques.ts`
applies the stage preset **once on launch**; the pause/FPS diagnostic toggles
remain independent and reversible. Mobile 3D shadow maps stay disabled until
new device measurements support changing that policy.

No scene shader, shadow pass, caster assignment or route handling changes.
Unchanged lighting defaults should produce an identical scene.

## R4c — stage wind injected into particles

`src/coast-wind.ts` holds the existing farm RG8 gust texture and GPU
formula, plus a CPU sampler for airborne smoke. `effects.json.wind`
owns the single prevailing heading and physical air speed; the coast
farm shaders and one-sample-per-emitter CPU particles use the same
world-space gust and `elapsed` clock. `TireEffects` only accepts an
optional callback, so it knows nothing about coast stages.

The ocean's `windSpeed` remains separately tuned FFT wave forcing.
`docs/R4_LIGHT_SHADOW_WIND_AUDIT.md` records which historic shadow/light
layers are complementary and which are redundant or inactive. Avoid
deleting the active mobile projected fallback by accident.

## R4d — final visual slice and handoff

The current single coast stage now has a self-contained authoring
boundary: finite road and static scene, plus a validated set of ocean,
vegetation, flowers, global breeze, hero field waves, dusk lighting
and bounded mobile/desktop shadow presets. Rice and flowers use
wind-aligned travelling bands in their existing materials; sea FFT,
road handling and traffic remain unchanged. Particle wind is
injectable without making the general emitter depend on stage code.

Owner acceptance for R4d: normal starting smoke must not become one
featureless rectangle, rivals must have different small plumes, and
field ripples must be visible **while driving**, not only when parked.
Use Pixel 8 FPS and PC visual checks to catch regressions. Build +
retained unit tests still need to run locally (Github `dev` CI is
manual only). The post-R4 milestone is `v0.10.0` after acceptance,
never before; `main` needs separate owner approval.

Do not build a generic wind-field editor or a second FFT for crops
merely to close architecture. Future stages may author small local
field/wind overrides once they have a concrete visual requirement.
Startup P2 lag remains independently tracked.

## R4e — smoke finish; next physical-material seam

Per-emitter smoke has distinct stable tonal variation, local velocity
curls and a stronger, irregular puff silhouette. Its global drift still
samples one shared coast breeze, one call per active smoke pool per frame.
The existing 192/48-particle pools and two geometry buffers are retained.
The effect is visual only and does not affect skid marks.

The next proposed road contact work is **not part of R4**. The current
code already has separate `GuardrailContact`, `CoastStoneContact`,
`coastContactSurface`, `WheelContactPatch` and `EngineSound` hooks.
See `docs/NEXT_SURFACE_CONTACT.md` for the precise future seam; defer
implementation until the first concrete material or bump task.
The R4 architecture milestone still needs local build/test and
owner play acceptance before promoting the minor version.
 
## R4 acceptance → R5 map remake (2026-11-12)

Owner accepted R4a–R4e (scene authoring, visual parameters, wind and
smoke). The final R4c unit-test failure reported was a signed-zero
(`-0` versus `0`) edge case in calm `sampleCoastWind`, now returned
as canonical positive zero. The owner observed 437 passing tests
plus one failed assertion before the fix; the full suite must be
rerun locally to confirm green, not assumed from source review.

Development version is now **untagged `0.10.0` on `dev`**.
`main` and all deployed release tags remain unchanged until
the owner explicitly approves a public release.

The next active workstream is **hand-authored map remake**:
`docs/MAP_REMAKE_KICKOFF.md`. New road design is approved by
driving whitebox before scenery. See the mountain parallax
acceptance notes there; do not polish the old midground mountains
for a soon-to-be-replaced map.

## R5c — 30km authored route and scenic-direction data

Road content now defines a 30km playable race (HUD 350–30350),
with smooth height/bank, 21 turns, ten scenic-purpose chapters,
five Hero anchor locations, three risk windows and visible
coast-side protection. `COAST_DIRECTION` only validates/renders
metadata; `COAST_STAGE.road` stays authoritative for Worker,
physics, traffic and rendering. Shore baking switched to exact
XZ segment indexing for offline performance. The old 10km
mountain sheets were bounded rather than stretched.
All-new Hero assets remain a separate Blender/Geometry Nodes
scenery task, not accomplished by the road whitebox.

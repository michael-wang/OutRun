# Coastal stage — current authoring reference

The **one playable stage** is described by:

| File | Responsibility |
| --- | --- |
| `stages/coast/stage.json` | ID, seed, name, entry metadata |
| `stages/coast/road.json` | Finite curves, road grade, lane count |
| `stages/coast/scene.json` | Static prefab placement in road coordinates |
| `prefabs/catalog.json` | Local GLB assets and rendering flags |

The road starts at **350 m** in HUD coordinates, has **10,000 m** of
authored route, and reserves another **600 m** of safe post-finish road.
All control-point and prop distances are **absolute HUD metres**, not
relative to a 1 km Worker chunk. Curvature uses signed steering demand.
`road.json` is the sole road-shape source; do not hand-author the
historical placement compatibility projections.

Use `src/content/coast-stage.ts` for source validation,
`src/content/road-shapes.ts` for preserved accepted C02/E02 easing,
`src/content/authored-track.ts` for the road integrator, and
`src/content/coast-worker-road.ts` for the shared main/Worker runtime.
Other scenery/physics capabilities remain independent of this data.

## First data-driven static model

The initial proof of concept is the light original farmhouse
`public/assets/coast-props/r1-farmhouse.glb` at **1085 m**.
In Vite development, visit `/?at=985&prefabdebug=1` to see an accurate
GLB outline, its model path and the exact 1085 m marker. The overlay is
absent from production. For a normal view use `/?at=985` or
`/?at=3150` for the accepted coastal sweeper.

Change a prefab model path in `catalog.json` or its
`roadDistance` / `lateral` / `yaw` / `scale` in `scene.json`
without changing the engine. The `replaces` key suppresses the
preexisting procedural house that the GLB replaces.

## Scope and future data

R3 architecture cleanup removed historical random Pilot/Trip/Brick
road composers and experimental canyon preloads. It did **not**
artistically remake the accepted seaside route, Ultra Water, traffic or
handling. See `docs/R3_ROAD_SYSTEM_CLOSURE.md`.

JSON is a temporary authoring/interchange choice. It does not have
precedence over more efficient, indexed or binary runtime data when
representative stage scale demonstrates the need; see ADR-010.


## R4a — configurable scene effects

`stages/coast/effects.json` holds versioned **visual settings** for
Ultra Water FFT/wind/wave, beach vegetation density and its smooth
transition, and flower colors plus near/middle instance budgets.
`src/content/coast-effects.ts` validates it before streaming.
These settings preserve all accepted coast defaults. Change only the
target field to experiment with a look; the road remains in `road.json`.
Foliage transition distances are absolute HUD metres. The stage data
is an interchange representation, not a permanent commitment to JSON.
Sun, sky and shadow systems were intentionally **not** generalized in R4a.

## R4b — sunset appearance and shadow performance profiles

The same effects file now owns coast sunset direction, sun/hemisphere/fog
appearance and mobile/desktop shadow technique presets plus map-size budgets.
It keeps the **exact accepted values**. The shared sun vector still drives
the dome, water reflections, boat shadows and scene depth shadows.
The existing diagnostics can temporarily toggle shadow techniques at runtime;
they are not persisted as stage content.

Pixel 8 baseline: both expensive 3D shadow maps remain OFF, and map texture
budgets cannot exceed the approved sizes. Enabling them in authored mobile
content needs explicit device profiling and a validator change. No new Shader,
draw pass or shadow caster was added in R4b.

## R4c — world breeze and wind-aware airborne effects

`stages/coast/effects.json.wind` specifies a world-XZ unit heading, air
speed in metres per second, and gust response. The former
`coast-farm-wind.ts` is now `src/coast-wind.ts`: the original 64×64 RG8
texture and gust pattern remain, but a cheap CPU sampler also reads the same
noise source and time field. Rice and flower Shader gusts are unchanged
for the accepted coast heading; ornamental grass now follows that heading.

Players, rivals, traffic collisions and off-road dust use injected world
wind without changing tire marks, vehicle handling, collision rules or
the particle/draw-call budget. The sample is once per active emitter per
frame, not per smoke puff. The short exhaust-shift sprites and stationary
breakdown-engine smoke are separate legacy visuals, not yet wind-aware.

`ocean.windSpeed` remains an OceanSim **wave forcing** setting, not
physical air speed. See `docs/R4_LIGHT_SHADOW_WIND_AUDIT.md`.

## R4d — at-speed hero wind bands

`effects.json.heroWaves` holds separate rice / flower visual profiles.
The shader samples the **existing** RG8 gust and world-XZ stage wind
heading, then layers a coherent wave of larger wavelength. Stronger
rice movement and weaker flower movement are deliberately exaggerated
for the chase camera. `travelSpeedMps` is wave-*phase* travel only:
the underlying wind velocity, car physics and the Ultra Water FFT
spectrum are unchanged.

The startup tire smoke cadence is deliberately reduced at low vehicle
speed. Every rival has a stable plume seed, which changes launch timing
and small local curls. No new particles or draw calls are added.
The architecture is ready for R4 acceptance and a later `v0.10.0`
minor bump; that bump and public release are not automatic.

## R5a first-map onboarding

`stages/coast/road.json` owns the initial whitebox curves and
two manually authored S-curve bank envelopes. `stages/coast/onboarding.json`
owns A0–A3 lesson ranges, initial civilian traffic pacing, and
minimum random breakdown distance. These are validated by
`src/content/coast-stage.ts` and consumed directly by `Traffic`
and `createWorld`, without a new procedural Scenic Director.

R5a QA: `?r5qa=1` shows exact HUD distances and lesson IDs in Vite
development. The rest of the original stage is intentionally still
available while each new map slice is player-tested. Geometry Nodes
for scene production starts after the road whitebox passes.

## R5a.1 first-map driving revision

Opening lessons are now 350–1400 (launch), 1400–2320
(banked fast sweep), 2320–3050 (first civilian encounter),
and 3050–4710 (long banked S). Full details and banking
parameters live in `road.json` and `onboarding.json`.
These controls preserve **randomized civilian highway traffic**
after the scripted early introduction.

## R5a.2 / R5b drift road content

`road.json` contains the reauthored short opening, immediate
S crossover (optional `rampFraction` on both S sweeps),
and two first-map drift road curves. `onboarding.json` owns
A0–A3 timing, A5/A6 speed hints, the first civilian
introduction, the random-higherway resumption boundary, and
the earliest random breakdown. All distances are **absolute
HUD metres**. The first crashed-car tableau (A4) is
**reserved but not yet implemented**.

The first civilian is a guided encounter; subsequent traffic
is never hand-listed. Seed differences still change its
vehicle groups, type, speed and behaviors. Road and
terrain must use the same `coastWorkerRoad` geometry.

## R5b.1 curving traffic incident

`onboarding.json.accident` now describes the fixed authored
A4 road window at 4410–4890m, and its incident site near
4635m. Within it, `coast-accident.ts` creates two or three
seeded, angled, **physical** stopped-vehicle recipes. They
are consumed through the existing Traffic + RoadCones
system with shared obstacle/collision state, not merely
drawn by a scenery prefab. The outer two passing lanes
remain free for every allowed variant.

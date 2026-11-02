# Scenery Foundation R2.0 — Grand Canyon River Bend (first playable vertical slice)

## Goal
Prove that a memorable 1–1.5km canyon vista can be assembled from a
**small, curated scene template** while preserving the r10 city, accepted
R1 driving rhythm and Pixel 8 streaming architecture.

The route stays unchanged: no new physics, curves, elevation, banking,
width or route editor. A new `v0.9-r11` content revision preserves r10
replay exactly via `?revision=r10`; public `main` is not touched.

## Landscape contract
1. At trip generation, pick one existing canyon beat (prefer a sweeping
   scenic beat, >1450m and with established canyon biome throughout).
2. Plan one frozen `GrandCanyonScene` with absolute road distances,
   valley side, **fixed world-Y river level** based on the lowest road
   elevation minus 50m, width and seed. Put it in the route fingerprint.
3. Worker terrain and scenery read that same plan. The inner hillside,
   road cut, river trench, low far shore and distant rim are all evaluated
   from the same cross-section height function. Scene transitions ease
   over 180m on either end; bridge/merge/city sections are excluded.
4. In the demonstration only, triangulate the old single wide left-side
   terrain strip into smaller bands (not a new global terrain engine).
   A 20m river uses an existing water material, with world-space XZ
   positions following the valley and its Y elevation held fixed even
   while the road climbs or descends. River geometry and terrain end
   at identical absolute chunk coordinates.
5. Sparse low-poly red sandstone outcrops share the ground sampler.
   Disable the old `base.y=-8` floating mesa placement in this
   demonstration. Keep the existing guardrails and collision logic:
   distant rocks are scenery, not new roadside collision hazards.
6. One QA category, **大峽谷河灣 R2**, jumps just before the authored
   scene and explains its dimensions. No frame-time classification,
   procedural terrain updates, or per-frame spawning.

## Performance safeguards
- One scene per seed, only ~1.5km of the full 69km journey.
- Extra terrain subdivisions only inside the scene; the rest of the trip
  reuses the r10 Worker geometry, water material and material batching.
- Low-frequency, seeded color/landmark variation and sparse instances;
  no extra shaders, persistent world mesh or new camera.
- Prototype must survive streamed 1km chunk seams and road-clearance
  regressions; Pixel 8 FPS and worker preparation times remain human
  acceptance criteria rather than assumed successes.

## Manual QA
Use `?qa=1&seed=1` then **大峽谷河灣 R2 (1)** and **試駕**.
Compare exactly the same bend with `?qa=1&seed=1&revision=r10`.
Observe: clear inner cut slope, deep outer valley, a visible river,
an elevated opposite rim, no floating mesas, no river rising with the
road, no terrain seam, and no disappearance at the end of a chunk.
Repeat on Seeds 2 and 7 and watch Pixel 8's FPS and Preparing road.

## Limitations and next step
This is a **road-constrained valley cross-section**, not yet a general
2D world-space heightfield, erosion model or geographically-aware
road composer. The fixed-world-height river and shared ground query
are the first foundation. Do not falsely claim every mountain biome
is now grounded. The next iteration should evaluate 2D terrain tiles,
remote road overlap/occlusion, and river/road world-space intersection
before extending the method to other sites or adding balloon assets.

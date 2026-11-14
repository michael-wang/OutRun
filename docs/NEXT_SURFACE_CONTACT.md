# Next engine slice — material-aware contact and authored road relief

Status: **accepted design direction / deferred implementation**, 2026-11-12.
Not a prerequisite for `v0.10.0` or completion of the current coast.

## Current usable seams

- `WheelContactPatch` already reads true triangles and contact normals,
  but returns primarily `onRoad`; it does not yet give each wheel a
  driving-surface material and associated grip.
- `handling.step` uses one off-road drag penalty and an arcade grip
  model; it has no per-surface friction input.
- `EngineSound.surface` is currently a generic off-road/gravel channel.
  `EngineSound.impact` already differentiates metal, concrete and soft
  impacts. Those audio decisions should be driven by one contact event
  rather than new per-object sound dispatch.
- `GuardrailContact` checks continuous corridor boundaries and responds
  with speed/yaw/lateral impulses. `CoastStoneContact` separately checks
  individual stone slots with swept impact detection. Their **geometry
  and mass are different**, even when both make contact with concrete.
- `coastContactSurface` already chooses metal/concrete/soft for a
  specific boundary impact. It should remain grounded in visible
  objects; never make invisible grass produce concrete sparks.
- `src/content/authored-road.ts` authors smooth centreline elevation,
  and `road-chunk.ts` plus wheel probes sample the true road geometry.
  Large slopes/cross-slope exist, but localized bumps/ruts are not yet
  authored as a separate meaningful driving input.

## Future implementation in small, useful steps

1. **Surface identity (first real request):** include a simple
   `surfaceId` with the road mesh/contact triangles, and return that ID
   from each wheel's real contact. Example IDs: asphalt, grass, gravel.
   Do not infer friction from color or from decorative road-edge meshes.
   One authoritative road-contact mesh drives both the rendered surface
   and physics.
2. **Response tables, no class hierarchy:** a tiny table for each
   wheel-contact material can supply relative grip, rolling/drag cost,
   sound family and particle family. Keep arcade steering feel as the
   baseline; never use realistic friction values blindly.
3. **Obstacle contacts remain geometry-first:** continuous metal rail,
   discrete heavy concrete stone, flexible grass/ground are NOT
   interchangeable collider shapes. After geometry determines whether,
   where and how hard the car hit, dispatch a common event to the
   relevant response: heavy stone = larger speed/yaw penalty and blunt
   dust/crunch; metal = medium deflection and scrape/sparks; soft ground
   = speed absorption, low heading impulse and grass shards.
4. **Road relief only when needed:** author a finite `distance, lateral,
   relief` feature with smooth joins. Feed it to the same road sampling,
   Worker geometry, wheel rays, car pose and collision / AI logic.
   Never add a visual-only bump that the vehicle can phase through.
   Guard chunk boundaries and frame-rate-independent traversal.

Wet pavement, puddles, mud, hydroplaning and a full weather/material
framework are **explicitly deferred**. The first non-asphalt test should
prove one end-to-end material response before adding more IDs.

## Acceptance cases

- Stone vs metal vs grass have demonstrably different sound, physics
  and particles, with no phantom contact between spaced stone blocks.
- Asphalt -> grass -> asphalt changes wheel grip/drag smoothly and
  deterministically, without destabilizing steering or getting stuck.
- One authored bump visibly lifts the wheel and car and causes a
  corresponding physics response; no Worker/render/collider mismatch.
- Pixel 8 FPS and loaded-road safety remain at accepted baseline.
- Prefer focused unit/road-contact tests plus owner playtests; do not
  gate releases on long flaky screenshot tests.

## Guiding rule

A physical contact returns **where and what was hit**. The driving
simulation determines the response. Audio/particles render that event.
Stage data describes material and geometry. Do not make the soundtrack,
grass Shader, or a generic manager decide vehicle physics.

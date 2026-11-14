# R4 — light, shadow and wind audit (2026-11-12)

This is a source-level review. It does **not** replace side-by-side screenshots,
Pixel 8 FPS profiling or a complete build/test run.

## Lighting and shadows: conflict checklist

| Active capability / historical path | Actual role | Current judgement |
| --- | --- | --- |
| `world.ts`: hemisphere + near/far directional suns | Shared dusk hue; near 0.65 and far 1.15 light intensities, separate shadow receivers | Intentional composition, **not** duplicate sunlight |
| `CoastShadowCache` near dynamic + rolling static depth | PC geometry silhouettes; static refresh every 240m or scene revision | Keep; **both off by default on touch devices** |
| `coast-road-shadows.ts` | No distant static-depth sample on asphalt, prevents known road shadow rectangles | Keep, regression guarded |
| `StreamedScene.refreshEssentialShadows` | Mobile static projected footprints only when static map OFF and decals ON | Fallback, avoids double static shadows |
| `MobileCarShadow` + `TireEffects` | Mobile projected vehicle footprint vs. actual skid traces/smoke | Different visual jobs, not duplicate depth passes |
| `CoastDuskShadows` legacy projected car/beach | Constructed only when `coastGeometryShadows()` is false; current product always requests the geometry-shadow infrastructure | **Inactive legacy route**, but its shared static footprint material IS active in streamed chunks; delete surgically, not blindly |
| Ocean boat depth / analytic rock silhouette | Water surface receivers; separate from road/land shadow maps | Keep, different receivers and GPU costs |
| `coast-lamp-lighting.ts` | Single local point light plus lookup atlas; pole occlusion on desktop ground | Different from global sunset; keep |
| `coast-inland-fog.ts` and `coast-sand-light.ts` | Material-level fog reduction for hills and wet-sand sunset sheen | Purposeful material treatments, not second sun/sky |

**Genuine redundant source of truth corrected in R4c:** the old
`coast-ocean.ts` `?sunshadow=0` URL toggle was overwritten by
`main.ts`'s shadow-technique settings at launch. The boat shadow now
initialises from the validated stage profile; the live A/B tool still
changes the same runtime switch.

`COAST_SHADOW_GROUPS` (caster categories) coexists with technique/pipeline
switches, but the older group layer is not the current pause diagnostic UI.
They are different levels of control; avoid reviving both as competing
player settings. A source-level overlap does not establish double rendering.

## Wind: the concrete mismatch that R4c addresses

Before R4c, rice and flowers shared a deterministic 64×64 wind texture
and an advancing shader gust, but flower grass had a separate **65-degree**
wind heading. Ultra Water independently used `ocean.windSpeed=6` as
spectrum forcing. Player/rival/traffic tire smoke had only wheel-derived
initial momentum, exponential drag and buoyancy, so it visibly ignored the
moving rice field.

R4c makes the existing RG8 gust texture and shader formula the single
shared coast gust source in `src/coast-wind.ts`; a CPU twin samples the
same RG8 data at world XZ and the same `elapsed` clock. The accepted
eastward/inland (+X) prevailing heading remains 1,0 in stage data; flower
grass now follows it. The CPU sampler supplies velocity in m/s for smoke
advection. It is injected as a callback into `TireEffects`, so there is
no new weather base class, no cross-layer physics dependency and no
per-particle gust lookup. Skid marks remain fixed to the road.

**Explicit scope boundary:** OceanSim's wind is not a physical coast air
velocity until a future ocean coupling task says so; don't silently
overwrite validated waves. Separate short-lived exhaust-shift sprites
and stationary breakdown-engine smoke still use their existing visuals.
If future review wants these affected, inject the same sampler into their
bounded pools without replacing the particle engine.

## Deferred cleanup

The legacy `CoastDuskShadows` draw path and old diagnostic caster-group
mutations are candidates for deletion only after verifying the shared
streamed mobile fallback remains correct and owner-device FPS/visual
acceptance is available. Avoid speculative shadow-layer unification.

## R4d visual decision: readable motion over duplicated simulation

- The existing Tessendorf FFT ocean is preserved. Rice and flowers
  use an extra coherent phase ridge inside their existing vertex
  shaders, modulated by the original local gust pattern. This gives
  broad moving bands at driving speed without additional FFT buffers
  or particle simulation. Flower wave amplitude/contrast are lower
  than rice, all values stage-authored in `heroWaves`.
- Stable per-rival smoke seeds now affect birth randomness, small
  local velocity curls and launch cadence. Burnout emission and
  opacity are reduced when near-stationary, preventing the solid
  translucent wall seen in starting-grid screenshots.
- The per-stage global breeze is physical velocity for airborne
  effects; rice/flower phase speed is cinematic art direction. A
  future stage's local wind zones can layer on top of the global
  field with bounded blending, but this has no immediate requirement
  and is **not** part of the first playable coast.
- R4a–R4d content, scene effects and environmental inputs are ready
  for owner-device acceptance. No `main` promotion, public release
  or `0.10.0` minor bump is implied by source commits.

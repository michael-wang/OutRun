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
Sun, sky and shadow systems are intentionally **not** generalized in R4a.

# Coastal Highway — portable scenic-site contract (R0)

Status: **R0 implemented for GLB static props and hero marker locations**; broad terrain/ocean/legacy TypeScript generators still require later integration. No road, AI, ocean or collision changes.

## Separate three responsibilities

1. **Asset library** — `content/prefabs/catalog.json` identifies approved reusable GLBs. No asset has an assumed HUD metre.
2. **Scenic packages** — `content/scenery/packages.json` groups local-space members referencing prefab IDs. An asset does not know which stage or site will use it.
3. **Stage layout** — `content/stages/coast/scenic-layout.json` provides a site's actual HUD anchor, road-relative orientation and lateral placement. `heroAnchors` are the single *authoring* owner of nine hero marker metres.

`npm run scenic:build` projects this authoring content into the *existing* runtime files:
- `content/stages/coast/scene.json`: GLB static prop placements.
- `content/stages/coast/direction.json`: hero-slot distances (labels, side, lookAheadM, brief and chapters remain there).

Both output files remain version-controlled so the current game, Worker exports and QA can read them unchanged. **Do not hand-edit generated positions.** Run `npm run scenic:check` to catch drift, or `npm run scenic:build` after editing a movable site.

For a small site, package members use `forwardM` along the road and `rightM` to the road's right, local `yaw`, `scale`, and `heightOffset`. The compiler rotates these offsets by the site yaw and computes each member's **absolute HUD metre and road-right lateral offset**. The existing static GLB loader then samples the real road at each member. Yaw is road-relative; it is not baked into a model. A single package may be placed at many different sites without duplicating GLBs.

### How to move the future Sail Bay

When the sail-bay package has approved component assets, a stage-site entry can look like:

```json
{
  "id": "sail-bay-site",
  "package": "sail-bay",
  "heroId": "bay-entrance",
  "lateral": -95,
  "yaw": 0.1,
  "scale": 1
}
```

Its anchor comes from `heroAnchors` where `id === "bay-entrance"`. To move the site, edit **one** `roadDistance` in `heroAnchors` and run `npm run scenic:build`. The generated GLB placements and director hero marker move together; `packages.json` and `catalog.json` do not change. The same rule applies to the working harbour.

The first committed example is only the existing **1085m farmhouse**, not a completed sail-bay or harbour module. R0 tests use a temporary mock site to prove portability, without spawning a farmhouse in the water.

## Strict scope / known follow-ups

- **R0 supports static GLB props only.** Existing TS procedural scenery, Ultra Water shore boundaries, traffic AI, accident actors, guards/collisions and terrain generators are **not moved by this tool yet**. Do not claim a full scenic relocation works until they are adapted.
- A reusable **boat** remains an asset. A reusable **bay** adds a local scene layout. Ocean waterline, pier grounding, coastline masks and boat buoyancy/animation need specific marine adapters, not generic Y offsets.
- Wide bays or long cliffs require **parametric terrain/shoreline adapters** that conform to the target road curve, grade and ocean boundary. These may regenerate terrain *connections* while reusing rocks/boats/buildings. A multi-hundred-metre scene should not be blindly rotated as one giant mesh.
- Keep safety infrastructure and collision tied to the existing shared authored road; moving scenery must never create invisible unsafe walls, occlude apexes or move accident/AI rules.
- The original farmhouse's legacy `replaces` source stays tied to its old legacy emission point even if the new package moves; this prevents the old generated duplicate from returning.
- Direction hero slots must stay at distinct metres on the current **350–14550 HUD road**, and pressure gates remain authoritative for gameplay. Reorder hero distances by changing anchors; the compiler sorts generated hero markers.
- Do not rebuild models or make arbitrary repo-wide abstractions to support moves. Add adapters only when one concrete approved hero scene requires them.

## Commands / acceptance

```sh
npm run scenic:check  # detects generated scene/direction drift
npm run scenic:test   # move-test with identical prefab/model catalog
npm run scenic:build  # writes output only after an intentional authoring edit
npm run verify:dev    # full local checks before pushing dev
```

A passing portability test checks: (1) moving a hero anchor changes its director marker, (2) GLB placements belonging to a hero-linked site follow it, (3) the prefab ID, catalog model path and package membership are unchanged. Visual QA must still judge composition, shoreline, elevation and sightlines at the new location.

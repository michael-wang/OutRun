# Stage Content (authoring only)

- This directory is data, not a new engine. Prefer changing a stage JSON, Prefab JSON or GLB instead of touching TypeScript.
- `stages/coast/scene.json`: the placement source of truth (absolute road metres, lateral offset, yaw in radians, scale). Do not make item-specific if-statements in the renderer.
- `prefabs/catalog.json`: maps prefab names to local GLB paths and minimal rendering flags. A different model must be swappable here without editing engine code.
- Prefer reusing existing rendering/physics/effects. Do not add a universal entity framework or speculative object capabilities.
- GLBs must have cleared provenance and reasonable mobile geometry/material counts. If the model has a different local origin, fix the asset or placement data.

- `stages/coast/road.json` is the authored source of road turns/elevation. Distances are **absolute HUD road metres**, shared with scene placements. Do not reintroduce per-turn TypeScript or speculative random composers.

- R2c: coast track spans and frames are built by `src/content/authored-track.ts` from road JSON. The `placements` view is legacy compatibility only; do not author it separately.

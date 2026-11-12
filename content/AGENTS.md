# Coastal stage content rules

- Stage content is data, not a second engine. Keep the authored stage in
  `content/stages/coast/{stage,road,scene}.json` and the prefab registry
  in `content/prefabs/catalog.json`.
- `stage.json` owns stage identity, seed and starting conditions.
  `road.json` owns finite road turns, elevation and lane count.
  `scene.json` owns static prefab placements.
- Road and static-prop positions use **absolute HUD metres**. Yaw is
  road-relative in radians. Fix asset origins in the model or placement;
  avoid model-specific if-statements in rendering code.
- GLB swaps require only a catalog path change, without engine changes.
  Keep the terrain-height and resource-disposal adapters working.
- Accepted road easing is implemented in `src/content/road-shapes.ts`.
  The game and Worker share `src/content/coast-worker-road.ts`.
  Do not restore deleted Trip/Pilot/Brick random road planners, dormant
  chapter handoffs or the abandoned canyon art preload.
- Prefer existing reusable engine effects; do not invent speculative
  regions, base classes or a generic entity framework.
- JSON is a **provisional interchange**, not an efficiency/readability
  requirement. Profile representative dense scenes and build range-query
  tooling before selecting binary runtime chunks. See ADR-010.
- Current technical map: `docs/CURRENT_ARCHITECTURE.md`. R3 completion:
  `docs/R3_ROAD_SYSTEM_CLOSURE.md`.

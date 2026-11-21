# Coastal stage content rules

- **Movable scenic sites (R0):** `scenic-layout.json` owns nine hero HUD anchors and site placement; `content/scenery/packages.json` owns reusable, metre-free kits. Run `npm run scenic:build` after modifying either and `npm run scenic:check && npm run scenic:test` before push. `direction.json` hero positions and `scene.json` GLB positions are generated projections, not independent authoring sources. See `docs/COAST_PORTABLE_SITES.md`. This R0 tool does NOT relocate legacy TS scenery, water boundaries or collision.
- Stage content is data, not a second engine. Keep the authored stage in
  `content/stages/coast/{stage,road,scene}.json` and the prefab registry
  in `content/prefabs/catalog.json`.
- `stage.json` owns stage identity, seed and starting conditions.
  `road.json` owns finite road turns, elevation and lane count.
  `scene.json` contains the **generated runtime projection** of static prefab placements;
  author site positions in `scenic-layout.json`, not by hand-editing the generated output.
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

- R4a: `stages/coast/effects.json` contains validated Ultra Water,
  vegetation and flower settings; do not duplicate those constants in
  effect producers. Keep Pixel 8 FFT and flower budgets within the
  validator, and keep shadows unchanged unless explicitly requested.
- R4b: light colors/direction, haze and GPU shadow launch profiles are
  stage settings in the same file. Preserve approved mobile-fast defaults;
  live shadow diagnosis remains a separate runtime switch, not stage content.

- R4c: `effects.json.wind` defines the shared world-XZ breeze; the
  deterministic noise texture and CPU sampler in `coast-wind.ts` drive
  both farm shaders and particle advection. Flower grass uses the same
  heading. Don't create a second wind-direction constant for new content.
- Keep OceanSim's `ocean.windSpeed` distinct from real air velocity:
  the first tunes FFT wave excitation, the second advects particles.

- R4d: `heroWaves.rice` and `heroWaves.flowers` set *visual*
  wind-band wavelength, speed, sway and contrast; they do not alter the
  physical shared wind or ocean FFT. Render them within the existing
  field materials, never as a second ocean simulation.

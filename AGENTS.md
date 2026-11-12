# 極速漫遊 / OutRun — current project rules

Original Three.js / TypeScript / Vite arcade racing game. **Only the coastal race is playable.** Future stages will be hand-authored; the former L1/L2/L3 random route catalogs, procedural director and dead
canyon asset loaders have been deleted; they are **not** requirements. See [current architecture](docs/CURRENT_ARCHITECTURE.md) only when making architectural changes.

## Engineering

- Optimize for the **smallest relevant context**. Prefer composition over inheritance; avoid speculative frameworks, deep abstractions, duplicate implementations and future-proofing without a concrete use.
- Separate engine capabilities (geometry, rendering, physics, effects, streaming), game rules (racing, traffic, controls), and stage content (authored geometry, placements, assets). A scene-content edit should not require a gameplay engine edit.
- Preserve the approved coastal gameplay, physics, water, visuals and Pixel 8 performance unless the task explicitly changes them.
- Stages are **finite**. Keep road safety, bounded asset lifetime, shared resources and chunked loading. Never drive into missing road. Details: [ADR-009](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).
- **Data format debt:** JSON is provisional. Dense stage assets need measured transfer/parse/memory costs and range-queryable tool access; readability is not the goal. See [ADR-010](docs/ADR_010_STAGE_DATA_FORMATS.md).
- Before adding an effect, check existing reusable capabilities. Do not keep old code because it *might* be needed later. First remove dependencies, then delete obsolete code; Git history preserves it.

## Workflow / release

- Work on `dev` by default. Only promote to `main` on **explicit owner approval**; never force-push or move released tags. Ordinary `dev` pushes must not deploy.
- Development snapshots increment the patch version in `package.json` and lockfile (`0.9.44`, `0.9.45`, etc.), with no `-dev.N` suffix and **no development tag**. Untagged `dev` version numbers are not public releases. Public releases still require owner approval, a new `main` commit and an immutable annotated `vX.Y.Z` tag for the deployed commit. The owner accepted R4 architecture on 2026-11-12; `dev` now uses untagged `0.10.0` (not a public release). Never reuse a previously tagged version.
- **P0 / Blocker:** cannot load, start, or meaningfully play; blocks release.
- **P1 / Critical:** significant gameplay loss, serious crash or broken recovery; **tell the owner**, who decides whether to publish. P2/P3 cosmetic or tuning defects do not block.
- Keep release CI lean: dependency install, production build, deterministic P0 checks; P1 checks are advisory. Visual feel, controller behavior and device FPS are primarily owner playtests. Do not turn slow/flaky Playwright screenshots into deployment gates.
- Run only relevant verification for the task and state clearly what was not run. See [tests guidance](tests/AGENTS.md) for tests-only work.

- Retired chapter handoff is removed from `main.ts`. Never restore it for future scene changes; extend authored stages only when an actual multi-region experience is specified.

## R3 closure
- Only `content/stages/coast` is a playable stage. Removed Brick/L2/Pilot/Stage01/Trip generators and their old reviews and Journey-mode tests: do not restore dead pipelines.
- Authored C02/E02 math is in `src/content/road-shapes.ts`; the game and Worker share `coast-worker-road.ts`. Review the small active flow in `docs/CURRENT_ARCHITECTURE.md` before adding new road logic.


- R4a/R4b/R4c stage effect settings live in `content/stages/coast/effects.json`
  and are validated by `src/content/coast-effects.ts`; do not recreate
  hard-coded ocean/vegetation/flower/sunset/shadow/wind defaults in their producer modules.
- When working with local Codex, run `npm run verify:dev` (build + all
  retained unit tests) **before** pushing to GitHub. GitHub release
  validation remains a separate authority for `main`; physical play
  is still owner acceptance.

- CI cost policy: `dev` pushes and draft PR synchronizations never
  trigger automatic builds. For local Codex first run `npm run verify:dev`
  before pushing; optionally dispatch `Dev checks (manual)` from Actions.
  Main-push release validation remains automatic.

## R4c shared environmental wind

- `content/stages/coast/effects.json.wind` is the directional world-XZ air
  velocity. `src/coast-wind.ts` owns the accepted RG8 gust pattern and its
  CPU sampler. No per-particle gust sampling or ad hoc wind randomisers.
- Airborne effects receive an optional wind callback; do not tie weather to
  steering, collisions or the graphics engine. Keep skid marks anchored.
- `ocean.windSpeed` is a wave-spectrum excitation setting, **not**
  physical wind speed in metres per second. Do not conflate the two.
- Light/shadow overlaps and inactive legacy fallback paths are documented
  in `docs/R4_LIGHT_SHADOW_WIND_AUDIT.md`; remove only with targeted
  tests and visual/FPS acceptance.

## R4d: readability and acceptance

- `heroWaves.{rice,flowers}` in coast effect data are *visual* wave
  parameters. The `travelSpeedMps` phase velocity is **not** the air
  velocity sampled by particles and must not change car physics.
- Keep sea Tessendorf FFT exclusively in Ultra Water. Field waves are
  wind-aligned shader bands using the existing gust field and shader
  time: no new FFT render targets, texture uploads or worker.
- Rivals' starting smoke is intentionally sparser and deterministically
  distinct per car. Preserve the same bounded particle geometry and
  independent skid marks.
- R4 architecture is owner-accepted on 2026-11-12. The known R4c signed-zero
  assertion was corrected in `0.10.0`; rerun the full local tests before
  considering any public release. No automatic `main` promotion.

## R4e finishing pass / next material capabilities

- `TireEffects` keeps one bounded instanced shader/material family and
  deterministic smoke palettes/curls per rival. All plumes share the same
  real sea breeze, but local turbulence and shading may differ. Do not
  change drift physics or create one independent GPU program per car.
- The next engine/material work is **not** a prerequisite to `v0.10.0`.
  See `docs/NEXT_SURFACE_CONTACT.md`: surface identity (per wheel),
  obstacle geometry, impact response, sound, particles, and road relief
  must meet via small explicit inputs, without a generic entity system.
 
## R5 next phase — authored map remake

- Prioritize road driving feel: bold sustained sweeps, truly distinct S-bends,
  larger deliberate banking and height transitions, and readable recovery
  straights. Build and drive the road whitebox before placing hero scenery.
- See `docs/MAP_REMAKE_KICKOFF.md` for the first authoring/acceptance slice.
  Do not revive the procedural Scenic Director or historical second-stage data.
- Mountain and foreground geometry need consistent spatial depth. Avoid
  using a near-visible midground as an infinitely distant fake backdrop;
  inspect motion parallax at speed as well as screenshots. Current old coast
  mountain implementation is not a required map-remake target.

## R5 first-map onboarding and art workflow

- The first coast remake is a **progressive driving introduction**, not
  a maximal-intensity corner demo. Lesson sequence: straight acceleration,
  non-drift sweeper, first civilian traffic, banked S-curve, first avoidable
  multi-car accident, two progressively harder drift corners. Afterward
  alternate hero scenery with racing challenges and finish sprint.
- Eight race rivals remain from the start; control *civilian* traffic
  and staged hazard unlock zones independently, with reproducible seeds.
  Do not spawn unavoidable accidents or completely block the tutorial.
- Read `docs/R5_FIRST_MAP_DIRECTOR.md` before road/traffic changes and
  `docs/R5_ART_PIPELINE.md` before Blender asset workflow changes.
  For new geometry, author one road-space truth shared by Worker, player,
  AI, renderer and collision. Validate at speed and on Pixel 8.
- Blender is an **offline production tool**, not a second gameplay engine.
  Prefer Geometry Nodes, light meshes, LOD and glTF for gameplay scenes.
  Blender 5.3 Gaussian Splat import is an optional static-scene
  reference/POC, not required mobile runtime art or renderer migration.

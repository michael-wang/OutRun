# 極速漫遊 / OutRun — current project rules

Original Three.js / TypeScript / Vite arcade racing game. **Only the coastal race is playable.** Future stages will be hand-authored; the former L1/L2/L3 random route catalogs, procedural director and dead
canyon asset loaders have been deleted; they are **not** requirements. See [current architecture](docs/CURRENT_ARCHITECTURE.md) only when making architectural changes.

## Coastal art production (November 14)

- Art direction: **Style Option B for vehicles, people, scenery and coastal sunset mood**. Read `docs/COAST_ART_BIBLE.md`, `docs/COAST_HERO_VEHICLE_ART.md` and `art/reference/coast/README.md`. The reference README lists the approved PNG and its checksum.
- Female protagonist: the owner-approved heroine 3-view sheet is **new canonical character identity** (see `docs/art-review/h1ar/README.md`, Issue #38); do NOT remodel this identity from the older Style B sample or treat old procedural H1a face as accepted. First produce real Blender-editable 3D mesh and owner-approved renders, not game integration.
- **Technique-first art gate:** before assigning Codex any new detailed asset family or recurring effect (hair, forest, grass, rocks, fields, ocean, crowds), Julia compares domain-appropriate techniques/tools, chooses the smallest credible method for Style Option B and Pixel 8, and defines ONE visual/efficiency experiment. Do not reflexively generate meshes/vertices in TypeScript or default to Blender for every problem. Record a short rationale, keep the accepted baseline, and avoid large implementation until a representative prototype earns owner approval. Minimize Codex quota; no paid services without an explicit budget decision (currently NT$0 extra). See `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md` for Julia/Codex's 7-question preflight, visual gates, and when to remind owner about costly decisions.
- The recurrent Riviera 62, driver/passenger, rivals and traffic are **S-tier focal assets**. Keep approved identity; audit before remodelling. This vehicle/character track runs early, in parallel with scenery.
- Make scenic content portable: asset library → `content/scenery/packages.json` → `content/stages/coast/scenic-layout.json`. Run `npm run scenic:build` to regenerate the existing runtime `scene.json` and hero positions in `direction.json`. Do not hard-code a site kilometre into an asset. See `docs/COAST_PORTABLE_SITES.md` for R0 limits.

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

## R5a.1 (first playable slice, v0.10.2 on dev)

- The first three old road turns have been replaced with A0/A1/A2/A3
  onboarding beats, a dramatic banked first sweeper, and two
  authored S-curve bank envelopes in
  `content/stages/coast/road.json`. The rest of the coastline is
  still the old playable placeholder.
- `content/stages/coast/onboarding.json` is the single source for
  teaching windows, the first civilian encounter, the traffic gap
  around the S, and the earliest possible random breakdown.
- The eight racing rivals still launch together. R5a disables the
  separate 300m *civilian* entry feeder, preserving a clear first
  lesson. R5b must implement actual crash-tableau events.
- `?r5qa=1` is development-only and overlays exact lesson IDs and
  HUD metres. `?at=1400&r5qa=1` targets A1; `?at=3050&r5qa=1`
  targets A3. Use `?trafficSeed=42` for deterministic encounters.
- No Blender terrain or Geometry Nodes art is in this first
  whitebox. Verify the road and steering first, then run a single
  Geometry Nodes asset experiment for scenery before scaling production.

## R5a art-guide bridge

- `npm run r5:road-guide` exports the game/Worker's exact road
  sampler into an ignored local JSON guide.
- `scripts/blender/r5_guides.py` loads the guide as Blender curves
  and creates a **preview** Geometry Nodes scatter. It does not
  own road physics, collision, terrain material decisions, or a
  shipping GLB. Blender execution/inspection remains a local Codex
  responsibility until a Blender runtime is available.

## R5a.1: source-of-truth and light-index limitations

- Only the first civilian encounter is curated for teaching. Past the
  opening S, encounters remain **seeded random** with differing vehicles,
  gaps and behavior. Don't turn the rest of the road race into a script.
- Preserve a forgiving high-speed first sweep; use a large, readable
  bank instead of surprising the player with drift-only curvature.
- Tests asserting fixed old sunset viewpoints are obsolete after
  the road remake, but seam/geometry/collision safety is not.
- Legacy `coastLampAtlas` indexes nearest lamps in world Z only;
  curved road segments can overlap lighting volumes. A proper
  2D/road-space lookup belongs to new-map scenic/night-lighting QA.

## R5a.2 / R5b drift whitebox — dev v0.10.3

- R5a lesson windows: A0 350–900m acceleration; A1 900–1900m
  big banked sweep; A2 1900–2700m first sparse civilian; A3
  2700–4340m continuous S. Left curve END = right curve START
  at 3520m, no 140m artificial straight. Its authored C02
  `rampFraction=.08` shortens only the S's transition; other
  bends retain the original 0.2 C02 default.
- R5b drift whitebox: A5 5100–5640m demand +.82, A6
  6280–6760m demand -1.02. Keep a long clear recovery between
  them, with the second requiring greater driving precision.
  Developer-only `?r5qa=1` can preview both lessons; the first
  road-side accident (A4) is still a future physical hazard task.
- Only the first civilian introduction is curated, at/after
  2200m. General highway traffic resumes seeded randomness
  at/after 7120m, following the second drift; random breakdowns
  are excluded until/after 7560m. Do not hard-code ordinary
  traffic encounters beyond the teaching corridor.
- Geometry and collider share the authored road and Worker
  sampler. Drift curves should never collide with a nonlocal
  part of their road, create an unstreamable chunk or make
  the player face a sudden scenery obstacle.
- These are code/data commits, not a claim of local Vite,
  Vitest, browser or Pixel 8 verification. Use
  `npm run verify:dev` before accepting R5b.

## R5b.1 A4 incident rules

- The new A4 is a **moderate curving-road** obstruction,
  not just two cars on a straight. It uses the same world
  sample as the driver, the Traffic pool and rival obstacle AI.
- `coastAccidentLayout()` places 2–3 real stationary vehicle
  actors with seeded positions and yaw, leaving at least
  TWO full lanes physically passable. Preserve these safety
  guarantees when changing seed variants.
- `stopYaw` must agree across traffic body matrices,
  shadow pose, swept collision and AI projected bounds.
- One three-triangle warning approach is enough; don't
  duplicate warnings for each incident actor.
- A5/A6 drift roads have passed owner play acceptance;
  DO NOT move or retune them while polishing this scene.

## CI and Codex local verification

This GitHub-only editing environment cannot run the owner's Windows
local Vite/Vitest/Playwright or Pixel 8 tests. For code changes, local
Codex should check out latest `dev`, run `npm run verify:dev`,
fix **all** failing tests in the same task, then push the corrected
commit. GitHub `dev` push must not trigger expensive CI.
Never mark a source-only static audit as passing Vitest.

## R5b.2 player-feedback constraints

- The first A4 accident is a forgiving RIGHT OUTSIDE lane teaching
  event with two angled cars; normal seeded highway traffic and
  later random-lane incident capability remain intact.
- Movable wreck impulses live only in `RaceTrafficWorld`, which
  owns all traffic and race obstacle state. Don't move rendering
  instances independently or run an additional rigid-body engine.
- Warning reflector collisions are processed from player sweeps
  and rival/civilian sweeps against the same one-shot pool.
  Off-camera contacts remain authoritative.
- Gamepad: first fresh confirm MUST act on the first press;
  held button across screen transition MUST NOT confirm twice.
  Include menu first-press and first driving-frame regression tests.
- Repo-only commits still need local `npm run verify:dev`
  performed by Codex before calling the work technically verified.

## R5b.3 — warning signs / stage exit bug regressions

- R5b.4 supersedes the R5b.3 sign decision. RivalRace plans around
  traffic and displaced wrecks. Player, rival and civilian sweeps can
  knock warning signs through the shared RoadCones pool at race speed.
- Each small prop takes one impulse per race. After the throw, its
  displaced pose persists through streaming and checkpoint recovery.
  Reflectors settle face-down or face-up on the banked, pitched surface.
- Exiting through pause `回到主選單` must hide the full-screen
  `#game-loading` overlay before re-mounting the stage selector,
  or the stage select is present but covered by the old loading art.
- Run `npm run verify:dev` and exercise these cases with local
  Codex and one real PS4/PC gamepad before shipping main.

## Current sunset sprint — dev v0.10.13

- The first 4.0km of racing teach the seven lessons (stations 350–4350m).
  The slow bus already moves during the opening sweeper. Test catching it on
  the exit before the S. All coastal incidents share one approach per group.
  The race covers 14,200m from HUD 350m to 14,550m with 600m of relief.
  The first sweep is level. Keep the seaward shoulder low at the visitor beach and sunset seawall.
  Current geometry and lesson windows supersede the historical R5a/R5b coordinates.
- Road turns/elevations/banks are authored in
  `content/stages/coast/road.json`; ten named acts, nine hero
  slots and three overtake-pressure gates are authored in
  `content/stages/coast/direction.json`. No general Scenic
  Manager, random road re-generation or rank-dependent speed boost.
- Sea-side safety **always** has visible low guardrail/linked beach
  bollards and matching physical boundary/contact materials.
- Offline coast shore map now uses an exact 2D segment AABB index,
  instead of an extremely costly Z-only full scan. Never change
  the wet-sand/FFT appearance simply because the road grew longer.
- Legacy far mountains are bounded to the old coast footprint;
  physically plausible Hero Scenery must be created later in
  Blender/Geometry Nodes using the shared road-guide export.
- Road whitebox acceptance is separate from Hero art acceptance.
  The 30km R5c brief is historical. Test the current hero slots and contest gates
  at driving speeds, and run `npm run verify:dev` on the local
  Codex workstation before marking R5c QA green. Never auto-push
  to `main`.

## R5d — coastal scenery art direction / production (2026-11-14)

- **Owner-selected aesthetic is canonical:** read [Coastal Art Bible](docs/COAST_ART_BIBLE.md) before any new scene, character, vehicle, house, boat or prop art. Use the Style Option B board for its slightly chunkier forms, simplified materials and warm coastal sunset. These are *art references*, not GLB assets and not authorization to redesign Riviera 62.
- **Scenery production work order:** [Coastal Scenery Production Plan](docs/COAST_SCENERY_PRODUCTION_PLAN.md) defines art/engineering ownership, phased gates, pilot anchors, visual/safety/performance acceptance and Codex usage protection. Start with approved pilots, not full-route prop scatter or speculative engines.
- The active authored coast is **14,200m from HUD 350 to 14,550**, with ten chapter offsets, nine absolute-HUD hero slots and three pressure gates in `content/stages/coast/direction.json`. Historical 30km R5c documents are not a current road plan. Before touching Blender exports, use the current shared road guide and check existing visual masks; preserve road/Worker/AI/collision single source, visible seaward protection, and Pixel 8 budgets.

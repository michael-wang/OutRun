# OutRun — 10-minute Road Trip, bounded streaming & richer variety

**PHASED ARCHITECTURE REFERENCE — STATUS UPDATE 2026-10-29:** v0.8.5 streaming foundation completed locally and owner-playtested without noticed stutter/popping; user has now **AUTHORIZED v0.9 10-Minute Road Trip ONLY**. v0.9.1 scenic art and any later stages remain NOT AUTHORIZED. This document is product context; the ACTIVE implementation contracts are `docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md` and `docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md`. Initial architecture drafted 2026-10-28. Owner's overriding goal: a continuously enjoyable ~10-minute drive with much richer road rhythm and scenery changes, **without loading/building all 10 minutes of 3D upfront**, and **without visible hitches when generated road/scenery changes**. Two screenshots prove v0.8.4 still needs visual work; do not hold the 10-minute product hostage to perfect visual art.

**Engineering status updated 2026-10-29:** Remote GitHub \`main\` is documentation-first. Actual playable source is Windows local \`C:\astra-dev\OutRun\`; latest Codex v0.8.5 source is reported as \`codex/v0.8.5-scene-streaming\`, implementation \`97cff65\`, handoff \`f160929\`. The v0.8.5 streamer is delivered and user-tested subjectively; the model has NOT inspected its local source or measured physical Pixel 8 long-run performance. Numerical windows below are preliminary engineering settings that the v0.9 implementation must confirm against the actual local source. Grounded newest user results: \`docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md\`.

## 1. Separate finite RoutePlan from visible SceneChunks

\`\`\`text
          Player selects seed / scenic mode
                         |
               RoutePlan(seed, version)
         (cheap 10-min logical road itinerary)
          L3 biomes, L2 placements, L1 layers,
          distance bounds, control-point anchors
                         |
              StreamingManager(s)
                         |
   [Unload behind] [CURRENT + READY AHEAD] [Queued later]
                         |
      SceneChunk -> road mesh / support terrain /
      vegetation / buildings / geometry / materials
                         |
             Three.js continuous rendering
\`\`\`

**Intentional distinction:** Generating the full *logical itinerary* up-front is cheap and desired for seeded reproducibility; building all 70k world units of 3D road and scenic geometry upfront is NOT desired. A \`RoutePlan\` should contain small parameter objects (e.g. L2 challenging beat placements, L1 curvature/elevation/width overlays, L3 biome metadata and coarse boundary pose). It need NOT include thousands of already triangulated road/terrain vertices, cars, props or textures for sections the player will visit minutes later.

- **L1:** atomic parameters (curvature, grade/crest, width, surface when biome-compatible, plus obstacles later).
- **L2:** approved overlapping/serial combinations of L1 challenges, WITHOUT all-purpose baked-in straight buffers. Human review/votes remain source of truth; scores don't force elaborate feasibility algorithms.
- **L3:** sequences the L2 cores, deliberately adds only useful recovery/transition straights, chooses biome + prop families + scene rhythms; can vary scenery independently of bend. City/coast/canyon metadata applies to support geometry and vegetation.
- **Stage:** seed, route version, intended distance, sequence/weights. To get 10 min, use latest player's **13,488 units / 114.95s** as the provisional cruise baseline: **~70k units** for 600s. Don't pretend exactly 10m for slow/fast players; use representative drivers and report actual times.

## 2. Spatial chunks and load states

Design one small \`SceneChunk\` package identified by \`routeVersion + seed + chunkIndex\`, including **rendered road top + markings, shoulders/support terrain, necessary nearby props + biome variant**, with explicit geometry ownership/disposal and lazy material sharing.

Initial recommendation (adjust only after profiling, not a forever contract):
- Chunk length **~800–1,000 world distance units** (~5–7s at full arcade world pace). Small independent sections instead of one full stage mesh.
- At start: material templates/car/HUD/audio + **minimum first playable section** and immediate forward safety window. Start driving without generating the complete route.
- Moving window: aim **~4,000–6,000 units READY ahead**, **~800–1,500 units retained behind**, adapted to speed, road elevation, camera visibility and measured generation/upload latency. Above the 1.75x arcade world pace, visibility and buffer should use **actual world-distance per real second**, not displayed km/h alone.
- **Near** visible road support and gameplay props must always be fully present. **Mid/far** scenery can be lower-detail, with long-range silhouettes prepared independently. A 5km road ahead is not the same as 5km of full low-poly city objects.
- State transitions: \`planned -> generating -> CPU-ready -> GPU-ready -> visible -> retired\`. **Never** advance camera into an unready road chunk; prefetch sufficiently early and prioritize road/shoulder over optional scenery. Avoid repeating heavy work or uploading big arrays in one animation frame.
- Seed independence: individual chunk random variations derived from **seed + chunk index + feature id** or deterministic absolute road coordinate, not the mutable order of worker completion. Replays and alternate preload schedules must render identical worlds.

## 3. Seam, float precision and biomechanics safety

- All road geometry samples from shared continuous \`sampleRoad(s)\` (position, tangent, heading, grade, width, curvature, biome). Adjacent chunks use same boundary samples and stitch road edge and slope **without cracks**, double lines, abrupt elevation, shoulder discontinuities or tree rows teleporting. A global coarse polyline / prefix pose table is acceptable because it's tiny.
- Procedural land, prop placement and material noise use absolute world-coordinate hashes/seed so adjoining chunk seams remain consistent, including broad mountains seen over multiple chunks.
- At ~70k game world units, render-local Float32 may exhibit jitter if large x/z coordinates accumulate. Use **camera-relative coordinates / floating-origin rebasing**, retaining route progress \`s\` and deterministic double-precision logical positions; don't silently change physics, steering or snapshot Stage coordinates.
- Buffer behind camera for screenshot/reverse look/sweeping bends, not just current s. Visibility can cut across spatially looping road. If world-space nearby but s-far sections are visible, use coarse far LOD silhouettes or visibility-driven prep; don't expose a hard missing road at the horizon.

## 4. No noticeable stutter: keep work off render-critical path

- \`requestAnimationFrame\` remains driving/render/input responsive. Avoid synchronous full-stage mesh/terrain generation or huge batch uploads during the game loop.
- Phase-1 prototype can reuse existing geometry generator in short bounded slices if profiling proves frame-safe. If it blocks, use **one Web Worker** for deterministic CPU geometry preparation (typed position/index/UV arrays, terrain support and prop placements). Transfer \`ArrayBuffer\` ownership rather than copying huge arrays. Keep Three.js/WebGL object creation and GPU uploads on the main thread, **budgeted over frames**; do not claim the worker can create the whole GPU scene independently.
- Share/prewarm small material/palette and common prop geometries at startup or before transitions. \`InstancedMesh\` for repeated palms/rocks/building silhouettes, preferably batched by material and chunk; avoid 2,000 independent Mesh draw calls.
- Resources have explicit ownership: CHUNK-owned geometry/material? Dispose unused; shared materials/textures/geometries must not be disposed per chunk. Pool stable objects if cheaper; keep current chunk and neighbors; release retired GPU/CPU resources. Monitor \`renderer.info\` and browser heap when supported; don't mistake removing from scene as freeing WebGL buffers.
- If device is under pressure: first reduce distant prop density/LOD/fog, **never** remove road, near edge reference or steering response. Need honest profiling on a real Pixel 8 because browser automation cannot verify phone GPU.

## 5. Scenery must be both STREAMABLE and BELIEVABLE

v0.8.4 visually failed: merely emitting terrain skirts or props wasn't enough. Next new-world assets have to be generated from **camera-grounded road/topography semantics**, not flat random boxes.

- **Road support:** true terrain volume across from road shoulders down/out to contextual ground/water where appropriate. Simple rings/triangulated terrain mesh should connect road edge through slope to world ground and stitch to adjacent chunks. If an elevated segment is intentionally above water/valley, show a real **supported viaduct/bridge** (side deck and supports), not an unsupported ribbon or paper-thin triangle. Do not block or cover the road with huge hills as v0.4 once did.
- **Scenery levels:** near trustworthy terrain+roadside geometry; mid coarse mountains/building blocks; far compositional silhouettes and fog. Distant silhouettes can be billboard impostors or broad coarse geometry; must not visibly hover or pop.
- **Palms/trees:** stop perfect evenly-spaced row of single planar leaf crowns. Use seeded clusters/clearing areas, multiple height/lean/trunk forms and **voluminous low-poly multi-frond canopies** (crossed planes / 3D fanned fronds with some lower leaves), nearby shrub masses and occasional other biome-suitable trees. All reusable/batched, so richer perceived density without large draw-call increase.
- **Biome grammar:** L3 city/coast/canyon determines permitted terrain support, vegetation palette, skyline and appropriate elevation. Later mountain/snow/volcano must slot into same scene grammar rather than adding special-case full scenes. Transitions mix neighboring palettes over a stretch of road, not a sudden world reset.

**But scope prioritization matters:** visual polishing is **third engineering milestone** after streaming architecture + playable long route. Only require enough basic terrain support in the first two milestones to avoid obvious newly created holes; leave detailed crown art and skyline variation to the following visual pass.

## 6. Small photos UI correction (fold into first streaming milestone)

**While driving:** after successful save ACK show only a brief unobtrusive \`📸 Saved\` toast. No full path, recent gallery, filenames, counters, menu takeover. Error must show failure and be retryable; don't toast success before storage succeeds. Avoid screenshot readback blocking driving.

**When paused (local Windows dev session):** remove \`Recent Photos\`. One text row: \`Screenshots: C:\astra-dev\OutRun\captures\YYYY-MM-DD\ [Open Folder]\`. Use a small **local Vite dev-only** same-origin authenticated/protected request with a **fixed known directory** to launch Windows Explorer (or native shell bridge) on the PC; user action, localhost origin only, no arbitrary path, no shell string injection. A normal HTTP page cannot assume it can open a local \`file://\` folder. For Pixel connected to PC LAN, display the PC folder path accurately; an \`Open Folder\` action must not pretend it opens Android storage. Hide unsupported action or offer \`View on PC\`; do not build a new photo gallery now. Published standalone game uses browser-managed Downloads or another explicitly approved storage approach and must not show a Windows-only path.

## 7. Phased Codex work; ONE dependent goal at a time

### v0.8.5 — STREAMING FOUNDATION + photo menu trim

**Goal:** existing two-minute Stage01 (same seed/Stage Code/gameplay/reviews) now draws via bounded rolling chunks instead of one upfront full-scene build. Instrument actual frame times, chunk generation/upload spikes and memory; make path open UX correct. It is acceptable that user sees identical 2-min gameplay — the proof here is **lack of stutter and memory boundedness**. No new biomes, 10-min stage or new obstacle art yet. Build current source first, inspect actually existing code, then choose smallest safe conversion. Human/automation run multiple seeds and inspect near/distant camera. STOP for v0.8.5 review.

### v0.9 — TEN-MINUTE DRIVING PROTOTYPE (the key product milestone)

**Goal:** selectable \`10-Minute Road Trip\` mode with ~8–12min representative driving per Seed, a fixed reproducible StageCode, rich sequence of multiple L2 driving challenges and biome transitions, using same streamer. Do NOT stretch the old 2-min road five times or copy exact L2 sequence. Start can assemble lightweight logical itinerary; only active/nearby chunks become GPU geometry. Use existing approved L1/L2 and biome families (city, coast, canyon) for now; create variations by combination, grade/width transitions and changes of scenery mood; no need to add snow/volcano until visual/perf proof. Allow different seeds to vary meaningful itinerary, not only colors. Owner should play 2–3 full Seeds and judge adventure/rhythm, selecting favorable segments with existing positive/issue feedback. No Stage02/traffic/RPG unless separately authorized.

### v0.9.1 — VISUAL DEPTH & VEGETATION PASS

**Goal:** use seed1 user's photos and newer long-route screenshots to diagnose hollow elevated road vs land, bridge/ground continuity, city back-row depth, overly formal and sparse roadside palms; strengthen minimal L3 terrain generation and canopy geometry WITHIN the streaming/draw-call budget. Prioritize visible camera composition and no new visual defects at stream seams. Human acceptance is before/after photo, not object counts.

### After user enjoys long route

Traffic/rivals/collisions; more biome grammar (rural/snow/mountain/volcano); optional discovery mode, more approved L2 cores; RPG economy only after return-to-play has evidence. No large track editor required yet.

## 8. Risk-based acceptance / diagnostic plan

Detailed gates in \`docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md\`.

- Measure v0.8.4 local **desktop and physical Pixel** baseline before asserting 60fps. Provisional target: stable interactive **60fps when feasible, >30fps lower bound if existing device cannot sustain 60**, no obvious >50ms chunk-boundary hitch; frame-time **P95/P99 and worst spikes** reported with actual device and viewport, not only browser automation. Compare equal seed/visual settings rather than a false absolute number.
- After ~1 minute warmup, **active chunk count, GPU geometries/textures, draw calls, heap** must settle into a bounded band, including 10/20min soak and replay/New Route. No progressive growth over 10-minute play; screenshot files on disk are intentionally persistent and not the in-memory scene.
- Transitions: v0.8.5 every section boundary, v0.9 at every city↔coast↔canyon boundary; no frame stoppage, no sudden fog/color snap, road holes, missing edge lines or steering reset.
- Stage seeds deterministic under different chunk-preload order and CPU worker timing, including screenshot \`s\` and retrospective feedback attached to absolute course position. The latest human Stage JSON remains an archived reference, not data to overwrite.
- Quantify initial load time and cumulative scene construction time vs eager full build; require that startup constructs only first window, not all 70km, and that memory stays bounded even at finish.

**Do not authorize local Codex automatically because this plan was committed.** Owner must explicitly commission each development milestone; keep local source, stop and no push/deploy by default.

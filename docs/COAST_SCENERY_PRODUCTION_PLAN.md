# Coastal Highway — Scenery Production Plan v1.1
Date: 2026-11-14
Status: approved direction recorded; **production stages are proposed, not claimed complete**.
Companion decisions: docs/COAST_ART_BIBLE.md, docs/COAST_PORTABLE_SITES.md and docs/COAST_HERO_VEHICLE_ART.md.

## v1.1 priority/architecture amendments (2026-11-14)

1. **Separate asset / site kit / road placement.** Author reusable GLB models in the prefab catalog, compose small site kits in `content/scenery/packages.json`, and place them in `content/stages/coast/scenic-layout.json`. Run `npm run scenic:build` to project the agreed site positions into existing `scene.json` and director `direction.json`. Never bake HUD metres into asset models. For cliffs, piers, shorelines or ocean objects, add site-specific adapters only when a real pilot requires them: moving scenery may require terrain re-fitting but not re-modeling the boats/houses.
2. **Player + rivals + people are S-tier recurring hero assets**, above one-off decorative buildings. Parallel H0-H3 track in `docs/COAST_HERO_VEHICLE_ART.md`: audit actual in-game look, improve the accepted Riviera and occupants where proven needed, then rival family and matching traffic, including measured Pixel 8 cost. Do not defer this track until all nine landscapes are complete.
3. **Visual reference:** `art/reference/coast/README.md` identifies the owner-selected Style Option B image and its SHA-256.
4. **Current delivery order:** (a) Julia content/placement separation and vehicle visual audit brief; (b) Codex short H0 in-game capture + import approved images, and independent road-to-Blender rehearsal; (c) owner/Julia inspect hero vehicle improvements and 1–2 scenery GLB samples; (d) two site slices; (e) scenery production. Gate large-scale asset variants on approval.
5. Existing P0–P8 stages remain valid for the **world scenery** track. Add the H0-H3 vehicle track in parallel; it is not a P6 afterthought.


## 0. Current source of truth / avoid stale road plans

As inspected on dev on 2026-11-14, content/stages/coast/road.json has **14,200m playable length**, start HUD **350m**, finish HUD **14,550m**, five lanes and authored bends/banks. content/stages/coast/direction.json revision **sunset-sprint-14k** contains **10 chapters**, **9 hero slots**, and **3 racing-pressure gates**.
- Chapter start/end in direction.json are stage-local offsets (0–14,200), whereas heroSlots.distance and scene.json roadDistance are **absolute HUD metres**.
- The old R5c 30km brief is historical: NEVER resurrect its geometry or author scenery against its 30,000m endpoints. Refresh this plan if the road changes again.
- Current data-authored scene.json contains only one explicit farmhouse at HUD 1085m, and catalog.json contains its GLB. Many other scenic objects currently live in legacy coast-* TS generators.
- R5 road-guide export and Blender Geometry Nodes guide importer already exist. They are reference-only; physics, collision, Worker, AI and road geometry must stay tied to the single authored road sampler.
- Existing legacy Blender visual replacement mask near HUD 1340–1940m needs inspection before changing ground silhouettes; do not blindly extend masking to the entire course.

**Production rule:** Scenic design is organized by camera views, visual storytelling and reusable asset families, *not* by walking along the road and implementing every visible object in sequence.

## 1. Ownership / single acceptance owner

| Responsibility | Julia (director) | Local Codex (builder) | Owner (final judge) |
| --- | --- | --- | --- |
| Artistic reference, style bible, palette and visual consistency | **Owns**, creates look-dev references and samples | Implements accepted style, provides turntables | Chooses/rejects the look |
| Scenic rhythm, 10-chapter shot list, hero shot framing, visibility | **Owns**, marks priorities and negative space | Exports exact road poses, makes blockouts and preview captures | Drives and decides visual impact |
| Asset specification, families and variants | **Owns**, delivers short ticket with review images/gates | Authors geometry, materials, Blender tooling and GLBs | Approves a representative sample before scale |
| Stage data and renderer changes | Can inspect/edit connected GitHub, reviews changes | **Owns executable local changes**, asset production, integration and cleanup | Tests feel on PC/Pixel 8 |
| Tests and profiling | Sets thresholds relative to accepted baselines, reviews evidence | Runs local verify:dev, preview, captures, frame-time/heap/load metrics | Reports mobile look/performance |
| Release | Plans; NEVER auto-releases main | Commits to dev after local checks | Explicitly authorizes main promotion |

Julia cannot operate the owner's Windows Blender GUI or local Playwright/device environment from the GitHub connection. Do not infer local tests passed from source inspection.

## 2. Phased work plan — finish gates, not arbitrary dates

### P0 — Inventory, art contract and performance baseline (Julia-led; minimal Codex)
- Establish the current version, latest road/direction/effects, old generators, current third-party licenses, performance test stations and existing GLB catalog.
- Use the checked-in Style Option B reference for assets and coastal mood.
- Define a small standard report: HUD metre, traffic seed, near/mid/far shots, moving clip, Pixel 8 FPS/frame-time delta, draw calls, geometry/material/texture/GLB cost, load stalls.
- **Gate:** no ambiguity about which road, which visuals are preserved and which are replacement candidates.

### P1 — Scenic storyboard / full-route blockout (Julia leads; Codex makes small preview tool if needed)
- For each of the ten chapters and nine hero slots, define one dominant landscape silhouette, secondary visual cue, 200–600m approach sightline, roadside safety language, horizon/negative space and transition into the next beat.
- Assign **near / middle / far** physical placement, not fake depth only. Preserve racing apex readability in pressure gates.
- Use a low-cost blockout (Blender primitives/Geometry Nodes or in-game placeholders); capture *moving* chase-camera footage at 200–300 km/h.
- Avoid decorating the entire road yet.
- **Gate:** all nine hero slots have a readable subject + approach shot; ocean, terrain and road relationships are plausible.

### P2 — Reproducible asset pipeline + FOUR style prototypes (Codex owns builds; Julia judges)
- Reuse npm run r5:road-guide and scripts/blender/r5_guides.py. Expand the offline guide only as required for actual art transforms/shot preview; maintain game Y-up to Blender Z-up conversion and absolute HUD metres.
- Standardize a tiny repeatable local recipe: Blender source/param script → neutral turntable render → optimized GLB → prefab catalog → scene placement → in-game screenshot/metrics.
- Build only four representative objects before any family expansion:
  1. One coastal farmhouse near rice paddies.
  2. One white leisure sailboat.
  3. One roadside kit (guardrail/linked bollard and pole; preserve collision rules).
  4. One 3D coastal tree **or** headland rock, whichever is most useful to the pilot shot.
- Include source provenance, model origin, actual metre scale, texture/material inventory and one simpler distance LOD where sensible.
- Treat Riviera 62, driver/passenger, rivals and traffic as S-tier via the parallel H0-H3 track. Audit before remodelling; improve documented visual mismatches in focused tickets. They are not anonymous background props.
- **Gate:** Julia + owner approve appearance in actual dusk gameplay at speed, not a Blender still alone. Unapproved prototypes must not be multiplied.

### P3 — Two controlled vertical slices (Codex makes; Julia reviews; owner drives)
- **Slice 1: farmhouse near HUD 1085m.** Existing prefabdebug test anchor. Validate architectural proportions, ground contact, rice field / trees, road berm and shadow consistency; show a neutral render and real chase-camera view. Keep approved road/water/traffic.
- **Slice 2: Sail Bay near HUD 7770m.** Validate genuine 3D terrain/near-mid-far landforms, open ocean and sky, boat silhouette, visible seaward protection and deep parallax. Avoid a full harbor or beach crowd in this pilot.
- Both slices should be content-limited and loaded/disposed through existing bounded stage lifecycle. Verify no holes between game terrain and imported art, no surprise collision and no speed loss.
- **Gate:** same art language works for BOTH man-made assets and big open scenery. Pixel 8 moving regression is acceptable against P0 baseline. Only then mass-produce.

### P4 — Full 14.2km macro environment (Julia directs; Codex implements)
Build **large volumes first**, not small decorations:
1. Coordinate-consistent shore / beach / cliffs / fields / valley / town massing against the exact road.
2. Near/mid/far terrain silhouette and believable occlusion/parallax, particularly sea cliffs, bends and elevated views.
3. Existing Ultra Water boundaries, wet sand, foam/surf and matching shoreline heights; avoid additional FFT or unrelated water renderer.
4. Seaward visible low guardrails/bollards with actual existing boundary contacts; maintain collision and player/AI sightline.
5. Lighting/atmosphere continuity across the long course using effects.json and existing haze/shadow/wind owners.
- **Gate:** driving the entire course is visually coherent even with **gray or placeholder** houses, trees and crowds.

### P5 — Hero scenery in dependency order (Julia shot direction + Codex asset/scene work)
Build the most reusable / most spatially demanding spectacles first, NOT just ascending road metres:
- **Natural structure:** Sail Bay 7770, Sea Cliff 8850, Sunset Seawall 12400. Validate road/sea/cliff/wave/rail silhouettes and 3D parallax.
- **Built world and terrain mix:** Working Harbour 4600; Rice Plateau 10000.
- **Activity and accents:** Coastal Woods 5420; Beach Market 5980; Boulder Surf 6580.
- **Finish identity:** Finish Beacon 14200 (must read clearly before the line).
- Use staged variants of accepted models rather than hand-crafting every small object uniquely.
- **Gate per hero:** recognisable composition on approach, one clear main subject, plausible physical depth, free racing line, acceptable streaming and moving FPS.

### P6 — Asset families and ordinary road continuity (Codex implements; Julia curates)
Expand only accepted pilots into asset families with deliberate spacing:
- Architecture: farmhouse, courtyard, villages, harbor sheds, market shop/stall; varied roof directions, heights and spacing. Do not uniformly rotate identical houses.
- Marine: leisure sail, working boat, harbor craft, distant sails, dock equipment and nets.
- Infrastructure: guardrail/bollard families, utility pole, lighting, shoulder cover, cone/reflector, bridge, ditch crossing.
- Nature: coastal windbreak trees, low hill shrubs, rice/flower scenes (reuse approved effects), grasses, rocks.
- Characters and life: beachgoers, vendors, stationary small gestures, boats. Use low-cost animated accents, not a global crowd simulation.
- Keep some sections **quiet**. Do not fill all empty terrain with props: scenic negative space is a designed resource.
- **Gate:** no visibly repeated kit patterns, no props floating/sinking, no unsafe visibility. Full-route content density is bounded.

### P7 — Performance and streaming at representative density (Codex profiles; Julia decides trade-offs)
- Measure not just FPS but main-thread frame spikes, initial parse, shader warmup, compressed transfer, resident GPU texture/memory, draw calls and seamless chunk ownership/disposal.
- Current mountStageStaticProps loads/clones small data-authored GLBs, **not** proven scalable to thousands of placements. Benchmark representative density before choosing indexed placements, batched/instanced GLBs, typed arrays or range-load chunks. Do not introduce speculative binary storage.
- Static meshes: combine appropriate material groups, instance repeated meshes, add LOD and distance-based visibility; keep world-space variation deterministic and authorable.
- Compression: first measure size/parse/vertex costs; consider glTF-Transform + Meshopt/Draco, texture atlases or KTX2 **only where profiler justifies them**, with compatible Three.js decoder setup. Avoid adding every compressor by default.
- Do not change accepted Pixel 8 shadow-map presets, global breeze or Ultra Water FFT budget while tuning art.
- **Gate:** PC and Pixel 8 can drive end-to-end, with no missing road, severe streaming stalls or material compilation surprises. Report exact before/after conditions.

### P8 — Final art pass, QA and release candidate (Julia reviews; Codex fixes; owner accepts)
- Compare entire route's visual hierarchy, transitions, horizon, composition, color rhythm, day-to-dusk continuity and the chosen Style Option B art direction.
- At all pressure gates, validate apex visibility, barrier silhouettes, traffic and braking room, collision integrity and stable seed playback.
- Use owner-reported Pixel 8, Sony and PC screenshots/videos plus local build/test evidence. Run npm run verify:dev before push.
- Document and intentionally defer P2 polish; keep source credits/licenses intact. NO main promotion without explicit owner approval.

## 3. Route production index (live direction.json must win on drift)

Chapter offsets are stage-local, *not* absolute HUD distances. Hero metres are absolute HUD positions.

| Chapter offset | Mood / intended composition | Dominant families | Layer priority |
| --- | --- | --- | --- |
| 0–1470 海岸田園 | Comfortable rural opening, sea + golden crops | house, rice, trees, low rails | Pilot 1, near-field grammar |
| 1470–2295 悠閒沙灘 | Visual breathing space and waterline | beach, surf, low rail/bol­lards | Macro terrain |
| 2295–4000 小鎮與夜市 | Lived-in town with clear racing sightlines | houses, shops, crossings, props | Built-family kit |
| 4000–8100 漁港到帆船灣 | Reveal sequence: harbor → woods → beach → rocks → sails | boats, harbor, trees, beach, boulders | Pilot 2 + early Heroes |
| 8100–8870 岬口搶位 | Terrain frames braking and ocean | physical cape, cliff, road rail | Hero cliff + safety |
| 8870–10370 花田到稻浪 | Wide golden field waves and vistas | rice, flowers, terrace, village | Existing shader reuse |
| 10370–11360 礁岬反向彎 | Tense mountain village and alternate corners | cliff, hillside, town accents | Driver sightline first |
| 11360–12580 夕陽海堤 | Signature banner-like sunset, water and road sweep | sea wall, surf, cliffs, low rail | Hero sunset |
| 12580–13550 夜市決勝彎 | Bright port-market identity, deliberate pressure | market, buildings, lighting | Near-field details last |
| 13550–14200 港口衝線 | Fast, unblocked final view and finish landmark | finish beacon, harbor silhouettes | Hero finish |

Hero anchors: 4600 working-harbour; 5420 coastal-woods; 5980 beach-market; 6580 boulder-surf; 7770 bay-entrance; 8850 sea-cliff; 10000 rice-plateau; 12400 sunset-seawall; 14200 finish-beacon.
Pressure gates: cliff 8410–9220, switchback 10720–11710, last chance 12930–13900 (exact coordinate semantics: see direction.json).

## 4. Toolchain and strict boundaries

| Tool / technique | Use | Important caveat |
| --- | --- | --- |
| Julia + Image Generation | Art moodboards, silhouettes, material intent, comparison sheets, shot critiques; no Codex quota cost | A 2D concept does not magically become a 3D runtime asset |
| Blender 5.3 (offline) + Python | Author/edit 3D meshes, house/boat/terrain modules, batch neutral renders, export glTF/GLB | Not a gameplay physics renderer |
| Geometry Nodes | Terrain distribution, trees/rocks/roofs/settlement scattering, controlled deterministic variations | Avoid gigantic realized-mesh exports; keep gameplay placement/query data separately where needed |
| r5:road-guide + Blender importer | Exact same road-space sample, poses, bank, 9 hero anchors | Reference-only: never write competing road collision geometry |
| glTF/GLB + current Three.js GLTFLoader | Reusable authored rigid prefabs, catalog swaps, source/runtime separation | Current static loader is a prototype, not validated as full-course streamer |
| Existing Three.js / worker / authored stage | Materials, chunk lifecycle, gameplay camera, colliders, seed replay, shading | No new engine; preserve validated road, AI and water |
| Existing Ultra Water, coastal shaders, effects.json | Sunset, wind, ocean, rice, flowers, performance presets | Do not create duplicate FFT/wind/shadow stacks |
| InstancedMesh, LOD, measured compression | Control draw calls, texture memory and streaming | Use after profiling representative pilot scenes |
| Vite, Vitest, Playwright, local Blender CLI, FPS diagnostics | Reproducible visual checks, program tests, frame-time and mobile acceptance | Owners do real device visual acceptance; dev CI is manual, main only on approval |

Not initial dependencies: Gaussian Splats, WebGPU renderer migration, a procedural Scenic Director, a new entity system, a single giant 14km GLB, runtime image generation, realistic crowd simulation.

## 5. Codex token/usage protection

As of 2026-11-14 the owner reported **81% remaining, resets in five days**. Treat as an operational limit, not a linear guaranteed budget conversion.

**Before reset, cap scope to at most two well-bounded Codex work packages (no mass modelling):**
- **Ticket A — technical rehearsal only:** run exact current road-guide + Blender import locally, prove one GLB round trip, inspect existing art masking and object scale; neutral/in-game captures; short cost/benchmark report. Reuse existing scripts; do not mass-build.
- **Ticket B — revised priority:** use the checked-in Style Option B reference and capture H0 vehicle/occupant/rival/traffic comparison shots at fixed dusk/seed. Return the **top three visible mismatches** and costs without undertaking a complete remodel. The farmhouse/guardrail pilot is queued **after** the bridge and H0 art decisions, not the default pre-reset Codex sink.

Julia does concept direction, all nine shot briefs, issue triage and acceptance gates before Codex gets a task. Codex should receive a *single self-contained ticket*, do local build/tests before pushing, and return: commit, modified files, exact preview URL/HUD station, 2–3 screenshots, FPS/metrics if relevant, pass/fail and unresolved items.

After each ticket, inspect remaining Codex quota. Preserve a substantial reserve (suggestion: **60% or more remaining** until reset unless an urgent regression changes priorities). Stop if the proposed task needs repeated visual guessing; resolve taste cheaply with Julia concept iterations first.

**No work already in progress is implied by this plan.** The owner can approve each implemented slice, and only the owner approves a public main release.

## 6. Acceptance checklist / definition of done

- **Art:** matches the Style Option B asset language and coastal atmosphere; geometry scale credible; repeatable family grammar, not isolated one-offs.
- **Camera:** main subject readable on approach from actual high-speed chase camera; proper true 3D parallax/occlusion, no hidden turn or ocean wall.
- **Safety:** matching visible coast rail/bollards and collision contacts; road/AI/Worker identical geometry truth; no impossible traffic events.
- **Runtime:** no unbounded models, road holes, unhandled failure or unnecessary shader versions; stable ownership/disposal; measured Pixel 8 delta at reproducible HUD stations.
- **Production:** source and license recorded; source scripts/modifiers and output GLB retained; local npm run verify:dev for code changes; only dev commits unless authorized.
- **Traceability:** scene and docs have section IDs, metre markers and before/after screenshots; acceptance recorded before generating variants.

## 7. Immediate next step

Julia: maintain portable site content, create the ten-chapter storyboard, and curate H0 vehicle look-dev shot comparisons. Codex's next bounded tasks are the local road→Blender rehearsal (#34) and S-tier visual audit/reference image import (new H0 ticket). Do not spend the pre-reset budget on mass house/boat generation. Farmhouse pilot #35 stays queued until the art and pipeline gates are satisfied.

# Coastal Highway — Art Bible v1.1
Date: 2026-11-14
Status: owner-selected art direction; first in-game asset samples still require owner approval.
Scope: the original arcade racing game 極速漫遊 / OutRun, coastal playable stage only.

## Approved visual reference

The owner selected **Style Option B** on 2026-11-14. The full board sets the look for vehicles, people, roadside objects and the coastal sunset. [Approved board](../art/reference/coast/03_STYLE_B_coastal_highway.png)

- Give the roadster and compact car rounded shoulder volumes and a few broad highlights. Preserve the Riviera 62 silhouette and design cues.
- Build expression with readable brows, cheeks, mouths and grouped locks of hair. Show clothing through posture and a few large folds.
- Use the warm rim light, cool water and layered headlands in the banner to judge composition at driving speed. Calibrate materials in the existing dusk light.

**North star:** Beautiful at 200–300 km/h from the real chase camera on Pixel 8. Clear silhouettes, coherent materials, credible spatial scale, attractive golden-hour travel atmosphere, and racing sightlines come before microscopic details.

## Style vocabulary / invariants

- **Shape:** recognizable real-world proportions, slightly art-directed simplification; strong primary volumes, selected bevels, readable landmarks, no unnecessary miniature detail.
- **Character:** approachable, refined, simplified realistic facial anatomy; not photoreal portraits and not chibi/anime toy figures. Preserve the existing male driver / blonde passenger identity and proportions approved for the Riviera 62.
- **Surface:** clean and controlled glTF-compatible materials. Rich paint on the hero vehicle, gentle glazing, convincing but simplified stucco/stone/roof tile/metal/cloth; avoid dirty photogrammetry, noisy grunge, excessive reflectance, fake plastic appearance.
- **Detail hierarchy:** largest forms at distance, a few medium accents close up, tiny details only on genuinely important near-field objects. Background props should be cheaper than hero props.
- **Lighting:** one shared golden-hour world light, horizon haze, sunset water highlights. Assets authored under neutral lighting and checked again in the *actual game scene*; do not bake orange sunset onto every albedo and then tint it again globally.
- **Palette family:** warm ivory / sunlit sandstone / terracotta / muted coral / Ferrari-style vivid red for the playable hero / clean sky and sea blues / varied natural olives and greens / restrained charcoal and desaturated metal. Exact color tokens are to be calibrated from in-game captures, not reverse-engineered from a generated image.
- **Environment:** stylized, believable lived-in coastal Taiwan-inspired countryside/harbour atmosphere rather than a collage of unrelated European resort, American suburb and exaggerated tropical cartoon design. Keep the current location flexible; regional vernacular should be consistent within a chapter.
- **Motion:** waves, rice/flower bands, wind and human gestures should feel like one shared environment. Reuse accepted Ultra Water, wind and effect systems instead of introducing local competing simulations.
- **Depth:** true world-space near/mid/far hills and cliffs, sensible occlusion and moving parallax; no visibly near landforms masquerading as infinite backdrop sheets.

## Focal-point asset priority (S tier)

**Player Riviera 62, its driver/passenger, rivals and recurring traffic are a first-class high-effort art track, not a minor set of background props.** They are seen for most or all of the race and deserve repeated look-dev and runtime inspection. See `docs/COAST_HERO_VEHICLE_ART.md`. Audit existing `src/car.ts` and `src/rival-view.ts` materials, silhouette, proportions, faces, hair, wheel/paint response and visual consistency **before** deciding whether to revise them. Protect the accepted Riviera 62 and character identities. Spend geometry/shadow performance carefully, especially for eight rivals; do not automatically remake working models.

## Families and leading samples

| Family | First validation asset | Variants after approval | Primary visual test |
| --- | --- | --- | --- |
| Rural architecture | One coastal farmhouse by rice paddies | cottages, courtyard, shop house, harbour shed | roof/wall/window scale, believable grounding and silhouette |
| Marine | One white leisure sailboat | moored small boat, working fishing craft, distant sailboats | clean hull/sail vocabulary, true waterline, reflections |
| Roadside | Existing guardrail plus one modular pole/bollard/cone kit | metal rail, beach linked bollards, reflector, streetlight | physical safety reads visually; props do not hide apex |
| Terrain/rocks | One coherent 3D headland module | cliff, boulder group, terraced bank, distant ridge | parallax, size, wet/dry transition, no repeating tiling |
| Nature | One coherent 3D tree plus coastal shrub | windbreak, orchard, coastal grass, crops | not flat billboards, silhouette at speed, mobile instancing |
| Vehicles/people | Existing Riviera 62 + one existing traffic car/occupant reviewed as **references**, not automatic replacements | only redesign if a documented mismatch remains | all share material detail and realistic arcade proportions |
| Lived-in props | Market stall or beach umbrella cluster | shop sign, nets, crates, beachgoers, cones | variety without clutter or scale mismatch |

**Explicitly protect approved gameplay assets.** The generated board's red convertible is a style example, NOT a request to replace the player's Riviera 62 or its original design. Existing traffic, people, roadside collision, water and shaders remain until a specific replacement is approved.

## Material and geometry acceptance

1. Inspect the asset in a neutral studio-like turntable AND in two real in-game positions (near and middle distance), at the existing dusk preset.
2. Verify side/front/rear silhouettes, scale in metres, axis/origin (Three.js Y-up), and clear road-relative placement.
3. Use a small repeatable material family (body paint, plaster, terracotta, metal, concrete, foliage, cloth); avoid one independent shader family per minor object.
4. Prefer simple meshes, glTF/GLB, shared textures, batches/instances and LODs. Use texture baking only where it reduces cost or provides a needed visual detail.
5. Author collision/contact separately from decoration when required. Decorative Blender geometry never overrides the shared road/Worker/AI collision truth.
6. No shader compile hitch, overdraw storm or massive network/CPU transfer introduced by an apparently simple object. Profile on actual Pixel 8 before scaling repetition.
7. Avoid excessive high-frequency texture detail: look at motion, not only paused close-ups.
8. Log source, license, model parameters, texture resolution, approximate triangles/materials/draw calls and budget/regression notes per asset family.

## Negative guidance / rejection cases

- Photoreal human faces with toy cars, or anime characters beside realistic boats.
- Flat trees or 2D cutouts in a near-field landscape intended to be genuinely 3D.
- Infinite fake mountains that visibly slide sideways as the camera turns.
- Repetitive rows of identical homes with identical orientation and spacing.
- Shiny/blue fake underglow, plastic rocks, uniformly gray stone, blinding material highlights.
- Populated beach/market props that form a visual wall at 300 km/h.
- A gorgeous static Blender screenshot that lacks usable runtime performance, road sightline or scene streaming.

## How a new asset is approved

**Concept → one 3D prototype → in-game shot → owner YES/NO → controlled variants.**
Each review must include: (a) reference board excerpt or written shape brief, (b) neutral render, (c) exact HUD metre + camera shot at speed, (d) mobile performance delta where relevant, (e) source/license and next action. Do not generate an entire asset family before the first usable sample is accepted.

## Approval and precedence

Owner chooses taste and shipping; Julia owns direction, consistency, shot lists, technical acceptance and scope; local Codex builds Blender scripts, assets, transforms, integrations and tests.
This art bible controls aesthetic choices; content/stages/coast/road.json and runtime game/Worker remain the sole authority for road physics. The latest live content/stages/coast/direction.json controls scenic anchor locations, not historical 30km drafts.

Related: docs/R5_ART_PIPELINE.md, docs/COAST_SCENERY_PRODUCTION_PLAN.md, docs/CURRENT_ARCHITECTURE.md, content/AGENTS.md.

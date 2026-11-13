# Coastal Highway — first scenic storyboard (R0, Julia direction)
Date: 2026-11-14. **Creative shot briefs**, not implemented geometry. The authored road and contest gates remain authoritative.

## Rule: scene identity before scene location

Every hero has an immutable **site ID** and a movable road anchor. The visual story, asset package and material treatment belong to the site; the current preview HUD metres are only the values in `content/stages/coast/scenic-layout.json`. Avoid writing kilometres into GLB naming, source models, Blender Geometry Nodes groups, texture atlases or site package IDs. Repositioning requires camera and terrain adapters, not asset remodelling.

**Cinematography:** use player chase camera at 200–300 km/h and a visible introduction **200–600m before** the reveal; one main silhouette, one meaningful secondary cue, uncluttered sightline. Stage framing, 3D terrain parallax, water/shore connection and seaward barriers are designed before small props. Hold visual negative space between spectacles.

## Nine movable hero modules

| ID (current preview HUD anchor) | What the driver first sees | Near / middle / far composition | Reusable component families / safety rules |
| --- | --- | --- | --- |
| `working-harbour` (4600) | Working trawler silhouettes and two low fishing-boom diagonals interrupt the calm sea line. | Near: quay protection, crates only in safe pockets. Middle: one animated working boat, sheds, winches. Far: low harbour skyline and water. | Fishing craft + quay kit reusable near finish. Do not create a wall of tall cranes that hides the next corner. |
| `coastal-woods` (5420) | Airy roadside trees frame a distant wedge of light; not a dense black forest tunnel. | Near: 3D trunks and guardrail. Middle: irregular windbreak tree masses. Far: inland hills with stronger aerial depth. | Tree family reused at rural opening and rice plateau. Road edge stays visible; no flat billboard trees near the camera. |
| `beach-market` (5980) | A few colorful parasol/awning shapes lead the eye to swimmers and white surf. | Near: sparse beach bollards/rail, shelter. Middle: 2–3 market clusters and beach umbrellas. Far: calm open water and low skyline. | Human silhouettes, shop kit, umbrella family. People must not look enormous or block braking markers. |
| `boulder-surf` (6580) | One offset cluster of enormous dark stones and white breaking surf at the ocean edge. | Near: physically separate boundary / stones. Middle: asymmetric boulder mass and spume. Far: low offshore rocks, surf bands. | Reuse rock family on sea cliff and seawall. No endless orderly rock fence or fake blue glow. |
| `bay-entrance` (7770) | Ocean opens wide after a bend; first near sail catches sunlight, several smaller sails recede across the bay. | Near: modest seaward guardrail with open view. Middle: one clearly readable leisure sailboat, shallow headland. Far: two or three smaller sail silhouettes and distant coast. | Sailboat family, reusable bay composition kit. Boat must sit at real waterline; low shoreline transition conforms to placement. This is the first ocean/boat **movability test**. |
| `sea-cliff` (8850) | Sweeping elevated road carves along a high irregular headland, backlit against the ocean. | Near: rail profile readable before the corner. Middle: true 3D cliff edge with a credible vertical drop. Far: layered dark mountain masses with parallax. | Headland terrain adapter and rock kit. **Pressure-gate corner:** keep apex and escape visual cues unblocked. Do not store a giant fixed-at-8850 mesh. |
| `rice-plateau` (10000) | Bright flowers give way to long, wind-rippled rice fields; tiny houses anchor the landscape. | Near: flower terrace/retaining stone. Middle: broad rice bands and 1–2 compact rural buildings. Far: darker layered hills and a narrow sea glint. | Reuse approved rice/flower wind shaders and house kit. Avoid near-field texture grass on PC; not a tiling clone village. |
| `sunset-seawall` (12400) | Signature sweeping coastal road and sunset-reflective sea: **banner C composition**, built as genuine 3D view. | Near: continuous low rail/seawall, roadway silhouette. Middle: open sea, surf & an asymmetric coastal cape. Far: sunset, dark hills and town pinlights. | Hero terrain/water/rail assembly; shared sunset preset rather than orange-baked materials. Long 600m approach with deliberately sparse props. |
| `finish-beacon` (14200) | A distinct nautical finish marker first reads small, then resolves against the harbor skyline. | Near: consistent official finish furniture. Middle: lighthouse-like harbour beacon or stylish gantry silhouette. Far: distant harbour and sunset haze. | Reuse harbour family. Do not cover the sprint line or alter finish/physics data. |

## Non-hero connective scenery: ten chapters

`rural-opening` — open rice, 1 approved farmhouse, gentle sea promise; establish material scale. 
`quiet-beach` — reduce prop density, open sky and water, leave room for acceleration.
`town-and-market` — a believable short inhabited corridor, not continuous repeated houses.
`wide-ocean` — distinct harbour→woods→beach→rocks→sails reveal sequence with quiet gaps.
`cliff-challenge` — a mountain and guardrail silhouette that intensifies braking, not a foreground wall.
`rice-plateau` — decompress from cliff into long bright fields, then gradually return to tension.
`switchback-risk` — protective rails, cliff and inland village massing; no decorative apex blockage.
`golden-bridge` — build the banner-C sunset composition and hold it through the broad bend.
`final-contest` — harbour-market lights as rhythm cues, leave overtaking lanes readable.
`finish-sprint` — one unambiguous distant finish landmark, no obstacle comedy.

These are narrative labels and **not** additional gameplay road chapters. Changes to the actual road remain separate.

## Construction order (dependency, not ascending metre)

**A. High-frequency S-tier track:** Riviera 62 and occupants → rival materials/figures → simplified traffic family (see `COAST_HERO_VEHICLE_ART.md`). Julia/Codex/owner review this before mass scenery.

**B. Spatial world prototypes:** `bay-entrance` + `sunset-seawall` to prove open ocean, waterline, sea barrier, and real 3D depth. `sea-cliff` to prove terrain conformance/pressure-gate visibility.

**C. Reusable built/natural asset prototypes:** one rural house, 3D tree, sailboat, roadside kit, boulder/rock. Then produce families after approval.

**D. Scene families:** working harbour, market, woods, agriculture, final harbour/finish (built from accepted assets).

**E. Long-course transitions:** quiet lanes, geography, hazard-free coastline, shadows/haze/shoreline, LOD/streaming and final moving visual review.

## Acceptance shots for two pilots

**Rural pilot (existing 1085m, not a hero module):** 200–300m approach, farmhouse clearly grounded in rice/paddy, 3/4 neutral Blender render, dusk gameplay side/front, Pixel 8 moving cost. Farmhouse model is reusable even if site changes.

**Sail Bay pilot (`bay-entrance`, currently 7770m):** 410m lead, full-speed moving approach, open sky/sea, correct boat waterline, rail visibility, two layers of 3D geography and no fake depth, profile load. Then prove moving its site anchor in data does not require new boat geometry. Do not label the whole bay movable until marine/terrain adapters are implemented and tested.

## What Julia and Codex each do next

Julia owns these shot briefs, selects conceptual object examples, curates density/negative space and approves in-game silhouette. Codex owns one bounded local Blender + GLB roundtrip at a time, captures, integration, worldspace/shoreline adapters and measurement. Owner reviews the real chase-camera experience. H0 ticket is [#36](https://github.com/michael-wang/OutRun/issues/36); guide rehearsal [#34](https://github.com/michael-wang/OutRun/issues/34); farmhouse pilot [#35](https://github.com/michael-wang/OutRun/issues/35) follows the relevant gates.

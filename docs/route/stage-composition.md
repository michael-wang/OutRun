# Coast Route · Accepted R1b and R2 handoff

**State (2026-11-20): R1b's direct A6 → Kenting arrival is owner accepted. R2a source ownership is prepared; R2b full scene relocation is NOT implemented.**

**Owner direction (2026-11-21):** [Issue #72 — R2b Working Harbour after Kenting](https://github.com/michael-wang/OutRun/issues/72) is now **AUTHORIZED for Judy's route study → playable Macro Layout → owner experience acceptance → existing-asset/proxy Composition Pass**. New Blender/DCC asset production is **DEFERRED to Codex availability**. This is authorization of the **workflow and scene order**, not approval of specific new station metres, a finished road, a playable harbour or Composition PASS. The rocky-coast transition and first white lighthouse are retained. A second small **breakwater navigation beacon** is a preferred composition cue, not a second competing landmark tower. Legacy working-harbour reference 4600 remains unplaced.

**Road profile preflight:** Kenting's first lighthouse is around **track 6020**, rocky coast continues **6800–8450**; road elevation is about **24.25m at track 6800**, versus about **−0.17m at track 8450**, with sea level **−5m**. Existing cliff contest gate begins **track 8410**. Judy must reconcile safe road descent, harbour water basin, old gate and later scene positions before assigning actual harbour entry/exit ports or moving runtime geometry. Do not silently restore the earlier 650m beach entry Connector. Absolute track values differ from HUD by **350m**.

 The GitHub source integration remains subject to local build/drive regression. This document replaces the temporary R1 candidate screenshots/surveys, which are recoverable from Git history.

## Active runtime order and boundaries

Default Vite/production selection: `VITE_KENTING_INSTALLATION` unset → `immediate`.

| Unit | Current track stations | Meaning |
| --- | --- | --- |
| A0–A6 tutorial | 350–4350, A6 at 4000–4350 | Original accepted road and tutorial interactions unchanged. |
| Kenting reveal | screening mountain starts ~3950; high-curvature right turn ~4635–4785 | Mountain begins during A6; no forced entry Connector. |
| Kenting scenic core | 4850–6250 | Sand, swimmers, shops, nearshore, lighthouse at 6020, shared world sunset. |
| Coast beyond Kenting | 6800–8450 is a continued shoreline, NOT a newly required Connector | Retain the natural post-lighthouse coast to the next race act; no premature harbour/woods packing. |
| Working Harbour | UNPLACED | Historical 4600 marker is a source inventory reference, **not** an active scene. |
| Coastal Woods | UNPLACED | Historical 5420 marker is a source inventory reference, **not** an active scene. |

The working harbour and windbreak are deferred from the *active* immediate scene, without deleting their reusable boat/tree models. `content/stages/coast/scenic-layout.json` and `direction.json` still contain legacy authoring anchors, so **do not mistake those historical marker metres for active R2 placements**; `COAST_INSTALLED_HEROES` filters them in the current game. R2b must establish authoritative stage-wide segment placement and regenerate the map/hero projections together. The current R0 route SVG still accurately portrays the current native road centreline/elevation/curvature because R1b's immediate road transform is identity, but the full set of numbered Hero marker labels is not a final scene sequence.

## R2a source ownership

`content/scenery/coast-neighbours.json` owns a small reusable description of two unfinished scenes. Runtime source consumers derive the original source coordinates from local station offsets; this does **not** place a new independent Scenic Segment.

- **Working Harbour:** 3 historical left-water landings (4490/4570/4775) and 2 working fishing craft (4520/4780). Landing 8920, generic sailing traffic and Sail Bay patrols remain independent.
- **Coastal Woods:** 9 historical inland copse centres (5325–5714), 6 shore windbreak centre positions (5530–5710). The 2800–3000 oak training grove and ordinary background vegetation are not owned by this module.
- Both source segments have `entryPort: null`, `exitPort: null`, and `productionStatus: SOURCE_ONLY`. No final kilometre, yaw, road elevation or Connector is approved yet.
- Segments own scene recipes; Asset Library continues to own shared boats, model geometry, materials and plant effects.

## Portability and cleanliness

`src/kenting-installation.ts` retains explicitly requested `original` and `relocated` modes as **regression fixtures**. The `relocated` fixture shifts the protected core +650 m and exercises the single-road-sampler join implementation. It is **not** the accepted product pacing. The approved production mode is `immediate`, which adds no new road Connector and uses the original shore/farm bake. Its helper `installKentingRoad` exits early on zero delta. Do not resurrect the long approach in ordinary gameplay.

Original R1 relocation comparison SVG/CSV were **throwaway trial snapshots**, not source-of-truth stage art. The versioned R0 `docs/route/coast-master-route.svg` and `coast-profile.csv` remain the current road geometry reference until a later road change.

## R2b — next local construction gate

**Current authorized state:** Judy owns Gate 1 route study and Gate 2 playable Macro Layout; after Michael personally accepts the Macro, Judy may perform Gate 3 Composition using **existing assets/proxy geometry only**. Blender/GLB asset production is postponed. Exact ports and road changes remain unapproved until grounded in the actual route/profile and playable evidence. Suggested narrative:

1. Place the **Working Harbour** after Kenting, with realistic quay/waterline, usable vessel patrols, a visually readable approach and a seamless height transition down from the lighthouse high coast.
2. Place **Coastal Woods** after the harbour, maintaining natural inland hills, gradual windbreak, readable roads and re-opening the view before the next contest gate.
3. Add Connectors **only where the adjoining ports require** them; zero-length ports are valid. The old 14.2km stage length is not binding; new geometry may require moving cliff pressure gates, finish, traffic/AI events, bounds and checkpoint positions together.
4. Validate world/Worker/physics/shore single-source agreement and restore every deferred entity exactly once (none left at the old overlapping site). Renew the versioned Master Route SVG, grade/curvature charts and scene inventory when real positions are approved.

**Tests not certified in the GitHub-only editing session.** The owner has personally accepted R1b visual/drive pacing. Before treating *these merged source changes* as fully validated, run `npm run verify:dev` and targeted Vitest tests including `tests/kenting-installation.unit.ts`, `tests/kenting-terrain-installation.unit.ts`, `tests/kenting-boat-admission.unit.ts`, `tests/coast-segment-hud.unit.ts`, and `tests/coast-neighbour-segments.unit.ts`. Verify default start → A6 → Kenting → lighthouse → remaining race, restart, traffic/AI and mobile FPS. Main release stays separate.

### #72 Gate 1 — High rocky coast, then port, then descent

**Local Macro candidate only; NOT accepted or integrated into the regular dev build.** Keep the accepted R1b beach, white lighthouse and existing road centreline. The new harbour never becomes sandy within its own ports; the race stays on top, the working quay stays down by the real water. Commit baseline: `877fc319`. Stations are track metres; HUD = track − 350 m. Heights are world Y, with sea at −5 m.

| Beat | Track / HUD (m) | Road Y | Intent |
| --- | --- | ---: | --- |
| Rocky approach | 6930 / 6580 | 25.42 | Carry the lighthouse headland forward; allow the outer arm to emerge before the whole basin. |
| Entry port | 7100 / 6750 | 25.68 | Existing broad descending-radius turn, not a separate Connector or a new braking challenge. |
| Hero observation | 7260 / 6910 | 25.71 | Near rock lip, forward-left quay and vessel silhouettes, sheltered basin, outer mouth with small navigation beacon. |
| Exit port | 7540 / 7190 | 25.24 | The harbour ends while the road is still on the high shelf. |
| Post-port coast | 7720 → 8250 / 7370 → 7900 | 21.36 → 1.14 | Continue the existing descent, blend rock into sand. The road is ~6.14 m above the sea at 8250. |
| Existing cliff contest | 8410–9220 / 8060–8870 | ~−0.16 at entry | Keep existing braking challenge, later gates, on-road events, finish and traffic stations unmoved. |

**Why this candidate:** The working stretch is 440 station-metres (7.9–5.3 seconds at constant HUD 200–300 km/h before the approach and exit), with grade magnitude ≤0.93% and roughly 19° of heading change. Join length is zero. Existing descent reaches ~4.33% grade outside the harbour. Avoid a tall foreground silhouette that occludes the harbour; the normal chase camera, not plan view, will judge whether the quay can read from ~30 m above water. Existing Sail Bay boat paths and 8920 landing are outside the new port's ownership. The wet/dry shore mask and rendered terrain must share the local profile; the mask alone cannot make a cliff or sheltered sea state.

**Alternatives:** A harbour on the existing 7580–8250 descent keeps the same track length but falls from Y24.75 to Y1.14 inside the port, contradicting the high-rocky-shore brief. Extending the plateau and moving the descent downstream can lengthen the hero view, but affects the 8410 contest and may require remapping all later gates, events, traffic ownership, checkpoints, stream limits, and finish as one change. Revisit this only if the elevated existing-road candidate cannot give a legible and physically coherent view at speed.

Gate 2 must validate actual normal-chase approach/reveal/hero/exit, independent Sail Bay patrol clearance, seawall waterline and rock-to-sand join, prior beach regression, and race/recovery. Stage and future Asset Production decisions remain separate.

**Local Macro experience evidence:** Windows Chrome normal START (no development query) drove from track 350 through beach, lighthouse, rock approach, harbour, sand return and cliff entry; 7 active rivals, speed about 234–235 km/h in the port and 190 km/h at track 8431. All 25 one-second samples from track 6800 onward reported valid road and stream, with no hold or off-road in those samples. Restart returned to track 350 READY. The hook used ordinary throttle/brake/steer input, not seeks or free camera. The preview is a *playable review candidate*: the higher road and sand exit read clearly, but at 235 km/h the pier crane is briefly visible at the left edge and the rock lip still obscures part of the quay and basin. The Sail Bay sail silhouettes are not harbour evidence. Do not begin Composition on this basis. If owner also wants a longer port read, prefer reorienting the basin/outer arm into forward-left or a bounded road sightline correction on the same high plateau, before detailing art. Physical Pixel 8 performance and controller remain unverified.

### #72 Gate 2 revision — seaward headland, offshore sails

On the same high road, extend the connected, asymmetrical low shelves toward the sea (waterline about 90–120 m from the road center through the working bay instead of ~30–40 m). Put the working shore on the downstream side: a low quay (track ~7358–7511), breakwater with open mouth, three fishing proxies and a modest derrick at ~7469. The terrain and Ultra Water wet/dry bake share the profile and sea level. No change to the road line, guardrail, next cliff challenge, any global wave parameters or the accepted beach ground. Seeded scrub occurs in sparse, grounded groups on dry shelves, not in the splash zone. It remains whitebox rock, not production geology. In the active route only, the former five Sail Bay patrols now run off Kenting at track 5100/5310/5540/5780/6050, 179–231 m from the wet edge at patrol centers; historical mode patrols and unrelated fishing boats remain unchanged.

The revision obtains a recognizable working shore from normal chase across the approach and early harbour; eventually it crops left. Detailed geology reference and render-cost study is separate: use [Longkeng rocky coast](https://www.taiwan.nps.gov.tw/home/zh-tw/topic/18658.html) for raised, layered reefs and scrub on dry ledges, and [Houbihu working waterfront](https://www.taiwan.nps.gov.tw/home/zh-tw/attractions/21042.html) for shelter, entrance and working boats. Evaluate one 180–240 m slice: match shoreline/material/seed, compare coarse versus locally refined silhouettes first, then compare foliage independently. Batch repeated rock/scrub per spatial chunk; favor simple opaque silhouettes and close-only extra geometry. Compare fixed-speed chase visibility and warm/cold p95/p99 frame times, draw calls, triangles and streaming; Pixel 8 requires physical testing. Do not start Composition or DCC production from this draft.

### #72 Gate 2 revision 3 — larger basin and a visible exit lighthouse

Michael accepted the road line and height changes in the V2 review. Keep both, as well as the existing chase camera, Kenting lighthouse, sea level and five offshore sail patrols. The rocky blend starts at track 6800 instead of 6930; the quay begins around track 7017 instead of 7358, with the harbour still ending at track 7540. The new end headland supports a distinct white tapered lighthouse with a red lantern roof at track 7507 (HUD 7157). Its base samples the same dry terrain as the coast mesh, not the ocean plane.

The arm projects toward open water and encloses nine spaced fishing berths. Comparing the same world-XZ outline between breakwater inner edge, shore/quay wet face and the open mouth chord, minus outer apron, estimates about 3,189 m² for V2 versus 38,522 m² for V3. These are playable whitebox plan areas, not hydraulic or navigational engineering measurements. The field and shore bake share one profile; global waves, road, timing, and next cliff gate do not change. No Composition or asset production before Macro review.

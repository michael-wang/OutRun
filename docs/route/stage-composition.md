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

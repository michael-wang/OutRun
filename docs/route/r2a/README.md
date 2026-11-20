# R2a — Working Harbour / Coastal Woods source ownership

**Status: CODE AND CONTENT REVIEW CANDIDATE, NOT A DRIVABLE R2 RELOCATION.** Based on `review/kenting-r1-julia` and isolated from `dev` / `main`.

## Goal and what has actually changed

R1 proved how painful a scenic move becomes when road stations, shoreline recipes, boats, trees, terrain and side effects share unrelated absolute metre literals. Before we build new models or extend the race, R2a establishes a reusable, **source-relative** ownership inventory for the two unfinished neighbouring segments.

`content/scenery/coast-neighbours.json` is the authoritative R2a **ownership and old-source placement** inventory, with stable IDs and local metres relative to their historical hero anchors. `src/content/kenting-neighbours.ts` projects those local metres back to original source stations for the currently playable game. The existing `coast-layout.ts`, `coast-boats.ts` and `coast-nature.ts` now consume this inventory.

This is **not a new Stage Composer**. It does not rotate, relocate, create road ports, rebuild terrain or render a new harbour/forest. The unchanged original source positions are intentionally preserved for current regression comparisons, while Kenting `immediate` and `relocated` continue to defer these unfinished overlapping neighbours.

## First reusable source inventory

| Module | Historic hero anchor | Owned visual source | Not owned |
| --- | ---: | --- | --- |
| Working Harbour | track 4600 | 3 landings at source 4490/4570/4775; two `quay-` working vessels 4520/4780, each with offshore and hull size | Generic sails, Sail Bay patrols, independent landing at 8920, traffic vehicles |
| Coastal Woods | track 5420 | 9 landward copse centres 5325–5714 and 6 shore windbreak centres 5530–5710, with their original x/height and authored texture model families | The training oak grove at 2800–3000, ordinary wild vegetation, rice/flower farmland |

IDs and local shapes belong to their respective segments. Model geometry, materials, shadows, ground-placement utilities and environmental shaders remain reusable shared resources rather than being copied into a bespoke beach model. These segments **do not yet have validated independent entry/exit road ports**. Both remain `SOURCE_ONLY` and `entryPort: null`, `exitPort: null` until R2b.

The historical `scenic-layout.json` and `direction.json` still contain authoring hints for the old order and must **not** be silently rewritten with unapproved destination metres. The active R1 trial's hero filtering merely defers unfinished scenic labels while its own first-beach experience is evaluated.

## Proposed road sequence (not yet a route or a station assignment)

**Tutorial → Kenting Beach → Working Harbour → Coastal Woods → remaining race acts.**

- **Tutorial:** A0–A6 kept, A6 ends track 4350. No new Connector when existing final drift and Kenting road already share the same port. The right mountain grows in the back half of A6; the approved strong right turn reveals the beach.
- **Kenting:** keep the final beach/headland and fixed sun in the accepted composition. In the `immediate` trial, the arrival is the original game road, not an artificial 650 m join. Existing coast after the lighthouse is not automatically labelled a new Connector.
- **Kenting → Working Harbour:** find a genuine water-level transition away from the elevated lighthouse cape, with workable shoreline, mooring basin, boat patrol clearance and legible working wharf from 200–350 m before arrival. No position is approved; do not add a quay on top of the beach or change sea Y = −5 m.
- **Working Harbour → Coastal Woods:** use a Connector only when needed to rotate/ascend toward the inland hills and blend roadside soil/trees. The windbreak should produce a brief compression of views and then release, **not** cover the whole coastline with a dense uniform tree wall.
- **Competition gates:** the current beach outer cape meets the existing cliff pressure gate around track 8410–8450. There is insufficient certified open road to insert two new scenic cores here. R2b must be free to **extend the finite course and reposition later pressure gates**; never overlap authored independent road pieces, overwrite A6 or assume the 14.2 km historical length is a constraint. Race ranking/finish, traffic event positions and QA stations must be reauthorised together if road length changes.

## Port decisions deferred to R2b

For each new segment provide a real local `roadEntry`/`roadExit`, world-space frame at placement (X/Y/Z, heading, signed curvature, grade, bank, lane profile), left/right terrain cross-sections, sun view condition and ownership of associated collision/safety rules. For harbour: boat waterline, quay height, ocean clipping, dock footprint and actual visual reveal. For woods: landward slope, roots/triangle grounding, sightline and return to the sea horizon.

Then make one real playable installation at a time using the R0 `docs/route/connector.md` compatibility contract and current track sampler. A zero-length join is acceptable and preferred when ports already coincide and are compatible. The road, Worker, ocean mask and physics must all share that installed geometry.

## Verification / unfinished tasks

R2a adds `tests/coast-neighbour-segments.unit.ts` to assert reference anchor parity, source positions, unique boat IDs and deferral isolation; R1b has separate tests for the natural beach arrival and Sail Bay boats.

**Not run in this GitHub-only editing environment:** project TypeScript/Vite build, Vitest, browser full drive, private model preview, shore bake, real gamepad and Pixel 8. Run `npm run verify:dev` and targeted tests locally before treating these commits as build PASS. Future R2b must verify there is no shifted or duplicated working boat/forest at the old source stations, and investigate traffic/hazard changes for each revised course length.

**No release, no merge to `dev`, no completed R2b claim.** This inventory is ready for review and for Codex to pick up the actual harbour/forest world-space placement and Connector work when local execution becomes available.

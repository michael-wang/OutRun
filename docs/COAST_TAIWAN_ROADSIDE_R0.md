# Coastal Taiwan roadside identity — R2 almost-entire-route release candidate

Status: implemented on `dev`, pending driver-side photo/FPS acceptance on
Pixel 8. This R2 supersedes the earlier three-segment R0/R1 notes below.
**Houses and accepted mountains remain untouched.**

## R2 changes (2026-11-07)

- Drainage runs continuously along the inland side from **60–9,970m**.
  Open rural U channels alternate with covered town segments and a few
  covered driveway/field-road crossings. Beach/ocean side is unchanged.
- **Open U channels now hold a thin, visible ~20cm murky green water surface**
  with occasional warm sunset highlights; the >1m concrete walls remain
  visible. No extra runtime water simulation, no transparent draw pass.
- Covered town gutters have flush precast slabs, transverse seams and occasional
  narrow grilles, **without the formerly excessive grey slab to the right**.
  Ground/grass immediately resumes outside the lid.
- Rural concrete roadside stones use exactly the displayed 12m marker slots
  for **swept individual-stone collision**. Hitting a stone reduces speed,
  nudges the car back, adds short body yaw/roll and reuses existing
  metallic impact sound and sparks. The rear and impact state reset on replay.
  The response is disabled until the stone's stream chunk is visible.
- The 64m regular lamppost recipe is retired. Utility poles now occupy
  several unevenly spaced groups across the road, typically **98–174m** apart.
  Only a minority carry a short streetlight arm and warm head, extending
  **toward the asphalt**, not toward the inland fields. Pole/wire mesh and
  instance counts remain bounded. Existing curated pole positions kept.
- Scoped Worker geometry: per-chunk one combined ditch mesh and one
  combined utility-wire mesh; no new draw-call family, runtime CSG,
  shadow map, or separate water FFT. Extra tests check segment continuity,
  individual stone hits, hidden-collider safety and lantern orientation.

### QA checkpoints

- `?at=850` — hit an individual concrete stone, compare speed/sparks, and
  check the open gutter water under the low sunset.
- `?at=2100` — transition from quiet seaside to further open roadside drains.
- `?at=3990` — lids next to the pavement, no unwanted outer grey sidewalk.
- `?at=5600` — middle town covered drainage and occasional pole lamps.
- `?at=8550` — open ditch, no visible barrier; invisible safety clamp remains.
- `?at=9550` — another short covered farmyard crossing.

Manual quality gate: actual 10km phone drive and FPS check. GitHub CI is not a
substitute for phone visual/performance acceptance.

---

# Coastal Taiwan roadside identity — R0 art trial

Status: implemented on `dev` in the existing Worker-prepared coast, for human driver-side art and Pixel 8 FPS review. **Do not merge into `main` before playing it.**

## Art direction / reference logic

- Farm: one-storey reddish brick base, lime-washed wall, warm clay roof, iron window guards, stainless tank and a pragmatic corrugated-metal toolshed; the existing hero courtyard gets traditional brick/plaster bands and visible entrance decorations.
- Town: old RC/terrazzo-front townhouse, narrow garage roller shutter, practical window bars, parapet, roof water tank and occasional sheet-metal rooftop addition. Keep mixed-age building silhouettes: not every home is traditional.
- Roadside: true shallow U-profile depression on the **inland** side of the coast road, light concrete edges, wet/drained dark trough. Rural sections expose the channel; town sections use slabs with intermittent inlets; driveways have covers.
- Poles: gray precast concrete with near-ground black/yellow warning band, little ceramic insulators, one occasional transformer, and 3 thin hanging lines. Irregular absolute route positions are stable across chunks and reruns; no per-frame billboard/pole recalculation.

Real Taiwan cues: [Ministry of Culture — Traditional Sanheyuan](https://tcmb.culture.tw/zh-tw/detail?id=306824&indexCode=Culture_Object), [NLMA Stormwater design handbook](https://www.nlma.gov.tw/uploads/files/d788f1e1793c7b3631a67be37a4aec7c.pdf), [WRA Roadside Drain glossary](https://www.wra.gov.tw/NewsRiverNoun_Content.aspx?n=25142&s=2566), [Taiwan old townhouse façade / balcony examples](https://smiletaiwan.cw.com.tw/article/2318).

## R1 field correction — 850 / 3990 / 8550 (2026-11-07)

The first R0 experiment was judged too much like a light-colored highway
shoulder with a shallow decorative stripe. The acceptance photos show a deep
concrete roadside U channel in the countryside and nearly flush precast-cover
panels in town. This R1 supersedes **only the road/drain/utility-lamp treatment**;
the accepted rural/town house shapes and orientation are untouched.

| Playtest | Correct physical order from road to inland |
|---|---|
| `?at=850` | Existing 5 traffic lanes → short black asphalt apron (NO sand) → widely spaced low concrete stones → open steep U drain ~1.12m deep → concrete far lip / planted verge. Hero driveway and crossing are covered. |
| `?at=3990` | Road asphalt → flush concrete drain lids, dark transverse seams and occasional grille → town footpath. **No** rail/stone between player and covered drain. |
| `?at=8550` | Road asphalt → open deep concrete U drain → narrow lip / planted verge. **No** visible rail/stone. Off-road steering retains a smooth invisible right-side safety limit, so the player cannot fall in. |

- Fixed physical gutter footprint: asphalt edge at right x=10.12m, near lip
  x=10.26m, steep wall to x=10.48m, bottom to x=12.38m, steep far
  wall ends at x=12.62m; planted/sidewalk terrain meets the original
  grass mesh at physical x=14.75m.
- The ROAD Worker replaces *only* the former coast sand shoulder ribbon
  on these three intervals with the **existing asphalt material**, and its
  first grass ribbon adjusts its **raw** inner edge to follow x=14.75m even
  where the authored road shoulder narrows. No grass may overlap the ditch.
- The scenery Worker uses the same coastBeachHeight sampler for actual
  terrain-side depth; the ditch remains one vertex-color instanced
  geometry per 1km chunk. Town lids and slots are baked into that batch.
- The accepted irregular utility-pole distances are unchanged.
  **Only poles at d=906, 1257, 4060, 4316, 8640, 9106** receive short
  warm streetlamp arms. Existing generic lamp shadows are suppressed
  inside the new gutter sections; pole-lamp shadows follow the actual poles.
- The player-side collision safety is only a coast-specific optional cap
  around x=9.0m (car center), eased in over 70m, with all original
  five-lane road, vehicle physics outside these pockets and sea side intact.

Dedicated regression: `tests/coast-drain-road-profile.unit.ts` plus
`tests/coast-taiwan-roadside.unit.ts`, `tests/coast-resort.unit.ts` and
coastal shadow checks. Human visual acceptance and Pixel 8 FPS are still
**pending**; GitHub Actions passing is not equivalent to game-camera review.

---

## Playtest checkpoints

| QA URL suffix | Observe |
|---|---|
| `?at=850` | Drive from rice-field sea vista toward brick courtyard. Look for low open gutter near inner edge of shoulder and irregular utility poles. |
| `?at=1030` | See the existing courtyard bridge/driveway over a covered portion of the road gutter; watch that the deeper separate irrigation creek remains intact. |
| `?at=3990` | Visit town/market. The road gutter should appear mostly covered, occasionally displaying a dark inlet slit. Townhomes should have roller doors, metal bars, balconies and water tanks. |
| `?at=8550` | Late fishing farmland gets another sparse line of poles and a mixed open/covered drainage channel. |
 
## Engineering budget and ownership

- `src/coast-rural-vignette.ts`: more recognisable Taiwanese details in the **same one prefab geometry** per named house kind; existing instancing unchanged.
- `src/scenery.ts`: some old generated farmsteads become the existing shared prefab (variety preserved), and ordinary town houses get a few larger facade details with existing box/cylinder templates.
- `src/coast-roadside-layout.ts`: three curated spatial pockets (780–1515m; 3965–4435m; 8525–9210m), deterministic poles and mixed U-ditch cover recipes.
- `src/scenery-cross-section.ts`: U-channel depth is sampled by the same geometric terrain source for both road and scenery, never drawn as a fake opaque trench overlay.
- `src/road-chunk.ts`: extra 14–18m cross-section samples **only in chunks overlapping the above sites**. Asphalt/collision strips untouched.
- `src/coast-roadside-geometry.ts`: each whole drainage pocket within one 1km scenery chunk = one indexed color mesh; all wire spans within one 1km chunk = one indexed color mesh. Pole geometry uses existing instanced shared primitives. No real-time catenary updates, custom dynamic shaders, model downloads or additional shadow-map passes.
- `tests/coast-taiwan-roadside.unit.ts`: finite geometry, actual depression, crop/road safety, irregular spacing, chunk stitch, normals and draw-count structure.

## Human acceptance gates

1. **Visual:** from a speeding chase camera, the houses read as lived-in Taiwan (and not a generic western suburb); both the mostly open rural ditch and covered town drain are recognisable.
2. **Safety:** no pole on live asphalt, no new collision wall, no crop terrace destruction, no ditch floating above the road, no wire across empty coastal bays or in front of the approved distant mountain composition.
3. **Mobile:** retain a comfortable Pixel 8 driving FPS compared with the previously accepted coastal version. CI does not prove the phone GPU cost; if necessary, first thin pole count/wire segments rather than removing houses or the visual depth of the ditch.

The ocean-side shoulder remains beach/sea, so do not force a continuous second gutter there just to achieve symmetry. Later roads with land on BOTH sides can use this same utility recipe on both verges.

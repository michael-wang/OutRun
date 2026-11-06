# Coastal Taiwan roadside identity — R0 art trial

Status: implemented on `dev` in the existing Worker-prepared coast, for human driver-side art and Pixel 8 FPS review. **Do not merge into `main` before playing it.**

## Art direction / reference logic

- Farm: one-storey reddish brick base, lime-washed wall, warm clay roof, iron window guards, stainless tank and a pragmatic corrugated-metal toolshed; the existing hero courtyard gets traditional brick/plaster bands and visible entrance decorations.
- Town: old RC/terrazzo-front townhouse, narrow garage roller shutter, practical window bars, parapet, roof water tank and occasional sheet-metal rooftop addition. Keep mixed-age building silhouettes: not every home is traditional.
- Roadside: true shallow U-profile depression on the **inland** side of the coast road, light concrete edges, wet/drained dark trough. Rural sections expose the channel; town sections use slabs with intermittent inlets; driveways have covers.
- Poles: gray precast concrete with near-ground black/yellow warning band, little ceramic insulators, one occasional transformer, and 3 thin hanging lines. Irregular absolute route positions are stable across chunks and reruns; no per-frame billboard/pole recalculation.

Real Taiwan cues: [Ministry of Culture — Traditional Sanheyuan](https://tcmb.culture.tw/zh-tw/detail?id=306824&indexCode=Culture_Object), [NLMA Stormwater design handbook](https://www.nlma.gov.tw/uploads/files/d788f1e1793c7b3631a67be37a4aec7c.pdf), [WRA Roadside Drain glossary](https://www.wra.gov.tw/NewsRiverNoun_Content.aspx?n=25142&s=2566), [Taiwan old townhouse façade / balcony examples](https://smiletaiwan.cw.com.tw/article/2318).

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

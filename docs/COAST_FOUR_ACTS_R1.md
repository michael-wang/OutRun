# Coast Scenic Journey — Four Acts (R1)

Status: `dev` playable implementation, pending hands-on Pixel 8 art/FPS acceptance. This is NOT a request to change the driving/handling, approved mountains or Ultra Water.

## One continuous 10 km journey

| Metres | View left | View right | QA start |
|---|---|---|---|
| 0–1,800 | Open ocean and sunset, minimal boat clutter | Main rice plain 200–900, hero courtyard and canal ~1,050, flowers 1,200–1,700, farmsteads and trees | `?at=350`, `?at=850`, `?at=1360` |
| 1,800–3,400 | Broad visitor beach and beach life | Sparse scrub/rough headland, no market, no farms | `?at=2170` |
| 3,400–7,000 | Sails, yachts, visitors beside town bays | Small residential fronts, markets and two farm pockets (4.5–4.9, 5.8–6.2km) | `?at=3620`, `?at=4110`, `?at=5600` |
| 7,000–10,000 | Fishing boats, two small working landings, tiny tourist beaches | Working rice, flowers, farmsteads, sparse settlement | `?at=7230`, `?at=8720`, `?at=9470` |

## Implemented source of truth

- `src/coast-journey-layout.ts`: non-overlapping four act boundaries and quiet-beach vegetation envelope.
- `src/coast-layout.ts`: beach pockets, markets/housing districts, rocks and crossings.
- `src/coast-farm-layout.ts`: complete farm recipes and farmyard/scarecrow anchors. Existing worker prep and crop LODs are reused.
- `src/coast-rural-layout.ts`: showcase at ~1,050m; opening courtyard moves forward instead of duplicating a second at 3km.
- `src/scenery.ts`: reused instanced hamlet, opening field trees, two small fishing gear / pier landings.
- `src/coast-boats.ts`: six distinct, batched fishing crafts after 7km; larger sailing presence in town portion.
- `src/coast-nature.ts`: deterministic second-act sparse vegetation only.
- `src/coast-ultra-stage.ts`: stage beat metadata reads from the same four act definitions.

## Technical guardrails

- Keep road, camera, handling, sky, mountains, ocean and shadow geometry unchanged.
- Vignette lives entirely inside the existing `1000–2000` scenery chunk; no special runtime teleports.
- First farming zone starts early but crop geometry and field warmup continue using existing Worker preparation.
- Fishing craft are merged by material before clone/reflection/shadow processing; do not create a draw call for every net pole or crate.
- All zone membership, repeated arrays and boat/house/crop anchors are build-time / Worker-time. No per-frame scene generation.
- Tests include four-act order, crop/house boundaries, water, boat safety, nature and standard maintained unit suite.

## Manual art pass

Check the 1,050m courtyard from the road at `?at=850`: entrance visibility, not buried by trees, not floating, bridge and creek legibility. Drive the 1.8km transition for deliberate scenic quiet, the 4–6km town for crowding/variety, and 7–10km for fishing silhouettes. Also measure Pixel 8 moving FPS: CI passing does not establish mobile GPU performance.

`main` promotion is a separate explicit publishing decision.

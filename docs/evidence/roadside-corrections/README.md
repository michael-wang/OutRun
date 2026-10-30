# Roadside gameplay corrections (r6 / ALB6)

Three independent milestones on dev; no main merge or deployment.

- A: Original extreme-turn events now produce one directional/hairpin board each. Seed 1: 16 original events (32 old BRAKE boards), versus 350 r5 generated warnings, now 16 boards. Original 300 m advance placement and roadside offset retained. First board: 3170.5 m; matched screenshots at 3120.5 m: sign-r4.png / sign-r6.png.
- B: First exposed right rocky shoulder: 1720–2100 m (inspect 1850 m), with 80 m transitions. Connected faceted rock geometry replaces the uniform shoulder edge; interfering rails/posts are omitted. Collision uses the same interpolated 5 m inner-face nodes. Asphalt pass causes zero contacts; deliberate departure produces one bounded impact and recovery. rock-1670.png / rock-1850.png show transition; rock-impact.mp4 shows contact.
- C: Existing warning triangles reuse the cone pool/impact lifecycle. Original geometry, positions and breakdown vehicles retained. Seed 1 triangles: 12510, 12630, 12710 m before the stopped vehicle at 12750 m. Swept contact launches a triangle once, with a negligible 0.5% speed penalty; hit state survives window reloads and clears on replay/new route. Triangle-only forward throw makes tumbling readable at high speed; accepted cone motion is unchanged. triangle-launch.png and triangles.mp4 show actual rendering and avoidance of the stopped car.

r6 is the new default content revision. Historical r1–r5 paths remain available; r5/r6 centerline and banking samples are identical.

## Verification

- Production build passed (existing bundle-size warning).
- 33 focused unit tests passed across 11 files: corrections, roadside, traffic continuity/impact/lane changes, pass-by, shared skid, seamless banking, banking, surface contact, Trip Codes.
- 10 browser tests passed: four corrections, two traffic impact, four v0.9 Trip tests. Includes accepted cones, stopped-car avoidance, replay/new route, banked wheel contacts and seams at 620/1000/1930/2000/3000 m and a showcase curve.
- Edge desktop GPU, mobile 960×432 / DPR 2 / touch, CPU throttling 4×. Rock and triangle gameplay samples after warm-up: minimum rolling FPS 59.99, streaming ready throughout. Short scenario measurements, not a full-trip benchmark or physical Pixel 8 result.
- Recordings are silent canvas captures. Tests use scripted controls with normal gameplay rendering/chase camera; no concept art.

Await Michael's physical-device playtest and Julia's visual acceptance.

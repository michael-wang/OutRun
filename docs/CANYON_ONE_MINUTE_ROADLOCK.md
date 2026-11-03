# Grand Canyon — One Minute Road Lock (driving-first prototype)

**Status:** Fixed road authored, pending Michael's physical driving acceptance.
This deliberately changes the road, NOT the existing Designer Canyon scene.
The two prior test URLs remain untouched.

## Launch
- NEW: `http://localhost:5173/?showcase=canyon&road=lock`
- QA: `http://localhost:5173/?showcase=canyon&road=lock&qa=1`
- PREVIOUS: `http://localhost:5173/?showcase=canyon`
- Blender v2 still belongs to the *old* road: `?showcase=canyon&art=blender`.
  Do **not** try to reuse its GLB on the new centerline.

## Driving script: 5650m, about one minute depending on acceleration & braking
| Relative distance | Road director | Visual strategy |
|---:|---|---|
| 0–500m | Approach, mountain highway | Basic corridor and old rocks |
| **500–1220m** | **Hero 1: ~176° LEFT hairpin, C08** | Open valley on the inside of the first turn |
| 1220–1970m | Reverse-direction mountainside leg | Basic transition; view of previous road |
| **1970–2710m** | **Hero 2: ~176° RIGHT hairpin, C08** | Higher switchback over lower levels |
| 2710–3600m | High plateau and long left sweeper | Terrain placeholder until art |
| 3600–4250m | Canyon cut corridor | Use rocks to hide incomplete backdrop |
| **4250–5000m** | **Hero 3: broad scenic curve** | Open-space placeholder vista |
| 5000–5650m | Sweeping exit | A driving release after the big moments |

- **Four physical lanes** across all beats: 14m asphalt, two each way.
- No simulated lane closures, no under-specified 2-lane narrowing.
- This first road-only playtest disables ordinary traffic, breakdown vehicles,
  cone rows and warning triangles. Reintroduce traffic after the road passes.
- Mountain pavement is darker, softly worn, with simple white edge lines,
  a **double yellow center** and dashed separators within each direction.
  No red-and-white racetrack curbs or orange cone avenues.
- A fixed elevation script rises roughly 300m from entry to peak, then
  descends. Maximum intended grade is ~28%, arcade-extreme by design.
- Two 720–740m C08 switchbacks demand **braking**: at indicated 230 km/h
  the effort is above steering authority. Their ramps bank progressively
  to about **+26° left / -26° right**. Later sweep sections bank ~17°.
- These values are not safe-road-engineering claims; judge speed, comfort,
  sightlines and control *in game*.
- Eight static QA navigator stops under **峽谷極限賽道 (8)**.
- Small existing handmade rocks/mesas and base terrain are **placeholders**
  only; no Blender art and no generated vista promise at this milestone.

## Accept the road BEFORE designing new scenery
On a real device or desktop, drive **from start to finish** rather than
teleporting through individual still frames. Focus on:
1. Are both broad opposite-direction U-turns clearly felt? Is braking
   necessary and fair?
2. Can the player see the road below, and are the vertical layers credible?
3. Are the climbs/descents and crossfall exciting without becoming
   physically uncontrollable?
4. Do the roads remain fully streamed and collision-safe at 300 km/h?
5. Does the one-minute progression feel like three memorable heroes
   separated by gentler connecting roads?

Only after the route passes will we hand-build its Blender landscape around
these now-final coordinates. Do not warp the route to fit the previous v2 GLB.

## Source of truth and tests
`src/designer-canyon-roadlock.ts` holds every fixed curvature, elevation,
bank moment and optional near/far placeholder. No procedural composer and no
per-frame geometry analysis are added.

`tests/canyon-roadlock.unit.ts` verifies four lanes, signed turn angles,
grade/altitude, physical banking, nonadjacent planar road separation, prop
clearance, and the mountain paint meshes. Scene Inspector Playwright smoke
checks the separate route and eight QA jumps.

The **manual acceptance gate is distinct from CI**. Tests cannot decide if
a 26° banked switchback is fun to drive, and desktop/mobile emulation is not
a substitute for Pixel 8.

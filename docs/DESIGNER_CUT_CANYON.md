# Designer’s Cut 01 — Grand Canyon

This is **one authored arcade level**, not a random seed or a new world generator.
The source-of-truth design is `src/designer-canyon.ts`, compiled into the
Vite bundle at **build time**. There is **no call to `generateTrip()`** when
opening this level; it is a static manifest of the track, canyon and props.
The road Worker still converts its fixed placements into Three.js road meshes
on demand, preserving the same stable mobile streaming engine.

## Launch
- `?showcase=canyon` — start the designed route (press Play).
- `?showcase=canyon&qa=1` — opt-in Scene Inspector, photo capture.
- `?trip=10m&seed=1` — previous 69km procedural mode unchanged.
- `?trip=10m&seed=1&revision=r12` — accepted R2.1 benchmark unchanged.

The route is 3,200m (plus the existing start/tail buffers), ID
`CUT-CANYON-01`, generator marker `designer-canyon-v1`.

## Designer script, not a procedural recipe
| Arc of journey | Relative distance | Experience |
|---|---:|---|
| Approach | 0–560m | Lower rocky entrance, sparse hand-placed talus |
| First left curve | 560–1,300m | The river valley opens on the left |
| River overlook | 1,300–1,910m | Low outer cliff + opposite rim occupy the landscape |
| Sandstone return | 1,910–2,680m | Road bends back between broad, layered terraces |
| Final relief | 2,680–3,200m | Open gentle exit, no hard camera cuts |

The scene contains a fixed 19-item scenic prop inventory: broad cliff and
rim **bands** (not regularly spawned stone pillars), talus gardens, a single
small overlook, and intentionally sparse scrub. Every prop has a named kind,
absolute road distance, lateral offset and explicit dimensions.

## Terrain/river
The canyon follows the normal road through the already accepted
`PilotCandidate` curve and elevation profiles, but the author chooses every
curve and grade at source. The canyon uses an **authored lateral height
profile**, with an outer river trench at a fixed world-Y **56m** and a high
right-hand rock slope. The huge global ocean at -5m is hidden in the
showcase; only the actual canyon river should read as water.

The current terrain system is still road-following; this is an intentional
**designer-controlled vertical slice**, not a claim that the entire
procedural-world problem is solved.

## Guardrails and performance
No car handling change, no per-frame scene search, no new stream protocol.
Material instancing, road buffers and the existing 1000m chunk logic stay
unchanged. City-style marker rows are omitted in the canyon core, while
actual guardrails and collisions stay in place. No extra assets are fetched
at runtime.

## Acceptance
1. Starting the level uses only the authored object, never route generation.
2. Road curvature/elevation have no discontinuities, floating river planes
   or missing 1km stream seams.
3. The river should enter the normal chase-camera frame during the crafted
   left-hand reveal; adjust the actual road and focal landmark if it does
   not. No forced free-look or unannounced camera rotation.
4. The canyon has deliberately distinct near/middle/far layers; objects
   stand on continuous ground.
5. Pixel 8: check original 57–60 FPS target and zero Preparing road stalls.
   Browser CI is not a physical-device FPS guarantee.

## How Julia should iterate
Edit the **specific fixed coordinates** in `src/designer-canyon.ts`, rebuild,
and drive the exact same level. Human screenshots and movie clips decide
whether the composition works, not just an automatic frustum flag.

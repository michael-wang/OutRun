# Seed 1 canyon road identity

One environmental vignette at absolute route distance 600–900 m (Trip distance 250–550 m), Seed 1, `TRIP-v0.9-r1-1-ALB1`. Seed 1's canyon minimum is four lanes, so all four lanes and existing lane paint remain. The road wraps a connected, faceted sandstone ridge on its inside/left; an outside/right metal guardrail replaces track-style edge decoration and bollards. A lowered outer slope and two lower canyon formations add depth. Terrain and props are prepared in the existing worker and retire with their chunk.

Road curvature, width, elevation, Trip Code inputs, asphalt wear, tire effects, handling, camera and traffic are unchanged. Asphalt/collision mesh and lane paint compare byte-for-byte with the previous output; 620/720/820 m gameplay samples and camera settings match the saved BEFORE. The rock mesh stays over 9 m from nearby road centerlines (7 m road half-width), and its skirt is buried into the existing terrain.

- [Before, 620 m](evidence/canyon-identity/before/620.png) / [After, 620 m](evidence/canyon-identity/after/620.png)
- [Before, 720 m](evidence/canyon-identity/before/720.png) / [After, 720 m](evidence/canyon-identity/after/720.png)
- [Driving clip](evidence/canyon-identity/drive.mp4)

Build passed with the existing bundle-size advisory. Nine focused unit tests passed (road geometry, trip generation, scenery clearance, traffic). Four browser checks passed: identical-view comparison, streamed drive/performance, traffic overtaking, and traffic collision/replay/contact regression. The latter two reused the existing traffic tests with outputs redirected to a temporary evidence folder, preserving historical captures.

Edge touch emulation at 915×412, DPR 2.625, 4× CPU slowdown, desktop GPU: initial samples 47.3 FPS, then 59.99–60.00 FPS; streaming stayed ready and wheel gaps stayed under 12 cm. This is not physical Pixel 8 acceptance. Michael's gameplay review and Julia's visual acceptance remain pending. No deployment or main promotion.

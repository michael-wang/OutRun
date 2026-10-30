# Roadside Gameplay v1

Default route: TRIP-v0.9-r5-1-ALB5. All distances below are absolute road coordinates (journey starts at 350 m).

| Feature | Seed 1 inspection location | Implementation |
| --- | --- | --- |
| Direction signs | 390 and 530 m warn of the right bend at 670–830 m; left chevrons start 3540 m; hairpin warning at 11200 m | Signed sampled curvature, advance signs at 280/140 m, repeated boards on difficult curves. No recommended vehicle speed. |
| Knockable cones | 1582.21–1672.12 m, left edge | Seven cones in this group; swept contact, outward tumble/bounce, 0.5% speed cost per hit update. One instanced draw, capacity 48. Hit IDs survive streaming until Replay. |
| Irregular rocks | Canyon around 1850 m (matched r4/r5 screenshots) | Buried low-poly boulders and small stones replace the regular low blocks. Clearance places them beyond the reachable vehicle corridor. Existing streaming/instancing. |
| Broken-down car | 12750 m, outer right lane | Warning triangles at 12510, 12630 and 12710 m. Both amber indicators flash. Stationary until impacted; existing collision reaction may push it. No lane changes. |

Other Seed 1 breakdowns: 29425, 42525, 60225 m. Seeds 2 and 7 also produce four deterministic hazards. Placement rejects sharp curves, steep/occluded approaches and changing widths; only one outer lane is obstructed.

Historical r1–r4 Trip Codes retain their prior road geometry and roadside content. r5 uses the exact accepted r4 road centerline, widths and seamless Banking. New features are gated to r5. Existing handling, traffic speed/cluster recipes, collision impulse formulas, audio, HUD and PWA behavior are unchanged.

## Gameplay evidence

- signs.png: normal chase camera warning sign.
- cones.mp4 / cones.png: actual driving hits seven cones; visibly launched/tumbling cones. No audio track in this capture.
- rocks-r4.png / rocks-r5.png: identical 1850 m position and camera.
- avoidance.mp4: triangles, flashing stopped car, normal-speed lane-change avoidance. No audio track in this capture.
- breakdown-impact.png: existing collision reaction against the same hazard.

## Verification

Production build passed (existing bundle-size warning). 35 focused unit tests passed, covering roadside features, traffic identity/streaming re-entry, lane changes, collisions, pass-by/skid logic, Banking/seams, Trip generation and surface contact.

11 browser tests passed: five roadside tests; existing collision rendering/recovery and all four traffic types/reset; four Trip UI/replay/New Route/historical-data tests. The r5 Banking browser check covers 620, 1000, 1930, 2000, 3000 m and the first strong showcase: wheel gaps below 0.08 m and seam error below 0.001 m.

Edge mobile emulation: 960 x 432, DPR 2, touch, 4x CPU slowdown, desktop GPU. Cone impact and breakdown avoidance both maintained approximately 60 rolling FPS (minimum 59.99 after initial samples), with every sampled streaming-ready check true. This does not establish physical Pixel 8 performance. Existing collision browser tests also passed their 30 FPS threshold.

No main merge or deployment. Await Michael's physical Pixel 8 test and Julia's gameplay acceptance.

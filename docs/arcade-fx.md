# Goal A — Arcade tire FX correction

Reference gate: Michael's supplied Image A (OutRun 2) shows visible front and rear smoke, a continuous white plume and dark trails; Image B shows the rejected near-invisible effect. The new real gameplay screenshots and recording were inspected at normal 915x412 size against those features. Front and rear smoke and the trailing cloud are immediately visible; dark wheel trails remain on the road. Human visual acceptance remains Michael/Julia's decision.

- Four actual wheel contacts now emit smoke; activation lowered from slip > .5 / 12m/s to slip > .22 / 8m/s, still requiring drifting and asphalt contact. White overlapping clouds, larger footprint, stronger opacity, 1.8s life and retained initial travel velocity. Fixed 192-particle pool, still one draw.
- Four dark .46m wheel trails, 18s expiry with a 768-segment ring buffer. Grip return breaks trails; replay resets pools. Two effect geometries/draws maximum.
- Uphill-only look target lowers by at most 1.4m (roughly 2 degrees of pitch at usual look distance), making the rising road more prominent. Camera eye, distance, handling and controls unchanged; no bias at level/downhill grades. Car/HUD clearance verified across six viewport sizes in both layouts.
- Build and 102 unit tests passed; 14 focused browser tests passed. 15-second 4x CPU-throttled Edge mobile emulation with recording: 58–60 FPS, bounded pools, all four emitters active, streaming ready, replay/new-route cleanup passed. This is a desktop GPU, not a physical Pixel 8.

[Drift screenshot](evidence/arcade-fx/comparison/after/drift.png) · [12-second real-time recording](evidence/arcade-fx/arcade-drift.mp4) · [Uphill after](evidence/arcade-fx/comparison/after/uphill.png) · [Uphill before](evidence/grounded-driving/comparison/after/uphill.png) · [Measurements](evidence/arcade-fx/driving.json).

No main merge or deployment. Goal B is a separate commit.

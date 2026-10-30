# L2P-B banking prototype

Opt-in URLs: `/?lab=pilots&pilot=L2P-B&bank=0`, `bank=4`, or `bank=10`. No banking is enabled on the public ten-minute Road Trip, other pilots, or L2P-B without this parameter. The parameter is deliberately separate from the seed, recipe and Trip Code.

Selected bend: Canyon Switchback's first right bend, absolute 700–1350 m (pilot-relative 350–1000 m). Entry 700–860 m, hold 860–1190 m, exit 1190–1350 m. Quintic easing has zero first and second derivatives at transition ends. Positive banking lowers the right edge. Comparisons are at identical 1080 m / 180 km/h / center-lane positions using the unchanged chase camera.

One profile changes the sampler's vertical cross-slope. Existing asphalt, markings, shoulders, terrain, rail strips/posts and scenery use that same lateral sampling, including worker-prepared chunks. Horizontal widths, centerline, curvature, elevation, seed and handling inputs remain unchanged. Player pose follows the cross-slope and its entry/exit gradient; existing drift/impact roll remains additive. Existing four-wheel raycasts ground the tires and contact shadows against the actual triangles; tire feedback retains its existing contact data. No camera changes. The original pilot has no traffic, and this experiment does not add it; public traffic remains unbanked and unchanged.

Verification:
- Production build passed; existing bundle-size advisory only.
- 20 focused unit tests passed: smooth/sign-correct banking, unchanged centerline, chunk/shoulder seams, trip generation, collisions, traffic, skid and impact regressions.
- Two browser tests passed: three bank strengths plus transition driving/public isolation; car, bus, truck and waffle impact separation/reset.
- Actual screenshot and recording frames inspected. Four-wheel raycast contact errors below 1 mm in all samples and driving checks. Chunk support seams exactly zero; no streaming readiness gaps during the drive.
- Edge mobile emulation: 960x432 touch, DPR2, 4x CPU slowdown, desktop GPU. Flat and 10-degree runs both averaged approximately 60 FPS after warmup. These short browser checks are not physical Pixel 8 acceptance.
- Recording covers 650–1414 m: flat approach, gradual entry, sustained 10-degree bank, gradual exit. No audio recorded for this geometry experiment.

Evidence: [Flat](evidence/banking/flat.png), [Gentle](evidence/banking/gentle.png), [Strong](evidence/banking/strong.png), [8.9-second drive](evidence/banking/drive.mp4), [measurements](evidence/banking/verification.json).

Awaiting Michael's physical-device review and Julia's visual acceptance. No merge or deployment.

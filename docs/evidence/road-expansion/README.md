# Road Geometry Expansion — r7 / ALB7

Goal A: `edf762b` — asymmetric shoulders. Goal B: red steel bridge and final roadside grounding integration.

## Seed 1 locations

- 2800 m: left 1.6 m / right 6.8 m shoulder. Reverse at 4800 m. 300 m quintic ramps; symmetric intervals remain. `shoulder-final-2800.png`, `shoulder-final-4800.png`; `shoulders.mp4` shows normal chase-camera transitions.
- Bridge: **31200–32100 m**, crossing the 32000 m streaming boundary. Approximately 8 seconds at the tested highway pace. Approach screenshot at 31020 m, deck at 31580 m, exit at 32180 m. `bridge-drive.mp4` is a 12-second normal-camera approach/crossing/exit capture; `bridge-side.png` is the explicitly diagnostic side view.
- Seed 2 bridge: 42100–43000 m. Seed 7 bridge: 11200–12100 m. Selection is deterministic, preferring gentle four-lane coastal sections.

## Implementation

A shared absolute-distance shoulder profile drives road/terrain edges, rails, posts and fixed prop positioning. Narrow-side rails reuse the existing contact response. Fixed props retain vehicle clearance and follow the actual terrain slope; asphalt lane geometry, centerline and handling are unchanged.

The bridge replaces outer land and ordinary scenery inside its span. It has a 1.2 m deck underside, edge girders, two tall red towers extending beneath the deck into water, cross-braces, suspension cables, hangers and solid side rails. The 2.2 m bridge shoulders blend over 220 m approaches. Beams are prepared in the road worker and merged by material into streamed chunk buffers. No per-frame structure generation or new dependencies.

r7 retains accepted r5/r6 cones, rocky shoulders, stopped vehicles, knockable triangles and warning events. r1–r6 retain their historical generation paths and Trip Codes. The three requested Roadside Polish items are recorded only in `docs/ARCADE_DESIGN_BACKLOG.md`.

## Verification

- Production build passed; existing bundle-size warning remains.
- 38 focused unit tests passed across 12 files.
- 17 distinct browser scenarios passed across the final regression and focused reruns: expansion, matched performance, r6 roadside regression, traffic collisions, Trip Code/replay/storage tests.
- Asphalt/shoulder boundaries, support/deck endpoints at 32000 m and banked wheel contacts checked. Actual rendered car bounds remain inside both bridge guardrails during high-speed contact; one impact per sustained contact.
- At the diagnostic bridge location, rays from below the deck and 25 m to either side hit only water at y=-10; no underlying land remains. Player contact error in the recorded drive was below 0.001 m; nearby traffic maximum sampled contact gap was 0.023 m. All sampled streaming windows remained ready.
- Edge desktop GPU, mobile 960×432, DPR 2, touch, CPU 4× throttling. Matched non-recording r6/r7 runs: both ~60.00 mean FPS / 59.99 minimum rolling FPS; draw calls r6 153–193, r7 119–162. Full video plus repeated contact diagnostics averaged 50.58 FPS, minimum 48.20. Maximum sampled main-thread chunk commit 0.8 ms; maximum road-worker preparation 750 ms (ahead-of-player work, no missing window).

Recordings use scripted gameplay controls and the normal chase camera, with actual rendering. They are silent canvas captures. This is browser emulation, not physical Pixel 8 acceptance. No main merge or deployment. Await Michael's physical playtest and Julia's visual review.

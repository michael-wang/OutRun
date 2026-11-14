# Coastal Highway — Cabriolet Cabin Wind & Hero Framing R0
> **Owner R6 decision (2026-11-14): superseded as a staged rollout.** DO NOT execute P0 framing, then P1 wind, then later spring/tip geometry as separate tickets. Instead implement **both characters at scale 1.0 + freely retuned Spring Bone mid-to-tip golden hair + continuous open-top cabin relative-wind** in ONE playable dev pass via [Issue #45](https://github.com/michael-wang/OutRun/issues/45) and [canonical R6 specification](COAST_HEROINE_R6_INTEGRATED_PASS.md). The analysis below remains technical background only; its earlier P0/P1 sequencing, QA-only 0.92/1.0 scale comparison, and preference for Shape Keys A no longer dictate current construction. Pixel 8 original-size playtest and renderer performance guardrails still apply.

Date: 2026-11-14
Owner/Julia design direction. Status: next-sprint specification / research. **No new game features or device benchmark have been implemented by this document.** Audience: Julia + Codex.
Related: [technique-first production principles](ART_TECH_CO_DESIGN_PRINCIPLES.md), [hair physics A/B postmortem](COAST_HEROINE_HAIR_TECH_REVIEW.md), [approved character identity](art-review/h1ar/README.md).

## Player fantasy to protect

A glamorous blonde passenger and male driver **matter as focal subjects**. At 60–80km/h a cabriolet already feels windy; at 120km/h layered golden tips remain visibly alive; at 280–300km/h the *outer and nape tips* flutter continuously and asymmetrically, but the asymmetric bob's swept crown and bangs stay styled. The **rear chase camera** is the primary art view and existing Riviera road visibility must not be damaged. Driver and passenger can be a bit bigger relative to the car if their proportions still look credible. Don't spend Codex time on portrait-only eyes, facial likeness, a complete character rig, more Spring Bone frameworks, or unrelated scenery.

## 1. Real screen pixels ≠ CSS pixels ≠ drawing buffer

**Confirmed repository facts (dev, as read 2026-11-14):**
- `src/main.ts` sets `renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1 : 1.75))`. Thus a coarse-pointer Pixel 8 renders at **DPR 1** (nominally canvas CSS dimensions, not native 2400×1080). It resizes using the app element clientWidth/clientHeight.
- Pixel 8 physical OLED = **1080×2400** pixels, 20:9 (landscape 2400×1080), official https://support.google.com/pixelphone/answer/7158570 .
- `src/chase.ts`: follow camera is at **8m distance, 2.6m height**, fixed horizontal FOV ~76°, vertical FOV varies by aspect.
- `src/car.ts`: player **driver and passenger `person.scale.setScalar(.84)`** around their seat centers. The rear framing/fov/driver arms are already tuned together.
- Prior 960×540 side-by-side A/B was a **controlled PC visual fixture**, not measured Pixel 8 drawing buffer. It is useful for apples-to-apples motion evaluation, but should NOT be the sole art acceptance or assumed equivalent to the device.

**Next work must measure on actual Pixel 8**: `window.innerWidth/innerHeight`, devicePixelRatio, canvas client size, `renderer.getSize()`, `renderer.getDrawingBufferSize()`, physical screenshot size, hair/bust occupied bounding-box in **CSS and real drawable pixels**, 60/120Hz frame-time stats. Include screenshot/video at original device resolution, not upscaled by a desktop video player.

For QA try DPR=1 baseline then **QA-only 1.25 / 1.5** and, *only if practical*, a higher control. Use real on-device GPU/frame time and user art impression to choose, never auto-set Pixel 8 to native DPR~2.5. Pixel work ~DPR², and Three.js recommends a budget cap: https://threejs.org/manual/#en/responsive and https://threejs.org/docs/#api/en/renderers/WebGLRenderer . Dynamic runtime DPR adaptive logic is OUT of scope unless already implemented; don't hurt Pixel 8 to win a still image.

## 2. Composition: make the people visibly matter, without zooming out the road

Before any art retopology:
- Compare **existing 0.84** to two **QA-only alternate body scales ~0.92 and ~1.00** (or other nearby values based on fit). Scale both existing seated people consistently about their own seat pivots, not the whole car or level. A larger character remains plausible if shoulders, head, arm positions and size vs seats match the car. No unearned "more detail" claim merely from enlarging.
- **Keep CHASE camera (8m/FOV) unchanged for FIRST comparison**, so improvement is clearly due to composition. Only if passengers cannot be made legible without clipping should Codex sketch one cautious *camera* alternative, not silently change main gameplay view. Check road horizon, upcoming traffic, rivals and HUD occlusion.
- Test driver hands on steering wheel/left door, passenger shoulders/neck, body seats, windshield, door edges, hair motion bounds and future side glance. The current body scale was previously reduced to avoid oversize. Do not force 1.00 if it looks like giants squeezed into a roadster.
- Show side-by-side real-size rear chase screens and % frame occupancy for car and both silhouettes (not only hair pixels). Do not change final default scale until owner + Julia approve.

## 3. New domain: world breeze vs passenger head airflow

**Existing dev**:
- `src/coast-wind.ts` has `sampleCoastWind(x,z,time)`, `sampleCoastGust` deterministic 64×64 world noise with broad/eddy/flutter and stage wind.
- `content/stages/coast/effects.json`: wind default **2.6m/s**, gustStrength .35, direction [1,0] (the ocean's separate FFT `windSpeed=6` is NOT cabin/head wind).
- `src/main.ts` currently supplies `sampleCoastWind` to tire/dust and traffic; not to player occupants.
- `src/occupants.ts`: `wind` is a single smoothstep of **absolute travelled speed over [0,84]m/s**, plus fixed-phase flutter and lateral acceleration lag. `src/blonde-groom-asset.ts` maps existing `wind,sway,tipSway,flutterPhase` to 5 glTF morph targets. New hair GLB preload/fallback ALREADY exists on dev; do not rebuild its loader.
- Issue #43 Spring Bone A/B was mechanically valid but no material chase-view art advantage; PC CPU ~+0.29ms/frame with B; retain inexpensive **Shape Keys A** by default.

### Scientific/physical basis (NOT a demand for full CFD)
- Apparent air relative to moving observer is **`V_air_relative = V_world_wind - V_vehicle`** and depends on both direction vectors. Review: https://www.mdpi.com/2073-4433/14/5/765 .
- 2-seater convertible CFD shows windscreen step and A-pillar vortices plus unsteady fluctuations/eddies into the cabin: https://pubs.aip.org/aip/pof/article-abstract/35/1/015144/2868198/Flow-characteristics-and-wake-topology-of-two-seat .
- Another research study on convertibles describes recirculation in the open cockpit and different head-level exposure depending on shielding and cockpit geometry: https://research.chalmers.se/en/publication/125259 .
- Owner reports strong, unsteady airflow at 60–80km/h even in still weather, which should shape the *feel*, not be dismissed because environmental wind is only 2.6m/s.

### Proposed tiny `CabinWind` concept (no new generic engine)
Inputs per tick: car position, world forward vector/true world velocity, sampled environmental `sampleCoastWind`, elapsed driving time, actual speed from traveled metres/dt, lateral acceleration, the occupant's head orientation as appropriate.

1. Convert **world environment wind - car world velocity** to car/head-local airflow. Don't use HUD km/h for physical vectors and don't double-count timeScale/effectivePace. At ~300km/h, vehicle relative wind can dwarf ambient 2.6m/s. Sign-check left vs right turn.
2. Add small **stylized cabin-specific turbulence** inspired by the windshield/A-pillar wake; environmental world gust is not sufficient on its own. One shared coherent low-frequency envelope (broad buffeting), one medium band of local eddies, and **weak asynchronous tip flutter** per clump. Deterministic band-limited smooth noise or equivalent (not identical sinusoids and no white-noise jumping each frame). Each lock gets subtle spatial/phase offset; NOT independent random chaotic motion or entire crown bobble. Do not solve a CFD grid.
3. **Drive tip motion noticeably by 60–80km/h**; preserve appropriate buildup at 120km/h; at 280–300, avoid unlimited bend and whole-bob collapse. Stylize saturation of mean back-sweep while allowing continually varying gust amplitude/direction/frequency. A physical quadratic wind loading can inform envelope, but should NOT be fed unbounded directly into art motion.
4. **Cabin shielding** near windshield/head, exposed sides and nape may differ. Start with a small manually art-directed exposure response, no geometry-based dynamic CFD/flow probes. Do not assume cockpit wake direction is always rearward; a strong head-local reverse/updraft component is plausible but depends on specific windshield geometry. Use an observable visual test instead of claiming full accuracy.
5. Existing `createOccupantMotion` owns smoothing/inertia. Feed `WindGroom` with compatible small adapter (keep existing API if adequate); avoid adding second unrelated simulation/physics system. Reset noise state on restart/teleport, stop advancing when paused, preserve determinism across dt and QA seeds. Avoid one extra heavy per-frame texture upload or per-vertex JS updates.
6. Continue fine-tip **geometry** track separately only if wind test shows dynamic articulation still hidden due to thick silhouette. Stage wind should be reusable later for flags/cloth/foliage, but do not build a universal wind engine on this ticket.

**Art direction test script**: stopped calm/windy, 60, 80, 120, 220, 300km/h steady cruising, head glance, sustained L/R curves, accelerate and brake to zero; same route and RNG seed. No visual hair jump; no synchronized six-tip pendulum, no large static equilibrium at full speed. Delicate repeated flutter while upper bob stays styled. Avoid introducing actual dangerous aero force into vehicle steering.

## 4. Production order and STOP gates (Codex quota protection)

**P0 audit + QA harness (tiny, before rewriting wind)**:
- Dump actual renderer buffers on Pixel 8; show 0.84 vs ~0.92 vs ~1.0 character framing; run DPR1 vs QA-only 1.25/1.5 with FPS/frame-time; compare one short same-route clip. No change to race/game camera or production DPR. *Stop if an existing frame-budget issue is revealed.*
- These visual tests may expose that simply enlarging the characters makes their hair sufficiently readable; prefer that low-cost win before shader or model work.

**P1 cabin wind comparison (one bounded prototype)**:
- Implement minimal cabin-wind sampling and drive **existing accepted Blender hair GLB Shape Keys**. Compare **baseline wind vs cabin wind** with the exact same hair geometry, fixed camera and same playback inputs. Test at low/medium/high speed + L/R turns with 10–15s real gameplay or isolated car viewer, key screenshots and a short CPU profile. First concentrate on a visible but beautiful effect in normal chase framing, then refine once if needed. Can use a QA-only mode until approved.
- If new wind brings no obvious value, report/test and **do not** continue into multi-stage turbulence frameworks or full hair retopology.

**P2 later after owner/Julia art acceptance**:
- Integrate approved wind/framing defaults, test Pixel 8 stability and the existing hair completion QA #42. Then reconsider one slender/finer tip silhouette #44 if still needed; don't unconditionally do both.

### Strict limits
- One best-effort pass per gate, small diff, reuse `sampleCoastWind` and the existing morph controller.
- No Spring Bone redevelopment, cloth/CFD, hair model rerender, new face/full character, vegetation, game level, AI, collisions, road, HUD changes or camera motion redesign. Keep original assets and old behavior available for A/B.
- Mobile picture quality decisions require **owner device acceptance**, not just PC 960x540. No external paid AI services or new commercial assets. No main promotion without explicit authorization.
- Protect Codex budget: do not run full browser regression suites for QA harness; when game code changes run focused tests and once-before-push build/verify:dev; one dev push. No duplicate CI on dev. Pause if task expands.

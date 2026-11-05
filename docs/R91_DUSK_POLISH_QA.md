# R9.1 Coastal Dusk Polish — CODED ON `dev`, VISUAL / PHONE QA REQUIRED

**Owner request (2026-11-05):** Implement, not merely illustrate, shadows for the player's car, beach props and ocean objects; improve sunset tire smoke; make passing traffic quieter than the player's engine, scaling with relative speed; retire tests that were already broken in the published baseline; catch visible <30 FPS regressions before closed-test publication.

**Scope:** `dev` only, version `v0.9-coast-r9.1-exp`. Existing `main` R9.0 remains the family-playtest build. Changes are not claimed as Pixel 8 accepted until physical drive and comparison.

## 2026-11-05 Sunset Cast Audit — Follow-up on owner Pixel 8 QA

**Accepted:** all three posts of short coastline guardrails and the large water-side rock silhouettes. **Still awaiting device art QA:** no luminous under-car halo, road cones and warning triangles cast correctly, every moving/parked car (including bus, truck and waffle van) has a directional dusk shadow.

**Implemented on `dev` (not a new rendering engine):**

- Player: retired the old colored canvas under-car decal for coast, while preserving it in noncoastal biomes. The existing `CoastDuskShadows.player` now uses true-black alpha ink, so compositing cannot brighten a very dark road; the four tyre contact patches are neutral black on the coast as well.
- Traffic: existing 12-actor contact batch retained. Added **one coastal-only 12-instance sun-projection batch** for all active cars/buses/trucks/waffle cars, using their existing poses and `coastShadowLength(height)` (no shadow-map or new render targets). Actors culled by road readiness have no cast.
- Roadside cones: existing `RoadCones` geometry pool receives exactly one additional black-alpha instance batch (capacity 48). The same applies to the separate breakdown-warning triangles pool. Struck flying cones retain a ground shadow.
- Existing static coverage unchanged: coastal guardrail bars/posts, concrete blocks, rocks on dry sand/in the water shader, tourists, umbrellas, benches, stalls, farm houses, village homes and streetlights, plus existing boat shadows. Some static clearance is approximate, so visually inspect against the real objects; a literal shadow for every background blade of grass is out of budget.
- In coastal mode, these new casts obey `sunshadow=0` for A/B. New work adds at most **three instanced draws** at full count (traffic, cones, warning triangles), and **zero offscreen shadow passes**.
- **No Netlify preview builds for development:** `netlify.toml` build-ignore permits only `production/main`. Netlify may still register a skipped build for PR updates; disable its Deploy Previews and branch deploys in Netlify site settings if the goal is absolutely no Netlify trigger. Test local `dev` using `npm run dev -- --host 0.0.0.0` and the PC's actual LAN IP on Pixel 8.

**Required QA:** local Pixel 8 coastal stage, inspect car on dark asphalt, moving cars/buses, cones and warning triangles, compare at matching route with `?sunshadow=0` if useful; confirm FPS and no missing road. Passing GitHub CI is not a Pixel 8 FPS result. Do not merge to `main` until owner approves.

---

## 2026-11-05 R9.1 Shadow Revision — Physical owner feedback

**Owner accepted:** sunset smoke visual, engine/pass sound balance, and perceived FPS (no new logging required for this round). **Owner did not accept previous shadows:** large shoreline rocks, left coastal guardrail/concrete blocks, umbrellas/visitors/shops had little/no visible shadow; car body had a cool/blue-looking underbody patch.

### Confirmed causes and code changes

1. The old `CoastDuskShadows` skipped all receivers below **-4.05m**, despite **`COAST_SEA_LEVEL=-5m`** and dry lower-beach surfaces between those elevations. This silently removed many actual umbrella/visitor shadows. New check uses the real sea level + small tolerance; water regions continue to use the ocean shader.
2. The old 1-quad horizontal projections could pass underneath sharply sloped beach terrain. Replaced with **ground-conforming projected shadow ribbons** using the same `coastBeachHeight`, `sample()`, `halfAt()` and current road surface equations. Each low-poly ribbon follows the sand height and rises onto the paved shoulder if a sunset shadow crosses it.
3. The original decorative shadow generator used `rand(n)` whereas `scenery.ts` places the umbrellas with `rand(n + seed)` (`seed=804` for the coast). New shadow anchors share the stage seed and same beach/visitor/market positions. Clearance can still omit some actual props, so this remains an *art-direction approximation*, not a real optical shadow map.
4. **Guardrails, streetlights and concrete barrier blocks** now cast directional shadows from the same **12m cadence, `coastBarrierStyle()` and physical offsets** as `coast-resort.ts`. Beach benches, tourists, umbrellas, shops/homes, farm houses and near-shore rock contacts receive appropriately sized projections.
5. Full route static polygons are prebuilt once into **one shared draw batch**; each frame only its geometry's **~950m behind to 1450m ahead** index range is submitted to the GPU. A separate existing low-cost player shadow is the other draw batch. No mobile directional shadow map is enabled, and no per-prop draw calls are added.
6. Water-rock `uRocks` shading adds a visible soft contact footprint as well as longer low-sun occlusion, inside the existing water fragment loop and without additional render targets. Underwater rock footprints aren't drawn as fake flat sand shadows.
7. The previously present under-car cyan-looking patch was **an existing canvas contact shadow, not an emissive light**. Kept the important grounding effect, changing only the coastal-dusk ink from green-teal to neutral warm charcoal. The longer separate car shadow remains.
8. Smoke still keeps the **accepted coast sunset `[.51,.48,.48]` tint**. New `setSceneSmoke(weights,sunsetCoast)` uses neutral coast, warm canyon, and cool city palettes elsewhere. The player and traffic collision tire smoke follow the current stage biome; offroad dust remains independently terrain-matched.

### Pixel 8 visual acceptance (no extra LOG requested)

Open the R9.1 draft PR preview, verify version `v0.9-coast-r9.1-exp`. Compare near umbrellas/visitors around first beach, low concrete blocks vs high rail sections, houses/shops, player shadow, and especially the large rocks by the water. Check for floating or duplicated shadows on unoccupied props; compare screenshots with the same route/camera conditions. Test a canyon/city section once to confirm no dusk-grey smoke tint leakage. The owner already accepted the existing R9.1 smoke/audio mix and reported no perceptible FPS drop, so FPS logging is not requested for these *shadow visual fixes*. If FPS visibly degrades below 30, `?fpsdiag=1` remains available with a release-review warning.

**Release:** all changes are on `dev`; do not merge R9.1 draft PR into `main` until the owner approves the revised shadow appearance.

---

## 1. Shadows — bounded mobile pipeline

- `src/coast-dusk-shadows.ts`: two transparent batches: one **dynamic projected player-car shadow** on asphalt and one **instanced authored beach-prop shadow batch**. Anchors use the existing coastal `COAST_BEACHES` umbrella generator, bench sites, village sites, farm homes and fixed rocks. Their elongated footprint direction is **away from `COAST_SUN`**, matching the visible sunset. No mobile directional shadow-map pass, no shadow-casting geometry per static prop. Beach shadow placement has an authored-position approximation: visually inspect for shadows without an actual prop, especially near patch clearances.
- `src/coast-ocean.ts`: **10 fixed shoreline rocks** cast shadow/attenuate highlights using the water's existing `uRocks` loop; no new water render target. Keep the existing shoreline and FFT water. Water's existing boat shadow map remains updated ~10Hz.
- `src/coast-boat-shadow.ts`: raise near water boat-caster budget **3 → 4**, in the *same* 512² phone shadow pass; increase submerged hull shadow contrast. Actual near/far boats will still differ due to distance selection and water attenuation. Measure `water.boatShadow.casters` and `updates`.
- **A/B:** `?fpsdiag=1&sunshadow=0` disables the **new projected coast shadows and water boat/rock shadows**. Compare with `?fpsdiag=1` on the same Pixel 8, matching orientation and distance. `fpsdiag` adds `extras.lighting.projected` for projected shadow batch count. This A/B also disables the preexisting boat shadows and therefore does **not** isolate the cost of only the new rock/shore shadow code; use it as a complete sun-shadow policy comparison.
- Desktop directional shadow map remains governed by original renderer settings; this change intentionally does not enable it for phones.

## 2. Tire smoke — same buffers, more believable dusk trail

- `src/tire-effects.ts`: fewer and more irregular radial puffs; deterministic per-particle turbulence phase and lateral perturbation instead of evenly repeated bright discs; shortened smoke life; tightened growth radius; darker warm sunset tint applied on the coast only; still **192 fixed particles, same two geometry batches**. Do not change collision/slip physics or tire marks.
- Player and traffic collision smoke are both sunset-tinted in the coastal stage. Dust continues using terrain-matched colors. Verify on high-slip fast turns and traffic deflections; look for reduced uniform white stripes, no severe flicker or repeated clumps.

## 3. Traffic pass / engine audio

- `src/pass-by.ts`: pass strength now scales with **measured `abs(d(relativeDistance)/dt)`**, attenuates small speed differences, max individual event peak `0.34` with total simultaneous pass mix budget `0.36`. Large trucks remain louder than cars at the same relative speed but cannot exceed the maximum cap.
- `src/sound.ts`: raised gas engine gain `0.22→0.35`, off-throttle `0.11→0.18`, shifting `0.15→0.23`; pass voices hard-capped, including two simultaneous crossings. No new voices. On headphones/phone speakers, ensure the engine stays clearly audible through traffic.
- New test ensures monotonic relative-speed gain and peak cap; old pass-direction/crossing behavior retained.

## 4. Honest FPS release gate and useful tests

- Removed four **known baseline-failing** historical test files on `dev`: `src/handling.test.ts`, `tests/v07d2-review.unit.ts`, `tests/v081-stage.unit.ts`, `tests/vertical-width.unit.ts`. Their original six failures were verified on the prior `main`; history remains in Git. No current gameplay assertions are loosened.
- CI `.github/workflows/r90-validate.yml` again runs **`npm ci` / `npm run build` / `npm test` across all remaining tests**, not a hidden exclusion list.
- `src/playtest-frame-gate.ts`: `?fpsdiag=1` exports `playtestGate`, counting seconds under **30 FPS**, frame gaps >50ms and >100ms; any sub-30 second or >100ms frame flags **`REVIEW_REQUIRED`**, 50ms-only spikes flag `WATCH`. The diagnostic HUD displays the review warning and the JSON retains bounded incidents with route metres. This is **device-only QA**, not a fake CI benchmark; the owner decides whether to publish.
- New tests for sunset shadow batching/direction, smoke variation and fixed geometry count, relative-speed audio mix, FPS release-review thresholds.

## Owner's physical acceptance test (required before `main`)

1. Local `dev`: `git pull --ff-only && npm run build && npm test`. Open the game on Pixel 8 with `?fpsdiag=1`; version must show **`v0.9-coast-r9.1-exp`**.
2. Visual QA at beach, rocks, sailing/fishing boats, and driver car: distinct, sensible **sunset-directed** shadows. Look for grounded feet/rock base and no giant shadow decals across roads/empty sand. Adjust placement/contrast if necessary.
3. Drive through corners with skid smoke and traffic events. Smoke should be gray at dusk, compact, irregular, not bright thick repeated circles; engine clearly audible over traffic, fast close passes stronger than slow overtakes but never dominate.
4. Export full `?fpsdiag=1` JSON after ~10km. Repeat matched route with `?fpsdiag=1&sunshadow=0`. Compare FPS by route region, frame-gap spikes, `extras.water.boatShadow.updates`, `extras.lighting` and scene CPU.
5. Treat `playtestGate.verdict=REVIEW_REQUIRED` as a **release hold for owner decision**; `WATCH` means investigate isolated long frames. Any missing road, broken sun-shadow orientation, or visible art regression also blocks release regardless of FPS.
6. Existing P0b-2 approved device baseline: entire 10.33km coastal journey, min one-second 35.49 FPS, zero below-30 seconds. R9.1 must not regress this gameplay experience.

**No automatic deployment:** Updating `dev` and passing desktop GitHub Actions is necessary, not sufficient. Wait for phone art/FPS owner acceptance before merging to `main`.


## R9.1 full-geometry sunset shadow experiment (truck screenshot at 0:38)

- **Default:** `?showcase=coast` activates Three.js directional shadow maps on mobile and desktop. The complete instanced car/bus/truck/waffle mesh (front cab, cargo, all wheels), roadster, road cones, warning triangles, shops, houses, beach umbrellas and visitors, resort rails/blocks, vegetation and streetlights cast their actual 3D silhouettes onto existing road/beach receivers. No rectangular projected decals are mixed on top.
- **A/B:** `?showcase=coast&shadow3d=0` restores old inexpensive author-projected shadows; `?showcase=coast&sunshadow=0` disables the sunset shadows. Water uses the existing specialized FFT boat/rock shadow shader and remains unchanged.
- **Quality first:** shadow map enlarged; postpone reducing casters or resolution until a physical Pixel 8 test shows visible FPS loss. Inspect the truck cab and wheels, moving traffic, cone silhouettes, roadster and scenery on slopes. Record `?fpsdiag=1` and observe FPS before tuning.
- **Release:** Test local `dev` on Pixel 8 over LAN. Do not deploy Netlify PR previews or merge into `main` before owner approval.


## R9.1 distant shadow visibility (Pixel 8 owner feedback)

**Issue:** On the ocean-facing road, buildings acquired their shadows only when approached; looking right, street lamps and hillside trees lacked shadows. Their 3D geometry was already a caster, but the old real-time shadow frustum was only **200m x 47m**, with a 500m depth window, tracked at the player's feet.

**Code:** A matched-direction pair of real geometry-casting lights now shares the original coastal sun brightness (0.65 near + 1.15 far = 1.8). The near pass retains crisp car/guardrail detail (600m x 270m), while a second 2800m x 800m pass follows 680m ahead of the driver and covers the visible right hillside, buildings, shore and long sunset shadows. Full depth range is expanded; no caster-distance spawn gate or replacement fake box shadows. Camera motion follows continuous sampled route positions, not abrupt tile steps. Ultra-Water's own water shader remains unchanged.

**Pixel 8 acceptance required:** Check right-side roadside lamps, isolated trees and houses from far distance through the approach; shadows should not vanish then appear suddenly. Check near rail/vehicle shadow detail, dusk brightness, the 10km road, and frame timing with `?fpsdiag=1`. Two depth passes are deliberately retained for visual integrity until device evidence justifies optimization. `?shadow3d=0` remains an old-shadow comparison. Do not deploy Netlify previews or merge `main`.


## R9.1 performance rescue — region-cached real static shadows

Following the Pixel 8 JSON (77/98 seconds under 30fps, minimum 17.46fps), shadow updates are restructured without returning to rectangle shadows:

- **Dynamic:** Real geometry for roadster, all four traffic models, waffle sign, moving cones and warning triangles. Dynamic-only layer 2, one moving shadow light. Pixel 8 near depth 2048² (formerly 3072²) with a player-local 440m shadow field.
- **Static:** Houses, umbrellas, trees, permanent lamps, roadside blocks and rails, rocks, scenery props and scarecrows retain their geometry casters in static-only layer 1. Their separate far depth map uses `LightShadow.autoUpdate=false` and 3072² on Pixel 8 (formerly 4096²). It updates only on a 240m route-cell boundary or completed/retired stream chunk, **not every frame**. The low sun's direction stays identical. Farm terrace/ground receives the result.
- **Foliage optimization:** Thousands of grass blades, rice/flower instances and animated canopy no longer submit geometry to the shadow caster pass. Tall scarecrows still cast. Field color/animation, ocean water shadows, sound, smoke and controls are untouched.
- **Honest scope:** This is a rolling, stream-invalidated static *shadow-map bake*, not a permanent atlas of per-chunk disk lightmaps. It preserves actual mesh silhouette at lower recurring cost. No static shadow map is recomputed during ordinary frames inside the same region.
- **FPS diagnostics:** `extras.lighting.staticCache` exports `policy`, `nearMapSize`, `farMapSize`, `staticRefreshRequests`, `staticRefreshStepM`, `lastStaticAnchorM`, `sceneRevision`, and `farAutoUpdate`. Compare the same ~10km route with the previous uploaded JSON. Monitor latency spikes on 240m boundaries and streaming chunk arrivals separately from steady-state FPS. If cache refreshing causes stutter, optimize its scheduling only after new device evidence.
- **Acceptance:** Pixel 8 visually check genuine car/truck cab/wheels, near and distant houses, right-hand trees and tall streetlights. Shadows must be present ahead of the player without abrupt near-camera pop; seek stable 50+fps. `main` is unchanged and PR #18 remains Draft. Netlify previews remain skipped; use local `dev` LAN entry only.


## R9.1 second perf pass and believable coastal pedestrian infrastructure

- Visual placement: sea-facing 1.3–1.9km and other active bays have long walkable low-bollard areas; isolated headlands like 2.4–3.6km keep continuous metal rails. Landward market/home districts get low stone near pedestrian frontages; crossings retain their protected gaps. Each side is planned independently; no 144m alternating template. Subtle deterministic stone variation, including precise alignment with fallback shadow anchors, keeps the shoreline natural without moving road collision constraints.
- Low-risk CPU savings: previously `refreshHints()` queried buttons and rewrote UI text every rendered frame. Mode changes still refresh immediately, with a once-per-60-frames fallback for newly mounted QA. Development-only per-mesh `onAfterRender` farm timestamp callbacks are now opt-in with `?qa=1`, `?streamdiag=1`, or `?farmdiag=1`; `?fpsdiag=1` no longer installs hundreds of per-frame probes.
- No reduction to shadow-map sizes, culling distances, ocean, farm density, tire smoke, sound, traffic, or driving physics in this pass. Pixel 8 visual + FPS verification required.
- Baseline FPS JSON 2026-11-05T14:08:44: mean 37.38, median 36.02, min 26.76 across 94 one-second buckets; 10 under 30fps, 79 long frames; mean mainScene 14.19ms, otherRender 6.39ms, physics 2.79ms. A device result is needed before claiming FPS gains.

 
## 2026-11-05 R9.1 — scenic HUD transparency experiment and Pixel 8 gate

Coastal stone bollards and remote metal rails have passed owner visual review. Keep their placement and geometry frozen.

Pixel 8 log `outrun-fps-2026-11-05T15-23-45.078Z.json` (71 one-second samples) regressed against `outrun-fps-2026-11-05T14-45-45.621Z.json` (84 samples) on the same dev revision: average 39.18 -> 32.89 FPS, median 37.04 -> 31.55, minimum 28.57 -> 22.88, below-30 buckets 1 -> 24, over-50ms long frames 10 -> 27, mainScene mean 13.85 -> 16.34ms. Distance-matched 3–4km saw approximately 295 vs 296 draw calls yet 39.6 -> 28.8 FPS. Sustained device-load / throttling is a plausible hypothesis but not confirmed: GPU timing and device thermal sensors were unavailable. **Mobile FPS gate remains REVIEW_REQUIRED.**

HUD-only experiment: strip the two opaque radial-gradient speedometer faces, keep dial rim/ticks/numerals/needle, make gear badge transparent; driving pause, steering slider, throttle/brake and the FPS status box use outlines and contrast-protected text with no fill at rest. Only a held touch/keyboard input triggers a muted translucent tint; steer clears on pointer up/cancel/lost capture, keyboard up, reset and blur. The optional FPS JSON diagnostics panel also becomes transparent. Paused and settings menu panels deliberately retain reading surfaces. This experiment does **not** change scene density, shaders, shadow maps, water or gameplay mechanics.

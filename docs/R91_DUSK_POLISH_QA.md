# R9.1 Coastal Dusk Polish — CODED ON `dev`, VISUAL / PHONE QA REQUIRED

**Owner request (2026-11-05):** Implement, not merely illustrate, shadows for the player's car, beach props and ocean objects; improve sunset tire smoke; make passing traffic quieter than the player's engine, scaling with relative speed; retire tests that were already broken in the published baseline; catch visible <30 FPS regressions before closed-test publication.

**Scope:** `dev` only, version `v0.9-coast-r9.1-exp`. Existing `main` R9.0 remains the family-playtest build. Changes are not claimed as Pixel 8 accepted until physical drive and comparison.

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

- `src/pass-by.ts`: pass strength now scales with **measured `abs(d(relativeDistance)/dt)`**, attenuates small speed differences, max event peak `0.46`. Large trucks remain louder than cars at the same relative speed but cannot exceed the maximum cap.
- `src/sound.ts`: raised gas engine gain `0.22→0.31`, off-throttle `0.11→0.16`, shifting `0.15→0.20`; pass voices hard-capped, including two simultaneous crossings. No new voices. On headphones/phone speakers, ensure the engine stays clearly audible through traffic.
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

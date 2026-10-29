# Grounded Driving — Seed 1 canyon review

Starting commit: `2a1fb4f499a04dadefbd932225458e720bef13e8`. Dev only. Await Michael's physical Pixel 8 playtest and Julia's visual review.

## Changes

- Replaced almost invisible 64x64 asphalt grain with one deterministic 256x512 canvas texture: fine aggregate, broad color/wear variation, irregular darker resurfacing patches and occasional thin repair seams. Existing UVs repeat it over roughly 14x64 road units. The shared asphalt material is reused across the trip; no road-type system, additional road geometry, collision change, lane-marking change or external texture pack.
- Added rear-wheel smoke from the existing wheel-ray intersection points and normals. Requires `drifting`, slip > 0.5, speed > 12 m/s, an asphalt hit and a wheel gap within 0.12m. Opacity responds to slip/speed; puffs inherit some contact movement, rise, expand and fade over 0.95 seconds. Pool limit 48, one Points draw, soft radial sprite, capped 64-pixel footprint, no depth writes.
- Added two 0.32m tire trails after 0.12 seconds of meaningful slip. Endpoints follow real surface contacts and normals, lifted 0.014m with polygon offset. Gaps/large jumps break connections. 384 segments in one preallocated geometry, fading out by 7 seconds. No per-frame geometry allocation or new wheel raycasts.
- Effects use two fixed geometries. Idle effects are not drawn, and active smoke plus marks cost at most two draw calls. Replay clears both pools; route navigation replaces the scene. Unit tests exercise disposal and ten simulated minutes of continuous drift without geometry growth.
- Kept handling, road geometry, Trip Codes, streaming, controls, HUD, PWA cache behavior and chase-camera settings unchanged. Existing wheel/effect CPU work is included in the diagnostic contact timing; this is CPU time, not GPU time.

## Matched gameplay comparisons

These are rendered gameplay captures, not concept art. Both use the committed baseline vs working changes, Seed 1, 915x412 touch viewport, 65m/s starting speed and identical scripted steering. Route position and speed match exactly. The static views use identical cameras; moving corner captures can differ by a few centimeters from animation-frame sampling of the unchanged camera smoothing.

| Scenario | Before | After |
| --- | --- | --- |
| High-speed road surface, distance 2750 | [Before](evidence/grounded-driving/comparison/before/normal.png) | [After](evidence/grounded-driving/comparison/after/normal.png) |
| Strong corner, starting distance 4230 | [Before](evidence/grounded-driving/comparison/before/corner.png) | [Smoke](evidence/grounded-driving/comparison/after/corner.png) |
| Sustained slip, same corner | [Before](evidence/grounded-driving/comparison/before/drift.png) | [Two tire trails](evidence/grounded-driving/comparison/after/drift.png) |
| Uphill, distance 4950 | [Before](evidence/grounded-driving/comparison/before/uphill.png) | [After](evidence/grounded-driving/comparison/after/uphill.png) |
| Main crest, distance 5790 | [Before](evidence/grounded-driving/comparison/before/crest.png) | [After](evidence/grounded-driving/comparison/after/crest.png) |
| Downhill, distance 5990 | [Before](evidence/grounded-driving/comparison/before/downhill.png) | [After](evidence/grounded-driving/comparison/after/downhill.png) |

[12-second actual gameplay recording](evidence/grounded-driving/grounded-driving.mp4). Recorded from a real-time browser run with scripted controls, including smoke, marks and return of grip. The footage is not slowed down. The fullscreen notice comes from disabling fullscreen in the harness to preserve the viewport; perf overlays are development-only.

## Camera / contact findings

The representative grades are +0.469 uphill, 0 at the crest and -0.468 downhill. Wheel-contact diagnostics remain effectively zero at the captured road points and throughout the recorded canyon drive (floating-point rounding around 1e-13m). No new sinking, floating or abnormal camera behavior was identified in these samples. No camera or vehicle-height correction was necessary. This is limited to the tested route and samples, not a guarantee for every possible off-road pose.

## Validation and performance

- Production build passes; the existing bundle-size advisory remains.
- 41 unit files / 102 tests pass, including activation/contact guards, grip-return expiry, pool saturation over ten simulated minutes, reset and disposal.
- 13 relevant browser tests pass: comparisons, real-time driving/cleanup, perf probe, near-first startup, production PWA/diagnostic behavior, high-speed chunk crossings in all three worlds, worker determinism, physics step consistency, public HUD / swapped controls / countdown / QA. Final focused visual and cleanup checks rerun after allocation cleanup.
- Browser recording drive: 15 seconds, 915x412, touch, DPR 2.625, desktop Edge, 4x main-thread CPU slowdown, recording enabled. Streaming stayed ready, smoke/marks stayed bounded, and both expired after grip returned. Replay and Seed 2 reload cleared them.
- Static probe: all three representative samples remain about 60 FPS before/after; draw calls unchanged at 112 / 176 / 185. Render CPU before 2.47 / 3.84 / 4.35ms, after 2.13 / 3.08 / 3.66ms. Differences are single-run noise, not a claim of a performance improvement.
- Live canyon recording measured approximately 58–60 FPS. See [live samples](evidence/grounded-driving/driving.json), [before probe](evidence/grounded-driving/performance-before.json), [after probe](evidence/grounded-driving/performance-after.json) and [comparison/contact data](evidence/grounded-driving/comparison/after/comparison.json).
- Historical evidence archives are preserved; refreshed regression captures are under this milestone's `regressions/` directory.

All measurements are browser emulation on a desktop GPU, not physical Pixel 8 acceptance. No main merge or deployment. Stop here for Michael and Julia.

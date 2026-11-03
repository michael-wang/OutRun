# Azure Coast — Ultra-Water FFT experiment

**URL:** `http://localhost:5173/?showcase=coast`

**A/B control:** `http://localhost:5173/?showcase=coast&water=basic`
keeps the *same* procedural 3.35km course but uses the original flat sea.
The coast branch is isolated; city, canyon and normal 10-minute play are unchanged.

## Scope

- New authored procedural TripCandidate: four wide sweeping/compound bends,
  one gentle long climb, coastal-left environment, no Blender dependency.
- The original MIT-licensed Ultra-Water OceanSim and fullscreen helper are
  imported in `src/ultra-water/` with upstream LICENSE and notices.
- `src/coast-ocean.ts` is an explicitly simplified road-game renderer using
  the **real FFT displacement/slope textures**, camera-centred radial grid,
  GGX-inspired solar glints, Fresnel, whitecaps and atmospheric distance fade.
- **Not** the full upstream OceanSurface: no shoreline travel-time solver,
  overturning breakers, SSR/planar reflection, scene refraction, underwater
  caustics, floating props or dedicated post-FX pipeline in this first trial.
  Do not compare it with the full upstream gallery expecting 1:1 fidelity.
- Default mobile mesh: 128 angular segments, FFT at 30Hz; desktop: 192
  segments, FFT each frame. The scene itself remains displayed at normal rate.

## What to try on the real Pixel 8

1. Pull latest `dev` locally, `npm run dev`, open `?showcase=coast`.
2. Play for a complete lap, watch sea highlights, horizon and shoreline.
3. Repeat with `&water=basic` on the same device.
4. Compare perceived water quality, steady FPS, frame hitching and
   thermal behavior. If the FFT is not worth the visual/CPU/GPU cost,
   abandon this integration without modifying the existing main game.

## 2026-11-04 beach repair

The previous narrow edge dropped directly to a -11m seabed, while undamped FFT
waves covered a camera-centred plane on both sides of the road. This erased the
beach and exposed water through low inland ground.

The existing asphalt, centreline, grades, banking and handling are unchanged.
The coast-only cross-section now includes dry sand, darker wet sand and a sloping
seabed. Mean shoreline is 19m outside the asphalt. A static world-space shore
mask, baked once from the existing road, supplies the same sand height to the
water shader. It excludes dry land, damps FFT displacement in shallow water and
adds small shore-facing waves/foam. This is our lightweight adapter, not the
upstream demo's full beach renderer. Upstream OceanSim remains unchanged.

Local desktop Chrome: complete 3.35km drive, 34.7s recording, original physics
with automatic control inputs and normal chase view. Ultra-Water confirmed
active, no console/shader errors or road streaming stalls; warmed FPS about 60.
No physical Pixel 8 result. Coast mask/clearance and mesh seam regressions pass.
Screenshots, source-video samples, recording and telemetry are ignored under
`art-prototype/output/coast-beach-fix/`. Foam is still more regular and shallow
water shading simpler than the full Ultra-Water gallery.

## 2026-11-04 beach life / R2

The same driven road now passes three broad sandy coves with narrower, scalloped
rock shores between them. The beach mesh, prop foundations and water mask share
one fixed coast layout. The inner dry shoulder and asphalt are unchanged.
Umbrellas, reclining chairs, towels, beach balls, three small kiosks and posed
beachgoers use the existing instanced scenery/Worker pipeline. Mixed palms,
broadleaf trees and coastal pines form uneven groves with gaps.

The FFT adapter adds shallow turquoise absorption, an analytic light pattern,
fragmented crest/foam trails and ten shared rock footprints with wash and a
single 320-point spray batch. These are stylized visual approximations: no
physical rock/wave interaction, overturning breakers, true refracted caustics or
animated beachgoers. It does not reproduce the reference demo's full fidelity.

Desktop Chrome, 1920x1080: 34.67s full drive using automatic inputs, original
physics and chase camera. Warmed FPS 59.99-60.00, local readiness ~1.55s; zero
missing road frames, unsafe streaming frames, stalls or console/shader errors.
Basic-water fallback also loaded without errors. Build and 11 focused tests
passed; no CI or physical Pixel 8 testing. Captures and telemetry remain local
under `art-prototype/output/coast-beach-life/`.

## 2026-11-04 dusk neighbourhoods / R3

The coastal trial now uses a fixed golden-hour sky and matching water reflection,
low warm sunlight and cool ambient fill. Two residential stretches alternate
with two dense night-market strips and open beach/green sections. Balconies,
selected lit windows, counters, cooking pots, lanterns, menu panels, bulb strings
and posed crowds give the inland side distinct neighbourhoods. No road geometry,
handling, camera or non-coastal lighting changes.

Emissive scenery properties survive the existing Worker/instance transfer.
Streetlight fixtures extend toward the road; only the four nearest point lights
illuminate geometry, with no extra shadow maps or bloom pipeline. The sky and
water share one world-space sun direction. This remains stylized art: crowds are
static, shops have simplified signs/interiors and there is no day/night cycle.

Desktop Chrome 1920x1080 full 34.67s drive with automatic inputs and original
physics/chase camera: warmed FPS 59.99-60.00, local readiness ~1.98s, no missing
road frames, unsafe streaming frames, stalls or browser/shader errors. Basic
water fallback also loads. Build and 22 relevant tests pass; no CI or physical
Pixel 8 testing. Local screenshots/video/telemetry: `art-prototype/output/coast-dusk/`.

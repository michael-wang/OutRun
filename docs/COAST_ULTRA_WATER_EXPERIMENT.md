# Azure Coast — Ultra-Water FFT experiment

**URL:** `http://localhost:5173/?showcase=coast`

**A/B control:** `http://localhost:5173/?showcase=coast&water=basic`
keeps the *same* authored 10km course but uses the original flat sea.
The coast branch is isolated; city, canyon and normal 10-minute play are unchanged.

## Scope

- Authored coastal TripCandidate: broad sweeping bends and a gentle S bend,
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

## 2026-11-04 always-lit neighbourhood polish / R4

Removed the four moving/proximity-selected PointLights. All 52 street fixtures
are now permanent instanced art with 11.5m slender poles, short arms, emissive
heads and small halos. Fixed additive ground pools follow the road/sand surface;
they stay on regardless of car distance (ordinary distance haze still applies).
These are inexpensive static lighting approximations, not dynamic illumination
of passing cars. No lights switch on as the car approaches.

Homes mix four height/roof families, varied setbacks, slight rotations and gaps.
Window occupancy varies by household and room, including fully dark houses and
several window colour temperatures. Night-market counters now distinguish hot
food, drinks, produce and clothing, with roof/stock silhouettes and irregular
spacing/setbacks. Bulb strings span the changed gaps. Beach kiosks gain three
warm pendant lamps and illuminated signs. Driving geometry/handling unchanged.

Full desktop Chrome 1080p drive: about 60 FPS after warmup, ~1.68s local readiness,
no missing road/unsafe streaming frames, stalls or browser errors. Build and 22
relevant tests pass. No CI or physical phone testing. Reference-video samples,
new screenshots, telemetry and recording remain ignored in
`art-prototype/output/coast-dusk-r4/`.

## 2026-11-04 sunset journey / R5

Extended this isolated coast trial from 3.35km to 10km using the existing road
composer and streaming path. Four lanes, handling and normal chase camera are
unchanged. Scene timing now alternates a populated left beach (around 1.22km),
right-side homes (2.21-3.70km), quiet shoreline/hills, a broad approach and left
turn, then the main beach/market (7.58-8.71km) and a calm exit. Distances here are
from the playable start; the coast-layout constants include the 350m lead-in.

The postcard is authored through road direction. The reveal turn finishes at
about -0.47 radians, putting the existing fixed world-space sun about 14 degrees
left of the car's forward view. The broad left bay and right market share this
view for several seconds. Neither the camera nor the sun rotates to manufacture
the shot. The complete drive's postcard capture occurs around 83 seconds.

The longer coastline retains metre-scale mask texels. Exact nearest-segment
search now rejects segments using a sorted per-row distance lower bound. A
one-off full-mask comparison found zero differences across 11,053,440 channel
values; bake time fell from about 4.49s to 1.30s on this desktop. No new runtime
terrain or scenery framework was introduced.

Desktop Chrome 1920x1080: complete recorded drive 109.87s (game elapsed 109.78s),
warmed FPS 59.99-60.01, zero missing road frames, unsafe stream frames, stalls,
off-road samples or console/shader errors. Normal physics and chase camera with
automatic control inputs; the simple controller incurred eight traffic impacts,
so this is not a clean human speed run or a guarantee of every player's duration.
The video is canvas-only and silent. Optimized local readiness 2.35s with Ultra
water, 0.52s with the basic fallback; both loaded without errors. The complete
drive preceded the pixel-identical mask optimization; final loading and postcard
captures were repeated afterwards. No physical Pixel 8 test or CI.

Build and 22 relevant tests pass. All previews, drive screenshots, recording,
telemetry and mask comparison remain ignored in
`art-prototype/output/coast-journey/`. Existing visual limits remain: low-poly
buildings/hills, static beachgoers and stylized shore foam. This milestone changes
composition and pacing rather than upgrading the art asset fidelity.

## 2026-11-04 responsive startup feedback

Initial HTML now contains an artwork-backed, portrait/landscape loading surface
above the game and rotation prompt, including animated activity, Traditional
Chinese stage descriptions and an accessible progress bar. It reuses the approved
splash pictures, with a gradient fallback while the image itself downloads.
Progress is weighted preparation milestones, not estimated time or download bytes:
module availability, route/world setup, completed shoreline rows and ready nearby
road/scenery chunks. 100% requires a rendered frame and the existing safe-nearby
readiness gate. The rest of the route continues streaming normally.

The coastal mask uses the same exact computation in short batches with browser
yields. A regression checks event-loop yielding, monotonic progress and equality
of every mask channel against the synchronous result. Controls, track and water
geometry are unchanged. Slow preparation gets a notice after 15s and a reload
option after 45s; failed initialization or road preparation gets an explicit error.

Build and 21 relevant unit tests pass. Local Chrome checks cover development and
production, portrait/landscape, coast and default trip, blocked module download,
retry recovery and Play. At 4x CPU slowdown the real coast calculation continued
producing animation frames and progress updates. This is desktop mobile emulation,
not a physical Pixel 8 measurement. Local captures and a loading preview are in
`art-prototype/output/mobile-loading/`; no media is committed and no CI was run.

## 2026-11-04 remove phone-side coast baking

The reported 48-78% wait was the full coastline mask, not road streaming or an
Ultra-Water engine replacement. The short R4 stage used 786x1024 texels and 215
sampled road segments; the long stage uses 855x3232 texels and 548 segments.
The denser full-route preparation was incorrectly left on every player's device.
The prior responsive batches improved feedback but did not remove that cost.

The fixed coast mask is now baked on the developer machine by `npm run coast:shore`,
automatically invoked before `npm run dev` and `npm run build`. A lossless
channel-delta/gzip asset is 1,300,739 bytes (1.24 MiB), rather than the raw 22.1 MB.
Phones download and decode it; they do not bake coast geometry. Every channel and
all bounds match the previous mask. A route/layout key rejects stale data.
Missing or invalid assets use the existing basic-water fallback, never a surprise
phone-side bake. The generated `public/generated/coast-shore.shore` is ignored by
Git and copied into dist by the normal build. When editing the fixed route or
shore code during a running dev session, rerun `npm run coast:shore`.

Comparable local desktop Chrome mobile viewport with 4x CPU slowdown:
coast phase 12.77s before -> 0.33s after; total startup 14.45s -> 2.04s.
Built-version local cold start 1.68s and repeat load 1.17s. These are local-network
emulation measurements, not physical Pixel 8 results or internet download promises.
Ultra mode confirmed in development; the sunset bay screenshot remains intact.
Build and 21 relevant tests pass, including lossless decode and rejection of stale
or truncated data. Missing-asset fallback was checked in Chrome. Evidence stays
local in `art-prototype/output/loading-performance/`. No CI or main changes.

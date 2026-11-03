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
- **Not** the full upstream OceanSurface: no shoreline travel-time maps,
  nearshore breaking rollers, SSR/planar reflection, scene refraction, underwater
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

This commit is intentionally an **unvalidated prototype** (no local
runtime/GPU available to the assistant), not a performance certification.

# R4 — scene capability refactor handoff

Status: **implementation ready for R4d owner acceptance**, not yet
approved for minor release. Development build: `v0.9.46`.

## Finished scope

- R3: one finite, authored coastal road and static scene; retired
  random road planners removed.
- R4a: `effects.json` contains stage-owned accepted ocean, vegetation
  and flower budgets, with validation before streamed content.
- R4b: same boundary for dusk sun/hemisphere/fog and limited shadow
  presets; mobile-fast keeps costly 3D depth maps disabled.
- R4c: same authored breeze for rice, flower and injectable CPU
  airborne effects. Ocean FFT wave forcing remains separate.
- R4d: large, visible wind bands in existing field Shader passes;
  different, lighter startup smoke per car without extra geometry.

## Explicit deferrals, not missing framework abstractions

1. No region-level vector-field editor, real-weather ingestion, or
   parcel-dependent wind vector map until another playable stage
   demonstrates a real visual need.
2. No FFT-based rice physics or duplicated render target atlas: use
   phase-layered vegetation sway and shading for player readability.
3. No overhaul of independent short exhaust puffs or breakdown smoke
   unless an acceptance screenshot proves those are visibly wrong.
4. No blind deletion of shadow-fallback code still shared by mobile
   streamed contact footprints. See the shadow audit.
5. P2 startup stutter stays in its own issue; no startup pipeline
   rewrite inside R4.

## Verification gates

- Locally run `npm run verify:dev` (production build + retained tests)
  before promoting; Github `dev` no longer builds on every push.
- Human acceptance: PC and Pixel 8 coast start and driving. Check
  start-grid smoke individuality, 0–100 km/h response, 200–300 km/h
  field-wave readability, sunset/water parity, and no phone FPS loss.
- Release: after owner acceptance, bump **development** version to
  `0.10.0`. Public `main` and immutable tag require separate
  explicit owner approval.

## Guiding rule

The environment provides a bounded field; each scenic or airborne
consumer owns the response. Gameplay steering and AI are never
accidentally affected by cosmetic wind.

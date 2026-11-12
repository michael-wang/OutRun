# R4 — scene capability refactor handoff

Status: **R4 owner acceptance confirmed 2026-11-12**. Development
version now `v0.10.0` on `dev`, not tagged/released on `main`.
The R4c signed-zero test reported at 437/438 passing has been corrected;
full local verification remains outstanding after that fix.

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
- Development milestone `0.10.0` has been applied after owner acceptance.
  Public `main` and immutable tag require separate explicit owner approval.

## Guiding rule

The environment provides a bounded field; each scenic or airborne
consumer owns the response. Gameplay steering and AI are never
accidentally affected by cosmetic wind.

## R4e note — final smoke art polish

`v0.9.47` refines the starting-grid smoke: visible puff silhouettes
instead of broad translucent discs; warmer/cooler grey variation from
stable per-rival seeds; local eddies on top of the same prevailing wind.
Particle capacity, road marks, collision rules and rendering passes do
not increase. These are *implementation* claims; real visual and
Pixel 8 FPS acceptance remains outstanding.

Future material-specific friction, sparks, grass fragments and uneven
road surfaces are NOT a missing R4 feature. They are captured in
`docs/NEXT_SURFACE_CONTACT.md` and will be implemented against real
track content after the architecture milestone.
 
## Accepted — 2026-11-12 (owner)

R4 visual and gameplay acceptance passed on `0.9.47`.
One benign `-0` versus `+0` deep-equality test was outstanding;
`0.10.0` canonicalises calm wind components and adds a regression
assertion. Build + retained unit tests must still pass locally before
the milestone is considered technically verified.

Owner reported a midground/foreground mountain motion-parallax
discrepancy near the later coast highway. Because map remake is next,
the existing mountain geometry stays intact; the new map must
validate *relative motion through the chase camera* before art lock.

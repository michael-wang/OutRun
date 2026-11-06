# R9.1 Rural Coast — Concrete Access, Road Safety, Ocean-Fed Canal

**Date:** 2026-11-07  
**Branch:** `dev` only. `main` is the owner-accepted R9.0 version.  
**Screen version:** `v0.9-coast-r9.1-rural`  
**Status:** implementation + CI build/unit checks complete; real-device visual/FPS QA pending.

## Changes implemented

- Removed the large dark land-side boulder "guardrails" in all former rocky pockets.
  Sparse short two-rail metal installations protect selected remote stretches;
  popular beach sections retain individual low concrete bollards. Other
  stretches remain visually open with no repetitive artificial barriers.
- Added a true two-sided paved-road collision envelope through
  `coastDriveBounds` and `world.boundaries`. A car cannot drive into the sea-side
  sand or the irrigation canal. Where individual concrete bollards exist,
  `CoastStoneContact` remains the frontmost impact and the invisible fallback
  lies farther out. The new boundaries apply only to the coast stage.
- Shifted utility poles from x≈19m to approximately x≈13.2m, directly behind
  the far canal lip (x=12.62m); every pole has a road-facing warm streetlight.
  Keep uneven parcel intervals and the existing three-wire sag.
- Added 28 short concrete access crossings near cultivated fields and homes
  in the open irrigation-drain stretches. Water remains underneath these
  crossings, unlike the permanently covered town culverts.
- Replaced simplified flat turquoise canal water with a shader reusing the
  already-running Ultra-Water ocean's **four live FFT slope textures** and
  shared dusk sky reflection; added a narrow-channel upstream current.
  No second ocean simulator or independent offscreen FFT target is created.
- No changes to handling torque, road geometry/camera, crop canopy, city or
  canyon stages; no public deploy and no Netlify test preview.

## Owner's local visual / driving checks

Run the local `dev` server and use only the supported `at`, `fpsdiag`,
`startupdiag` query arguments:

- `?at=500`: sparse metal guardrail, no large dark ocean-side boulders;
  guardrail contact before leaving the paved edge.
- `?at=850`: rice scenery, small concrete driveways, canal with obvious
  moving sunset-colored water; utility poles very close to the far canal
  bank, all with lit fixtures. Try steering both left and right off road.
- `?at=2450`: beach visitors and low individually collidable bollards.
- `?at=3990`: covered town drain and open seaward view.
- `?at=8550`: remote fishing countryside, open canal and no unnecessary
  metal rails. Try driving toward the sea: the car stays on blacktop.

**Physical Pixel 8 gate:** `?fpsdiag=1&at=850`, then matched runs at
`at=2450` and `at=8550`. The artist-approved scenic result and any FPS
regression must be confirmed on device. A CI pass is not proof of a measured
Pixel 8 FPS pass. Prioritize the requested water look, but do not promote to
`main` before owner acceptance.

## Verification

GitHub CI on `dev`: TypeScript + Vite production build, maintained unit
suite, including road-contact, canal, bridge, barrier, and coastal art tests.
This document does not imply browser gameplay or phone rendering was measured.

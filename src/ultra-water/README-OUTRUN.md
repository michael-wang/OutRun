Ultra-Water (Humpalumps): https://github.com/Humpalumps/Ultra-Water
Source license: MIT, upstream copyright (c) 2026 Humpalumps.

The FFT simulation and its fullscreen pass originate from upstream master
on 2026-11-04. See LICENSE and THIRD_PARTY_NOTICES.md. OutRun now adds optional
128/256 FFT resolution and anisotropy settings to OceanSim; desktop defaults,
spectrum equations, four wavelength cascades and FFT math are preserved.
The road-facing rendering adapter is our own deliberately smaller mobile-friendly
prototype: it does NOT reproduce the project's full shore, reflection,
refraction, underwater or postprocessing pipeline.

R8.4 additionally adapts `src/scene/floaterShadow.js` from upstream commit
`6f5a96d6d177f3b4962a044b38477bd58bc2c6f8` in `src/coast-boat-shadow.ts`.
The separate orthographic floater depth map and hardware comparison sampling are
retained, bounded to three nearby boats at 10 Hz (512 px mobile / 1024 desktop).
OutRun's water adapter receives it; the FFT/vendor core remains unchanged.
Copyright (c) 2026 Humpalumps, MIT; see the accompanying LICENSE.

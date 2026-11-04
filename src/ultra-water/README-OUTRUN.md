Ultra-Water (Humpalumps): https://github.com/Humpalumps/Ultra-Water
Source license: MIT, upstream copyright (c) 2026 Humpalumps.

The FFT simulation and its fullscreen pass originate from upstream master
on 2026-11-04. See LICENSE and THIRD_PARTY_NOTICES.md. OutRun now adds optional
128/256 FFT resolution and anisotropy settings to OceanSim; desktop defaults,
spectrum equations, four wavelength cascades and FFT math are preserved.
The road-facing rendering adapter is our own deliberately smaller mobile-friendly
prototype: it does NOT reproduce the project's full shore, reflection,
refraction, underwater or postprocessing pipeline.

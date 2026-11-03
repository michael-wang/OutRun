# Default three-scene journey — 2026-11-04

Open `/` and press Play. The default game now runs these existing scenes in order:

1. Daytime Urban Jungle: the first fully urban phase of Seed 1 / r10, distances
   11688–23771 in the original road's coordinates.
2. Sunset coast: the entire accepted 10 km R6 coastal route, including beaches,
   lit homes, traffic lamps, markets and the sunset postcard finale.
3. Dawn canyon: the complete Cliff Pass R4 route and its existing local Blender
   artwork, with a cool morning sky, warm low sun and morning haze.

These are chapter transitions with a brief fade and time-of-day title, **not a
continuous geographic mesh joining three unrelated maps**. They happen without
navigation, URL changes or another Play button. Input, audio, fullscreen and the
renderer persist. Camera and controls remain the existing driving model. A short
ready countdown follows each transition; hidden/portrait pages stay paused.
Restart/replay begins the entire journey again. The timer accumulates driving
time across all three scenes.

The next coast module/mask and canyon download are prefetched during driving.
The outgoing scene remains available until incoming artwork and nearby road are
ready. Failures show an animated status and retry button rather than discarding
the current chapter. Workers, geometries, textures, lights and FFT render targets
are released when leaving; retired road-sign textures are included in cleanup.

The canyon still requires the existing ignored local artifact:
`art-prototype/output/cliff-pass-r4/canyon_cliff_pass_r4.glb`.
Vite dev and local preview serve it via `/__local_art/`; a static build alone does
not package that GLB. No public deployment or main promotion was performed.
Historical explicit routes remain available for development, but are not needed
to play the new default journey. Existing saved reviews are preserved; chapter
feedback and telemetry use their current source scene identities.

Validation:

- Full desktop Chrome 1920x1080 automated drive, normal physics/chase camera:
  323.63 seconds of driving; all three chapters finished. No page/console errors,
  missing road/camera chunks or unsafe streaming samples. Each chapter's FPS
  median was 60 during whole-page video recording.
- Full-drive transitions: 1.61s city → coast, 1.24s coast → canyon, plus the ready
  countdown. The time ellipses are visible in the recording.
- Touch landscape Chrome emulation, 4x CPU slowdown: initial load 1.96s;
  transitions 1.95s / 1.45s. Pause/replay returns to the city. This is **not a
  physical Pixel 8 measurement**.
- Blocked canyon download: stayed on the coast, displayed retry, then successfully
  entered the canyon after connectivity was restored.
- Two further transition/replay cycles: city textures remained 7, coast 28,
  canyon 4. Geometry counts stabilized after the one shared FFT fullscreen mesh
  was initialized. No accumulating per-cycle GPU resources were observed.
- Build and 24 focused unit tests passed; no CI was run.
- Production preview at the bare URL: touch Play and Pause passed without browser
  errors; initial preparation took 1.10s in desktop Chrome mobile emulation.

Video, chase screenshots and diagnostic records are local and ignored under
`art-prototype/output/three-scene-journey/`. The existing low-poly city and canyon
art limitations remain; this milestone joins playable scenes rather than
remodeling their art.

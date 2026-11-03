# Default continuous coastal journey — 2026-11-04

Open the bare `/` URL: sunset coast → daytime Urban Jungle → dawn canyon.
The accepted scenic routes retain their native geometry. Two new four-lane
highways connect their endpoints; controls, gear, speed and the chase camera
continue through the joins. There is no chapter card, blackout or countdown.

Each connector has a 6.5 m outward-sloping retaining wall, a setback verge,
low guardrails and slim lamps. This replaces the rejected 26 m vertical walls
and leaves a broad sky visible. The sky, sun direction, fog and illumination
blend during driving. Native scenery dissolves behind the walls before the
coordinate rebase and emerges gradually on the far side.

The middle of each connector is identical in both scenes. A rigid coordinate
rebase preserves road-relative vehicle state and camera heading. It does not
rescale or reposition Blender artwork to disguise a road mismatch. Static
pavement, stripe, wall, texture and lamp repetition agree at the rebase.

Preparation starts 4.5 km before the scenic endpoint. The existing road worker
prepares the next road; models, shaders and GPU buffers are prepared in the
background. GPU uploads are spread across animation frames. Numeric road
tracks and immutable asphalt pixels are cached during startup. Scene-owned
textures and outgoing worker/GPU allocations are still disposed independently.
The same player car is carried forward rather than rebuilt for each scene.

Normal connections remain drivable while loading. An unusually slow/failed
asset request retries while the car traverses the longer reserved highway;
if that reserve is exhausted, the existing safety hold keeps the car on valid
road until preparation succeeds. This is a finite loading reserve, not a claim
of uninterrupted driving when the server or GLB is unavailable.

Production artwork delivery (2026-11-04 release correction):

`src/runtime-art.json` pins the approved Canyon R4 GLB by release URL, byte size
and SHA-256. `npm run build` and `npm run dev` prepare the asset automatically:
reuse a verified generated/local file or download the public GitHub Release
attachment. A missing/corrupt download fails the build. No GitHub token is needed
on Netlify. Large GLB and editable Blender files remain outside Git history.

The resulting `public/generated/canyon-cliff-pass-r4-594e48389270.glb` is copied
into `dist` and served on the same origin as the game. Its versioned URL permits
immutable caching. The default three-scene journey no longer requests local-only
Vite middleware. `netlify.toml` sets `npm run build`, `dist` and Node 22.

Release attachment: https://github.com/michael-wang/OutRun/releases/tag/art-assets-canyon-r4-v1

The editable source remains at
`art-prototype/output/cliff-pass-r4/canyon_cliff_pass_r4.glb`. The historical
Blender v2 diagnostic entry still uses local-only artwork and is not the default
published route. No GitHub Actions workflow was run for this correction.

Deployment checks: a clean source copy with no local Blender output downloaded
the public attachment and built successfully. A plain static server serving only
that `dist` launched the coast and rendered/drived Canyon R4 with HTTP 200 for the
GLB, no page errors and no development hooks. A corrupt cache/local/download
fixture failed with the expected SHA-256 mismatch instead of producing a build.
Local evidence: `art-prototype/output/netlify-release/`.

Current validation and captures are under the ignored local folder
`art-prototype/output/seamless-journey/`. Physical Pixel 8 performance is not
measured; mobile results refer to Chrome touch emulation with 4x CPU slowdown.

Validation on 2026-11-04:

- Bare-URL desktop drive: 357.32 seconds, normal physics and chase camera,
  automated throttle/brake/steering, no distance jumps during the recorded run.
  Finished all three scenes; no page errors, missing-road frames, unsafe-road
  frames or off-road samples. Startup was 1.67 seconds on this desktop.
- Handoffs took 12.3 / 10.8 ms, preserving speed exactly and camera heading
  relative to the road. Median / p99 animation-frame intervals were 16.7 /
  16.8 ms. Two scenery-emergence frames still took 133 / 183 ms; this is not a
  claim of hitch-free performance on every device. The former 600 ms background
  upload spike was absent after distributing GPU preparation across frames.
- An artificially delayed canyon request (18 seconds) exercised the longer
  highway reserve and successfully joined at unchanged speed. Destination sky
  is configured from fixed road data before loading, so download completion
  cannot suddenly move the sun. The two initial holds in that targeted test
  followed its deliberate diagnostic distance jump, not continuous driving.
- `npm run build` and focused journey, connector, disposal, camera-depth and
  stream tests passed. No CI was run. Browser recordings/screenshots are local
  validation artifacts, not physical Pixel 8 measurements.
- Final touch-emulation check (844 x 390, 4x CPU): startup 2.40 seconds,
  both joins and replay passed without page errors; joins took 40.7 / 21.5 ms.
  Median / p99 frame intervals were 16.7 / 16.8 ms, worst 150 ms during
  preparation. This uses the desktop GPU and cannot predict phone GPU timings.

Full recording: `Seamless_Coast_City_Canyon.webm`; telemetry: `full-drive.json`.
The older diagnostic recording is preserved as `Baseline_Before_Prewarm_Fix.webm`.

---

# Historical first implementation — chapter fades (2026-11-04)

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

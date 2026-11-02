# Scenery Foundation R2.1 — Canyon Language + Vista Reveal

## Product goal
Turn R2.0's isolated procedural stone columns into a readable canyon
landscape, then bring the canyon vista into the **unchanged, forward-facing
chase camera**. A single 1.5km Grand Canyon River Bend remains the
vertical slice. R2.1 is reproducible as `v0.9-r12`; accepted r11 and
r10 scenes are preserved via `?revision=r11` / `?revision=r10`.

## Scenic language
- **Near** (16–55m): patchy talus, low rocks, sagebrush and occasional
  weathered timber posts, with broad empty gaps rather than mirrored rows.
- **Middle** (55–175m): ground-integrated cliff strata, low scree banks and
  deep river-channel slopes, not an avenue of tall isolated sandstone cones.
- **Far** (175–450m): desaturated wide escarpment layers through the
  existing low-poly terrain; occasional low terraces, not dense vertical
  pillars. Four deterministic terrain strata colors across canyon bands.
- R2.1 canyon replaces the old 30m evenly spaced dry-tree/marker pattern
  **only within the active prototype**. Roadside markers in the Worker
  are suppressed there; visually sparse timber posts take their place.
  The real rails and collision boundaries are not removed.
- Red-white racetrack curb accents are removed in the core canyon
  corridor while white edge guides, asphalt, lane geometry and controls
  are preserved.

## Vista selection
At route-generation time, sample the exact `createPilotTrack()` poses
through the **normal `chaseTargets()` camera**, not the QA free camera.
The two-pass projection search (coarse shortlist, then 3 driving frames)
chooses an approach distance, reveal point and fixed focal distance.
It scores both the river and distant canyon rim in a safe central-ish
view cone. The final metadata records the count of visible samples and
honestly flags whether both passed. No frame-time scene analysis,
free-look, speed-dependent camera tweaks or unapproved road banking.

Before the reveal, low-value left-side foreground clutter is forbidden
near the focal zone, preserving its line of sight. This only removes
props: guardrails remain continuous. The tests establish camera-frustum
visibility; they do **not** claim occlusion-free real-time rasterization.
Human acceptance must verify the valley actually appears and is not
hidden by foreground terrain.

## Mobile and backward compatibility
Only R2.1's one canyon scene receives extra strata colors and clusters.
Everything uses pre-existing low-poly instancing and the current road
Worker. r11 canyon mesh/river, all road placements, handling and city
assets are unchanged. Only ~20 coarse + 15 detailed view checks run
at route planning; no search in the frame loop.

## QA
Open `?qa=1&seed=1` and select **大峽谷河灣 R2**. The QA stop starts
before the selected reveal point. Inspect the R2.1 river/rim frustum
counts in the QA audit, then **試駕** with the normal follow camera.
Use `?revision=r11` for an identical highway without the R2.1
visual-language or camera-based vista staging.
Check on Pixel 8: 57–60 FPS target, no new Preparing road pauses,
no cliff/river pop at stream boundaries, and a visible canyon from normal
driving rather than a forced free-camera detour.

## Next honest limits
This is still a road-following cross-section template, **not** a
2D world-coordinate terrain engine. Far-shore occlusions and overlaps
with remote road loops require separate geometric validation before
expanding to all mountain biomes. The Alpine Balloon Festival scene
comes after this canyon slice passes visual driving acceptance.

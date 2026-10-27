# Driving reference: approximately 37-second classic arcade racing sequence

**Evidence source:** User uploaded a chronological contact-sheet of 20 frames at roughly 2-second intervals, each showing the original on-screen "Total Time", speed in **mph**, current gear, road, buildings, water and roadside details. This is a **coarse sampled-IMAGE reading**, NOT a frame-by-frame geometric reconstruction, not an engine-internal L1 inventory, and not a source of engine AUDIO. Actual L1 primitive boundaries cannot be counted exactly from screenshots alone.

## Observations grounded in visible frames

| Approx elapsed | On-screen driving and world | Design-relevant player beat |
| --- | --- | --- |
| 0–4s | Start line/stand, wide urban road and tall buildings; from stopped to ~58 mph, visible 1→2 gear progression. Sightline opens into an early decline. | Start ritual + rapid acceleration + first road reveal. |
| 4–10s | Sweeping left-ish urban coastal roadway, city block wall to one side, palms and blue water opening, ~87→128 mph. | First long curve evolves with scenery reveal, rather than a random jump between totally unrelated corners. |
| 10–16s | Curve relaxes and gentle rightward movement/uphill grade appears in frames; traffic ahead and a long rising broad road; ~144→168 mph, sixth gear indicated around 13s. | Acceleration & changing grade + traffic pressure + approach to crest. |
| 16–22s | Ridge/highpoint and waterfront open further; at ~19s the HUD reads ~185 mph, roughly 298 km/h; descent/coast sweeping geometry unfolds, changing foreground/cliff/sea. | Crest/release/large scenic vista, at very high speed. |
| 22–30s | Marina/boats/harbor scenery and beach promenade; extended bending coastal road shifts intensity and direction, traffic passing, approach signage visible toward end. Speed near ~178–184 mph. | Long arc is not mechanically one flat note: scenery, line, traffic and sightline evolve. |
| 30–37s | More strong coastal left-curving view and chevron warning; far city reappears, traffic/rival ahead, speed ~176–182 mph. | Renewed curve demand, warning/approach to next challenge instead of a dead endpoint. |

### Honest event accounting

- At this sampling rate, it is **not credible** to assert an exact “9–11 true L1 placements” or “14–18 events” from the video. Those numbers were rough interpretive estimates, not directly counted independent geometric segments.
- Clearly visible *perceptual beats*: acceleration/shifts; city→water view reveal; broad curve entry/relaxation; climbing/crest/downhill; traffic/slipstream; seafront/marina scene shift; sustained high-speed coastal bends and chevron warnings.
- Some continuous bends may legitimately be **ONE primitive with a complex multi-lobe profile**, not automatically 2–3 L1 placements merely because the same corner has phases. Avoid artificial segmentation to meet a count.
- Road width: visual frames mostly show a wide boulevard/highway, NOT compelling evidence of multiple 2→8 lane transitions; do not force a width change into every proposed L2.
- Slipstream and traffic add meaningfully different excitement from road geometry, BUT existing OutRun prototype currently lacks confirmed functioning traffic/rival AI. **Do not claim this task replicates that layer without implementing and testing a separate mechanic**.
- The gear display visibly progresses to sixth and maximum sampled speed ~185 mph by ~19s. It is therefore reasonable to TEST a six-speed 300-km/h arcade car with meaningful shift events, not a literal engine torque clone.
- We cannot infer engine sound tonal quality from still frames; engine audio user feedback is a separate first-hand source.

## Lessons for procedural L2 Composer

A ~30–40 second **micro-journey** is a succession of *perceivable* driving and visual beats: fast charge, curving approach, uphill/crest, scenery opening, cornering pressure, release, approaching next road. Curvature/elevation/width remain stackable at the same time; their values can CHANGE and new local primitive placements can START or END at different distances in the SAME L2.

The original flawed v0.7C 16-row matrix selected one C + one E + one W and applied those shapes across the whole drive. That technically exercises dimensions but commonly feels like one long bend/grade. v0.7D must use **distance-localized multiple primitive placements** with an explicit event timeline and visibly meaningful rhythm. NO hard “exactly N events” based on these images.

The reference also suggests a useful constraint: *not every moment needs a dramatic new curve*. Changes in elevation, view, nearby props, traffic (future) and speed are also perceived as progress. An intentionally long sweeper can be engaging if its world/sightline evolves.

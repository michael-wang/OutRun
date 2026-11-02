# Scenic Director R1 — rhythmic road composition

## Product decision
A **new, replayable v0.9-r8 route revision** composes the road's curvature
into deliberate eight-beat driving arcs instead of repeating four short turns
in every beat. The accepted v0.9-r7 route is preserved at `?revision=r7`.

A repeated central phrase is:

**Sharp left/right rhythm (5–8) → sustained sweep (3–5) → long scenic
straight (1–3).** Flow sections (2–4) and one canyon technical switchback
(8–10) interrupt repetition. Targets are **advisory**, not fake scores.
Seed, biome and beat index control direction and slight intensity variation.

Each phrase uses **existing C02 and C08 profiles**:
- Flow: two balanced medium curves, lower driving effort.
- Rhythm: two short, genuinely forceful opposite turns (no 3-turn requirement).
- Sweep: two sustained, opposite `C02` curves, typically 700–920m long.
  Five *effective* reference-speed seconds are verified by the R0.1.1
  classifier; a straight gap never counts as turning duration.
- Reveal: one naturally uncurved full beat, usually ~1.7–2.4km.
- Technical: two opposite broad hairpins, authored only in canyon.
  Matched profiles cancel net heading while allowing a true U-turn.

## Guardrails
- **Only** curvature placements are replaced. Elevation, world transitions,
  lane count, 4→5→4 interchange, geometry generator, camera, input, worker
  streaming protocol, collision, traffic and scenery rendering stay intact.
- Only one new in-memory array `scenicCues`, with a fixed inventory of
  32 immutable route-local cue records. Both the cue score and road features
  are computed **when the seed is generated**, never per frame.
- Selected canyon technical beat is outside the guaranteed three-beat
  rhythm/sweep/reveal sequence. No canyon hairpins are authored in cities.
- Preserve r1–r7 route seeds and fingerprints. r8 has its own unique
  fingerprint, trip code and human reviews.
- Carry r7 bridge, breakdown, shoulders, roadside and banking rules
  forward to r8; recompute selective bank showcases for the new curves.
- Run reproducibility, no self-crossing, stream/geometry seam and QA tests
  for Seeds 1/2/7 and nearby seeds before human driving evaluation.

## QA
Open `?qa=1&seed=1` and select **導演節奏 (32)**. Each beat shows
intended and *measured* 1–10 intensity, active steering seconds,
steering peak/average, absolute turn and reversal count. The normal
**道路特徵** category independently checks long curves, hairpins and
S-bends. No role-specific scoring inflation or on-road UI overlays.

## Human acceptance
Drive one complete rhythm → sweep → straight sequence and at least one
canyon switchback. Check that the longer curve really requires >5 seconds
of meaningful steering, the straight feels like a payoff, the mountain
switchback remains physically navigable, and scenery still has believable
continuity. This milestone does not claim human playtest approval.

### Landmark staging
R1 now precomputes the final canyon-arch anchors, preferring a low-steering
400m approach instead of hiding an arch behind a technical turn. The very same
`scenicLandmarks` array is shared by Inspector and Worker-built chunk scenery,
so both systems point to the **actual** visible object. Historic r7 landmark
positions, clock towers and lighthouses are unaffected. Anchors participate
in the new r8 content fingerprint.

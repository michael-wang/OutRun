# R5c — Scenic Grand Tour, a 30km first-map road

Status: **road whitebox, guardrails and art-direction anchors implemented on dev**.
Build/Pixel 8/owner-driving acceptance is NOT yet complete.
Next task after drive approval: physical Hero Scenery via Blender/Geometry Nodes.

## Philosophy

The first 6.76km teach acceleration, big banks, S curves, the first
right-lane crash and two progressive drifting bends. **Don't retune them.**
After the lessons, alternate a great visual release with genuine
racing risk; a leader can lose time by overbraking or choosing a poor
line, a pursuer can attack under braking. No speed boosts keyed to race
position, no rubber-banding and no game-changing full-width road blocks.

This stage is now **30,000m from HUD 350 to 30,350**, plus 600m of
non-racing road relief for safe streaming after the finish. The
`ROAD-TRIP-10M` identity string is an existing telemetry/cache
compatibility key, NOT an authoring length or a 10km cap.

## Driven rhythm: author the road first

| HUD range | Driving character | Visual character |
| --- | --- | --- |
| 350–6760m | Accepted beginner lesson, crash and drift corners | Existing temporary coast assets |
| 7–10.4km | Fast long sweeps, catch-up by clean exits | Wide ocean and sails, clear horizon |
| 10.4–15.4km | Rise into two high-risk braking/turning gates | Massive coastal cliff silhouettes |
| 15.4–19.6km | High plateau cruising and broad mild bends | Giant rice/flower wave relief, inland ridges |
| 19.6–23km | Three committed turn decisions, quick reversals | Coast/mountain contrasts, overtake recovery |
| 23–26.5km | Very long gentle bank, highest broad vista | Giant offshore bridge and sunset |
| 26.5–28.9km | Two readable final risk/late-braking opportunities | Horizon narrows, racing becomes foreground |
| 28.9–30.35km | Unbroken full-throttle final sprint | Finish beacon grows into view, no surprise drift |

The road is intentionally much longer than the old fixed 10km trip;
the extra distance gives meaningful time for several scenic
payoffs AND racing pressure without exhausting either element.

### Five hero slots (absolute HUD metres)

1. **9650 — Bay entrance, left, look-ahead 500m.**
   Panoramic sea, sails, orange water, no obstacle wall in the reveal.
2. **11700 — Sea cliff, left, look-ahead 700m.**
   Climbing cliff road with real 3D rock/landmass, strong layered
   parallax and protective railing, not the old far-depth mountain
   trick. Stay readable at 250–300 km/h.
3. **16250 — Highland rice, right, look-ahead 680m.**
   Broad rice/flower slopes, big-scale wave bands moving across
   visible terrain, elevated roads and distant ridges. Road calm.
4. **24200 — Sunset bridge, left, look-ahead 900m.**
   One landmark-grade crossing silhouette against open water,
   long gentle bank, *visible* continuity of low protection.
   The bridge **mesh and supports are not yet built**.
5. **29700 — Finish beacon, ahead, look-ahead 1100m.**
   Stage-unique visual destination on an uninterrupted straight,
   with enough clear room for all rivals to sprint and pass.

The pure data objects, roles and validation are in
`content/stages/coast/direction.json` and
`src/content/coast-direction.ts`, not in an invented
Scenic Manager. All scene anchors can be regenerated from the
actual shared world-space road using `npm run r5:road-guide`.

### Racing risk gates

- 12,850–15,100m **Cliff gate:** brake, choose a clean apex,
  then accelerate; no invisible dangerous cliff edge.
- 19,800–22,750m **Shore switchbacks:** hard left-to-right
  sequence with a chance to overtake during exit acceleration.
- 27,200–28,900m **Last chance:** two technical turns before a
  long, unobstructed finish dash. No scripted rank-changing help.

Road geometry, elevation, bank, lane width, traffic AI, swept
collisions and Worker rendering share the same authored sampler.

## Coast barrier policy — owner changed this intentionally

Seaward side always has **visible, low road-edge protection**:
- Ordinary coast = continuous dual-height, muted metal rail.
- Public beach = individual low concrete bollards joined by
  a subtle continuous metal beam.
- Both have continuous physically effective GuardrailContact;
  isolated stone hits remain the existing concrete stone collision.
- Never place a purely invisible wall where it would have
  no matching visible physical structure.
- Keep the ocean as the star: rail heights remain low and
  have the same existing instance-material budget. Do NOT
  bring back enormous decorative rocks along the asphalt.

The new all-coast barrier is in `src/coast-layout.ts` and
`src/coast-resort.ts`; contact material selection shares
`coastBarrierStyle` via `src/coast-contact-feedback.ts`.

## Geometric/mountain/shore caveats

- This is a **driveable road whitebox**, not a complete 30km world.
  Legacy houses, drainage, rice plots, boats and other assets
  are still authored mostly within the first ~10km and are
  temporarily reused as-is where they exist.
- The former two fixed-chord mountain sheets remain restricted
  to the old ~10km footprint. Do not stretch them or lock in
  their incorrect parallax; new hero cliffs/ridges must be
  coherent world-space geometry, not camera-depth overrides.
- The seaside FFT retains its original wave simulation. Extending
  the shoreline mask to 30km would multiply offline nearest-
  segment cost without a true spatial search; the bake now uses
  an **exact XZ AABB segment tree** with the same mask channels
  and texture-resolution policy. Pixel 8 timing and archive size
  still need local verification.
- Road altitude was deliberately raised for cliff/plateau/bridge
  beats. No extra terrain meshes or supports have been authored
  yet; don't treat the bare road whitebox as final scenery.

## Blender and Geometry Nodes handoff

From the repo root:
```bash
npm run r5:road-guide
blender -b --python scripts/blender/r5_guides.py -- art-prototype/output/r5-road-guide.json art-prototype/output/r5-road-guide.blend
```

The offline source exports the **entire route** and exact Hero
anchors, bank, road widths and chapter metadata. Blender produces
reference-only curves and position markers, and a tiny rock
scatter test. No runtime geometry, collider or final scenery
is substituted for the game road.

After road driving approval, choose ONE Hero location (prefer
9650m ocean bay, or 11700m first big cliff) and prototype its
materials/geometry and mobile LOD. Test running footage and
stable 60 FPS on Pixel 8 BEFORE copying techniques across 30km.

## Owner / local Codex validation

- `npm run verify:dev` locally before claiming technical green;
  `dev` push must not trigger a full GitHub CI/deploy.
- `npm run r5:road-guide` must generate exact 30km+ guide.
- R5c route/terrain/shore tests must pass, including no nonlocal
  road self-overlap, continuity and **visible** ocean barriers.
- Playtest these developer-only jumps, with seeded repeatability:
  `?at=9350&r5qa=1&trafficSeed=42`,
  `?at=11200&r5qa=1&trafficSeed=42`,
  `?at=16000&r5qa=1&trafficSeed=42`,
  `?at=19800&r5qa=1&trafficSeed=42`,
  `?at=23800&r5qa=1&trafficSeed=42`,
  `?at=27100&r5qa=1&trafficSeed=42`,
  `?at=28850&r5qa=1&trafficSeed=42`.
- Human acceptance is driving/visual: hero reveal arrives at a
  controllable moment, long turns are really long, difficult
  sections leave a recoverable exit, and the final straight
  allows a legitimate late pass.
- Check town/buildings/farms and old art are **clearly provisional**
  beyond old coast; don't accidentally present unfinished
  physical relief as an approved scenic region.

No `main` update or public release is authorized by R5c.

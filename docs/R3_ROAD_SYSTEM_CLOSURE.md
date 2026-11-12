# R3 — Authored road architecture closure (2026-11-12)

**Status:** code migration complete, CI and owner acceptance pending.

## The playable route

`content/stages/coast/{stage,road,scene}.json` is the one source for coastal
identity, road curvature/elevation/lanes, static prefabs and scenic beats.
`src/content/coast-stage.ts` validates the finite stage.
`src/content/road-shapes.ts` implements the original approved C02 and E02
cosine knots as small mathematical functions; no procedural route planner.
`src/content/authored-road.ts` samples that input in absolute HUD metres;
`src/content/authored-track.ts` constructs the continuous 3D road and bank
using the existing `src/track.ts` integrator.
`src/content/coast-worker-road.ts` supplies the same native sampled road,
course, width, coast weights and stage identity to both game and road Worker.
`src/content/coast-gameplay-sample.ts` supplies beat labels and lane metadata
for live telemetry. Road and scenery Worker produce bounded chunks and block
driving if a drivable chunk is unavailable.

`src/coast-review.ts` and `src/content/coast-feedback-data.ts` handle the
small coast-only feedback UI without L2/Pilot catalogs. Legacy on-device
feedback storage/export fields remain compatible; the old placement array is
materialized **only as a read-only export projection**.

## Removed, not archived in runtime

The unplayable Brick, L2, Pilot, Stage 01 and Trip random/composite generators
and their catalogs, old challenge/vote labs, scenic director, multi-world
journey joins and corresponding historical QA suites have been deleted.
Git history retains them. Remaining `src/challenges.ts`, `src/track.ts`,
`src/banking.ts`, `src/road-profile.ts`, `src/road-interchange.ts`,
`src/scenery-cross-section.ts` and `src/grand-canyon-scene.ts` provide
shared math, rendering or scenery capabilities; they are **not alternate
active stage generators**.

## Verification and boundaries

Blocking P0: authored stage schema/continuity, bad input rejection, shared
game/Worker road, missing chunk and restart recovery, feedback persistence.
P1: live race, AI traffic, recovery. Additional coast scenery/roadside unit
tests are retained and use the same authored track (not generated Trip seeds).
Old historical tests tied to extinct routes have been removed.

R3 does not edit nine accepted coast sweeps, road elevation, ultra-water,
racing physics or scenery assets. Any new road redesign belongs to the
**next owner-approved playable stage milestone**, not this infrastructure
migration. Future coast-to-city transitions are out of scope until specified.
Do not restore the retired multi-world/procedural pipeline.

Pending P2: brief startup lag observed by owner, GitHub Issue #32. Profile
cold/warm startup before applying any speculative performance fix.

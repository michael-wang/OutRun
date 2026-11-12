# R5 — authored map remake kickoff (2026-11-12)

Status: **next active development phase**, R4 accepted.
This is an art/engineering brief for the first road whitebox, **not**
a finished map specification or a reason to rebuild the renderer.

## North star — teach first, thrill next

**This is the game's FIRST map.** Its opening must teach the controls by
making the player successful, without heavy pop-up tutorials or punishing
technical corners. Subsequent acts alternate scenic wonder with racing
challenge; the closing act culminates in a recognizable finish sprint.
The road remains enjoyable, but the *opening objective is confidence*,
not maximum corner intensity.

Original OutRun/OutRun 2 SP are references for the arcade *feeling*, not
routes, assets, licensed cars or music to reproduce.

### First whitebox slice: onboarding without scenery dependency

- Begin with an unobstructed acceleration straight and a broad, fast
  **non-drift** sweeper.
- After that first corner, gradually reveal ordinary civilian traffic.
  The **eight racing rivals remain present from the starting grid**.
- Introduce a legible banked S-curve to teach satisfying alternating
  steering before increasing difficulty.
- After the S-curve, teach obstacle recognition with a staged roadside
  accident; begin with an easily read, avoidable formation.
- Only after that sequence place two drift-demanding corners. The first
  must be visibly approachable with wide recovery space and a rewarding
  accelerating exit; the second can request more precision.
- Keep four lanes as the initial road whitebox baseline unless a specific
  scene clearly needs more. Lane reductions/expansions and construction
  hazards come after the core driving lessons.
- Use the actual chase camera, real driving speed, stopping/approach
  distance, and test footage to choose the stage positions. Do **not**
  lock these seven lessons into a guessed percentage of the route: at
  200–300 km/h too little distance can become just seconds of play.
- Road geometry, streaming and collision share one logical sampler. Do
  not revive the random Scenic Director or historical second-stage code.

The detailed authored teaching/event script, with ownership and
collision safety requirements, is in
[`R5_FIRST_MAP_DIRECTOR.md`](R5_FIRST_MAP_DIRECTOR.md).

## Critical motion-parallax check — new acceptance gate

The old coast mountain implementation in `src/coast-mountains.ts`
builds two separate long sheets along the route's start-to-end **chord**,
with cross-axis spans of roughly 430–2130m for the mid layer and
1300–3400m for the rear layer. This creates substantial nominal
distance overlap (1300–2130m) and allows visual-looking-adjacent
ridges to have very different motions. It also overrides projected
depth (`gl_Position.z`) for backdrop rendering. Neither this geometry
strategy nor the special depth treatment is a new-map requirement.

For the remake:
1. Place nearby hills and genuinely distant ridges in coherent
   **world-space** positions relative to the authored road and camera.
   Do not equate route metres or draw order with physical distance.
2. Give close, middle and far terrain proportionate geometry scale,
   motion-parallax and occlusion. Adjacent silhouettes should not
   behave as if one were 200m away and the other infinitely distant.
3. Keep depth-buffer overrides for truly distant decorative sky
   layers only; avoid them for visibly physical midground terrain.
4. Check both still compositions and **moving** chase-camera footage,
   especially on bends, with near vegetation / hills as a reference.
   No popping, lateral skating, depth inversion or sudden background
   jumps is acceptable.
5. Do not spend R5 time fixing the soon-to-be-retired old coastal
   mountain pair unless it creates a new P0/P1 regression.

## Stage boundaries and workflow

- `content/stages/coast/{stage,road,scene,effects}.json` and
  `src/content/coast-stage.ts` are the current finite authored path.
  Reuse that engine-to-content seam; expand data only for a proven
  map requirement. JSON remains provisional, per ADR-010.
- During the first whitebox, avoid loading an entire replacement
  mountain and settlement art pipeline. Preserve the known playable
  baseline in Git history until the whitebox is accepted. No extra
  public map selector or duplicate legacy route engine.
- Retain Pixel 8 FPS/safe streaming and the ability to drive from
  beginning to end even if scenery chunks have not loaded yet.
- Mark an R5 road slice complete only when the owner can recognize
  and **feel** each turn, bank and recovery from the driver's seat.
  Static screenshots alone cannot establish those criteria.

## Explicitly deferred

Full new scenic direction, region wind editors, mud/wet-pavement
physics, per-material collisions, local road bumps and sophisticated
mountain LOD are future **concrete feature** tasks, not prerequisites
to trying the whitebox. Material-contact seams are in
`docs/NEXT_SURFACE_CONTACT.md`.

## Next acceptance

**R5a:** prove the first three movement lessons in a focused road
whitebox: acceleration straight, comfortable non-drift sweeper, and
banked S-curve. Roadside civilian traffic should first appear after
the opening sweeper. Use distance/lesson debug markers and real
player-camera video so acceptance is unambiguous.

**R5b:** first staged accident followed by two progressively harder
drift corners, then expand the authored course.

**R5c:** hero scenery and alternation between relaxing vista beats and
challenging racing/roadwork beats.

**R5d:** clear final acceleration/sprint and finish-line payoff.

Art workflow, Blender usage and project responsibilities are detailed
in [`R5_ART_PIPELINE.md`](R5_ART_PIPELINE.md).
No implementation of these new stages is implied by documentation.

## R5a implementation checkpoint (2026-11-13)

The first authored road revision deliberately replaces only the first three
coast turns, preserving the still-playable remainder for iteration.
Opening route (absolute HUD metres):
- A0 **350–1390** — acceleration straight, no civilian traffic.
- A1 **1390–2270** — mild long sweeper, no drift needed.
- A2 **2270–3260** — first sparse civilian vehicle, open passing lanes.
- A3 **3260–4460** — two opposite sweeps, locally authored ±10° banking.
Road/lesson boundaries and civilian rollout are now authored in
`road.json` + `onboarding.json`, not duplicated as a procedural
Scenic Director. `R5a` is a player-review candidate, not final road art.

Existing coast assets beyond the whitebox remain transitional; no visual
acceptance of the old mountain sheets is implied. R5b will create staged
accident scenes and the first drift lessons after R5a driving feedback.

### R5a implementation status

R5a development candidate `v0.10.1` replaces the former three
opening coast turns with: A0 350–1390m straight, A1 1390–2270m
easy sweep, A2 2270–3260m first civilian-traffic encounter sector,
and A3 3260–4460m banked S. Two `showcase` bank envelopes target
approximately -10° and +10° via the existing shared road sampler.

The civilian race schedule starts with one seeded actor at/after
2590m and holds its second wave until 4790m; the old 300m
racing-mode entry generator is disabled only for first-map
onboarding. Random breakdowns cannot begin until 5600m.
The first accident scene and drift turns are **R5b**, not R5a.

Use development-only `/?r5qa=1` to display live lesson markers.
Useful test jumps: `?at=1390&r5qa=1`,
`?at=2270&r5qa=1`, `?at=3260&r5qa=1`,
`?at=3910&r5qa=1`. Run the complete
`npm run verify:dev` and a Pixel 8 drive before marking accepted.

## R5a.1 — 2026-11-13 driver-feedback revision

This section supersedes the R5a.0 numeric distance checkpoints above.
The owner wanted immediate arcade spectacle without making the
opening bend a drift exam. Current `dev` v0.10.2 has:

| Lesson | Absolute HUD metres | Road |
| --- | --- | --- |
| A0 | 350–1400 | Straight launch; civilian-free |
| A1 | 1400–2320 | Longer sweeper, `steer=-0.25`, bank `-12.5°` |
| A2 | 2320–3050 | One tutorial civilian encounter at/after 2640 |
| A3 | 3050–4710 | `-0.37` left + `+0.39` right, `-13°/+13°` banks |

After the tutorial, ordinary highway traffic is **seeded-random**,
not fixed. The next traffic group starts around 5060m and the earliest
random breakdown is 5800m. A2's first moving car may require
additional playtest pacing to guarantee an actual on-road overtake;
a static recipe starting position is not itself an encounter guarantee.

Four reported unit failures were updated based on their real
dependencies: feedback placement ordering, old sunset-angle locks,
horizontal vs banked lateral measurements, and overlapping world-Z
lamp atlas slots. The lamp issue is a known technical limitation of
the retired near-straight coast layout; validate a world-XZ/road-space
lookup when designing the new scene lights instead of allowing
phantom dark patches on winding roads.

New `?r5qa=1` checkpoints:
`?at=1400`, `?at=2320`, `?at=3050`, `?at=3950`.
Local `npm run verify:dev` is still required; changed tests have
NOT been executed in the connector-only environment.

## R5a.2 / R5b playable road update (2026-11-13)

Following actual player feedback, the first straight was too
long and the left/right S transition felt like an extra straight.
Current development `v0.10.3` shortens A0 to 350–900m,
begins the banked first sweep at 900m, and connects the S
segments **exactly at 3520m** with a shorter C02 transition.

The two road-only drift lessons are now authored at
**5100–5640m** and **6280–6760m**, with clear recovery
between them. No A4 crashed-car event is yet implemented.
Normal civilian traffic is random (seed-deterministic)
after the full A0/A6 teaching corridor, beginning around
7120m. Random breakdowns are delayed to >=7560m so
they do not unexpectedly occupy the drift lessons.

R5b drift QA in Vite dev:
- `/?at=4850&r5qa=1&trafficSeed=42` — approach first
  drift and see the dev-only entry-speed cue.
- `/?at=6000&r5qa=1&trafficSeed=42` — approach second
  drift after a long recovery.
- `/?at=2700&r5qa=1&trafficSeed=42` — evaluate the
  contiguous left/right S without a neutral road segment.

The existing terrain and mountain art past the opening is
provisional. Do not invest more in it before confirming the
whitebox road and future hero-vista placements.

## R5b.1 — an accident that must be steered around

The formerly straight A4 slot is now a modest authored
curve (4410–4890m, steer -0.32) containing two or three
staggered, slightly angled **real** stopped vehicles near
4635m. The two originally accepted drift turns are unchanged.
The existing traffic physics, rendering pool, rivals and
warning-triangle instancing are reused. An extra road geometry
authoring step is needed in Blender guides after road acceptance.

Tests are maintained in the same commits, including seeded
accident placements, a minimum of two truly passable lanes,
AI obstacle dimensions and a single warning sequence.
As before, complete TypeScript / Vitest and actual Pixel 8
playthrough require the local workstation; do not declare
technical QA green solely because GitHub accepted source.

## R5b.2 — easier first incident; physical world interactions

Version `v0.10.5` (development only) moves the first accident
to the right outside lane with two gently angled cars, leaving
a broad left-side bypass. Later incidents may be seeded into
different lanes, but the tutorial remains predictable.

Incident impacts by player/rival/civilian update one persistent
TrafficWorld car body and its yaw; triangles share their existing
bounded fly/tumble pool for all road users. New tests cover
the right-lane corridor, seeded later safety, vehicle momentum,
checkpoint persistence and first gamepad input edges.

**Local Codex verification required:** run
`npm run verify:dev` and focused R5 incident/gamepad tests
before play acceptance, and test first-time gamepad confirmation,
a rival hitting a reflector and a right-lane accident at
`?at=4170&r5qa=1&trafficSeed=42`.

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

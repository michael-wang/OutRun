# R5 — authored map remake kickoff (2026-11-12)

Status: **next active development phase**, R4 accepted.
This is an art/engineering brief for the first road whitebox, **not**
a finished map specification or a reason to rebuild the renderer.

## North star

Make the **road itself** worth driving. Build one authored playable
road from the existing finite-stage content pipeline; prove the
driving rhythm before investing in buildings, fields or mountain art.
Original OutRun/OutRun 2 SP are references for arcade *feeling*,
not routes, assets, licensed cars or music to reproduce.

### First whitebox slice

- Hand-author a deliberately short, representative sequence with:
  a recoverable opening, one genuinely sustained fast sweeping turn,
  one technical left-right S-bend that is not two negligible kinks,
  one clear altitude/bank reveal, and a long sightline to recover.
- Retain the existing arcade player, rival/traffic and bounded
  road-streaming safety. No new generic road generator, Scenic Director
  or historical second-stage adapter.
- Evaluate turns through the actual chase camera at driving speeds,
  not solely through a bird's-eye spline preview. Start with four
  clear lanes unless a specific gameplay scene needs a different count.
- Large forms first: curves, banking and elevation must read at speed.
  Only after road acceptance, add hero vista placements and rhythm,
  then supporting environmental detail, and finally small filler.

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

**R5a:** drive a focused road whitebox with strong, readable curve
rhythm and one bank/elevation reveal; use real in-game footage and
landmark/distance labels for easy feedback. Once that passes,
replace the rest of the route and only then plan scenic hero beats.

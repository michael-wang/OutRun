# Grand Canyon Art Prototype — 400m visual gate

This milestone tests whether ONE hand-editable canyon section can look convincing
from the real player camera. No new runtime world generation or road edits.

## One command on the Windows development machine

Prerequisites: `npm ci`, Blender 4.x installed, and the current `dev` branch.
From the OutRun directory:

```powershell
npm ci
npm run art:blockout
```

If Blender is not on PATH, set `BLENDER_BIN` to the actual executable:

```powershell
$env:BLENDER_BIN = 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'
npm run art:blockout
```

The Blender installation path and version may differ.

## Outputs (all ignored by Git)

Everything is written under `art-prototype/output/`:

| File | Use |
| --- | --- |
| `road-reference.json` | Actual world-space road poses from `createPilotTrack(DESIGNER_CANYON_STAGE)` |
| `Grand_Canyon_Art_Prototype.blend` | Editable mesh collections, proxy road, three game-matched cameras |
| `01_Approach.png` | The normal chase view before the canyon reveal |
| `02_Reveal.png` | The intended main scenic composition |
| `03_Exit.png` | Landscape and road continuity after the reveal |
| `canyon_art_only.glb` | Art-only mesh export; the proxy road is excluded |

The exact track and camera come from the production `createPilotTrack()`
and `chaseTargets()` via the `scripts/art-proto/export-road.mjs` exporter.
The Blender script converts Three.js Y-up to Blender Z-up without changing
any road coordinates.

## Fixed artistic brief

- 400m of the existing 3.2km Designer's Cut; the route is NOT regenerated.
- One continuous left-side canyon and fixed-height river with two banks.
- One continuous right rock cut and two broad far sandstone plateau masses.
- A few explicit sculpt keys, not stone columns or evenly spaced prop rows.
- Three fixed editorial camera stops at the game's actual chase settings.
- Warm flat-color blockout; these are not finished art assets.

## Visual acceptance gate (before any game integration)

1. From **02_Reveal**, river, near bank, far shore and rim are visually distinct.
2. From **01_Approach**, the normal player camera naturally approaches the main view.
3. Terrain looks physically joined; nothing clips the reference asphalt.
4. From **03_Exit**, the near/middle/far composition is still readable.
5. Only after those frames pass should we integrate `canyon_art_only.glb`
   and measure Pixel 8 FPS, collisions and streaming.

**Important:** Camera frustum tests are NOT a substitute for looking at the
actual three rendered PNGs. The scripts merely create a first editable
blockout. After the first run, open the `.blend` file in Blender and edit
the scene by hand. The starter command now refuses to replace an existing
`.blend`; `npm run art:blockout -- --overwrite` explicitly rebuilds it.
Archive your artistic edits before using that override. Use `render_scene.py`
below to render the edited scene without rebuilding it.

Maximum two major visual revision rounds before a go / stop decision.
Do not add more procedural scenery systems as a workaround.

## Local execution verification — 2026-11-03

On the Windows development machine, Blender 4.5.13 LTS is available at:

```powershell
$env:BLENDER_BIN = 'C:\astra-dev\tools\blender-4.5.13-windows-x64\blender.exe'
npm run art:blockout
```

The initial Blender run rendered the PNGs but failed before GLB export because
the active object was assigned to the scene's view-layer collection. The script
now uses the current view layer. The launcher starts with factory settings,
propagates Python errors as a nonzero exit, and checks all five output files.
The SSR road exporter also disables unnecessary browser dependency discovery.

The corrected command completed with Blender EEVEE and produced the `.blend`,
art-only GLB and three 1280 x 720 PNGs. Reopening the saved scene verified all
three camera positions, directions and horizontal/vertical FOVs against the
production chase-camera export (76 degrees / approximately 47.4484 degrees).
The GLB contains five art meshes and excludes the reference road and cameras.
`npm run build` and the CI active unit suite passed (76 files, 239 tests).
Local logs are `art-prototype/output/blockout-verified.log` and
`art-prototype/output/verification.log`; outputs and logs remain ignored by Git.

Visual inspection of all three renders found that the river and near/far banks
are not clearly readable in `02_Reveal`; the frames are dominated by the proxy
road and shoulders. File generation and camera matching passed, but the visual
acceptance gate has **not** passed. These are the initial authored blockout
renders for Julia and the owner to review; no artistic revision round or game
integration was performed. This is an offline Blender result, not browser or
physical-device gameplay validation.

## Hero Scene v2 — local review candidate, 2026-11-03

The existing `.blend` was opened and its art meshes were directly edited with
Blender Python mesh operations and fixed, artist-chosen coordinates. No new
scene generator or runtime scenery system was added. The editable result is
`art-prototype/output/Grand_Canyon_Art_Prototype.blend`; the first version and
its three PNGs, GLB and road JSON are preserved in `output/archive-v1/`.
Two spatial revision rounds were followed by seam, surface and crop repairs.

Changes in the scene:

- Driver-left: a narrow gravel lip, steep stepped descent, lower talus, a
  fixed-height river at 56.14m, rising opposite bank and continuous redwall.
- Driver-right: a close sandstone cutting with authored recesses and ledges.
  The near wall and bend screen mask the unfinished outer scene and road crop.
- Three large backdrop silhouettes: western mesa, taller split crown and a
  lower, wider distant rampart. A continuous foundation closes sky gaps below
  them. These are finite view-serving backdrop meshes, not a complete world.
- Warm weathered stone, subdued asphalt, narrow gravel shoulders and road
  markings replace the broad pale shoulders. No cones or red/white curbs are
  present. Three small, unevenly spaced sage clumps provide restrained scale.
- The 400m reference asphalt's 162 vertex coordinates remain exactly unchanged.
  Its face winding was corrected for lighting. A separate reference-only mesh
  samples the **existing** production track from 1740–1940m so the road continues
  behind the bend screen; this does not change the track or its driving behavior.
  The extra samples are local `output/hero-road-continuation.json`.

The three original camera transforms, lens settings, clipping planes and shift
values match the archived v1 scene exactly. The exported game chase targets and
horizontal/vertical FOVs also pass validation. All three new PNGs are genuine
Blender 4.5.13 EEVEE renders at 1920 x 1080, with the same 16:9 composition.

To render the edited scene again and export only its art collections:

```powershell
$env:BLENDER_BIN = 'C:\astra-dev\tools\blender-4.5.13-windows-x64\blender.exe'
& $env:BLENDER_BIN --background art-prototype/output/Grand_Canyon_Art_Prototype.blend --python-exit-code 1 --python scripts/art-proto/render_scene.py
```

This helper checks the game cameras and renders existing geometry; it does not
rebuild or save over the artist's scene. `canyon_art_only.glb` now contains 26
art meshes and excludes asphalt, painted road markings and cameras. Blender
weathering shader nodes are not baked into the GLB; it is a geometry/base-color
handoff, while the `.blend` and PNGs are the visual review authority.

Verification: the original road JSON is byte-identical to v1; 605 vertical
pavement probes across the original and downstream reference found no art
overlap. All PNGs decode at 1920 x 1080. GLB 2.0 headers, mesh count and excluded
reference objects were checked. The starter overwrite guard was exercised and
left the edited scene hash unchanged. Local evidence is in
`output/v2-final-render.log`, `output/v2-verification.log` and
`output/v2-overwrite-guard.log`. No gameplay or physical-device testing was
performed for this offline art edit.

**Visual assessment: improved, awaiting Julia/owner review; not a passed gate.**
All three views now show a canyon theme, with the river and opposing strata
readable on the left and a close wall on the right. However, the river is still
thin in the normal chase view, the sheer depth is less convincing than the
authored height difference, and the silhouettes/strata retain a strong faceted
blockout character. The road still occupies much of the lower frame. No further
major revision or game integration is implied by this delivery.

## Blender v2 driving integration — 2026-11-03

The owner subsequently authorized a local integration test of the existing v2
asset, without a third art revision. The opt-in test is playable, but **the
entry/exit art transition is not visually accepted**. The continuous drive
exposes a downstream foundation intersection that the three offline cameras
could not reveal.

Run `npm run dev` and open:

- Original: `http://127.0.0.1:5173/?showcase=canyon`
- Blender: `http://127.0.0.1:5173/?showcase=canyon&art=blender`

`npm run build` followed by `npm run preview -- --port 4173 --strictPort`
also supports the local asset. The Vite middleware serves only
`art-prototype/output/canyon_art_only.glb` at
`/__local_art/canyon_art_only.glb`. It does not copy the asset into `dist`.
Another checkout must have the ignored GLB installed locally. A missing GLB
shows an explicit error; it does not silently substitute the original scenery.

### Implementation and geometry limits

- GLTFLoader uses the existing world coordinates: root translation `[0,0,0]`,
  scale `[1,1,1]`, quaternion `[0,0,0,1]`. The loaded art has 6,020 triangles
  and 67 material-split Three.js meshes. No reference road is imported.
- The original asphalt, road centerline, slopes, width, rails, wheel contact
  geometry, controls and normal chase camera remain unchanged. The 69km route
  ignores `art=blender`. Only the Designer's Cut mode enables this handoff.
- Double yellow center lines replace the four-lane dashed paint in Blender
  mode; red/white curb tiles are suppressed. Physical width and traffic remain
  unchanged, so this is a paint treatment, not a two-lane driving conversion.
- Existing terrain/water/rock visuals are masked against the fixed authored
  foundation footprint. Near-road shoulders/support are visually suppressed
  from 1,340–1,940m. Exact original shoulder meshes remain invisible and
  raycastable; trimmed visual copies never affect wheel contacts. No new
  terrain generation or art geometry is introduced.
- Eight existing rock/gravel base colors are restored by material name because
  the Blender weathering nodes omitted their GLB base-color factors. Water and
  sage retain their exported materials. Haze changes to 450–2,400m to expose the
  backdrop; chase optics and near/far clipping settings are unchanged.
- The Blender reference asphalt has a deliberate 3cm lift and 5m sampling;
  the real road samples at 2.5m. Comparing reference-edge midpoints against the
  production sampler found maximum horizontal/vertical differences of
  0.00617m / 0.03313m. The real road was not changed to match the reference.

The tested GLB is 360,116 bytes, SHA-256
`D1112D56C8DCF2A1C537618D074AD3DC1F58CA74400CB1ED8DBAD33A359A24DE`.
Neither the GLB nor the `.blend` was edited during this integration.

### Continuous driving evidence

Playwright ran real Chrome/WebGL on the local RTX 5070 Ti. Each drive reset once
at 1,000m, then used ordinary steering/throttle inputs through the existing RAF
physics to at least 2,450m. There was no teleporting or diagnostic camera during
the drive. Steering was automated, not a human steering assessment. Both
desktop variants recorded the canvas to keep recording overhead comparable.

| Local Chrome run | Ready from navigation | GLB fetch + parse | Median FPS | 5th-percentile FPS |
| --- | ---: | ---: | ---: | ---: |
| Desktop original | 449ms | — | 60.0 | 60.0 |
| Desktop Blender | 456ms | 10.3ms | 60.0 | 60.0 |
| Mobile emulation original | 644ms | — | 60.0 | 56.0 |
| Mobile emulation Blender | 619ms | 10.0ms | 60.0 | 56.0 |

All four runs reported zero missing road/camera-road frames, unsafe streaming
frames, streaming stalls and JavaScript errors. These are individual local
runs, not a statistical performance benchmark. Desktop viewport was
1920×1080; mobile emulation was 960×432 with touch/mobile settings and the
game's existing render-ratio cap. **No physical Pixel 8 was connected or tested.**
The owner's 57–60 FPS physical-device baseline remains unverified for Blender.

Ignored evidence lives in `art-prototype/output/integration/`:

- `desktop-blender-00_Before.png`: approximately 1,200m, exposed entry edges.
- `desktop-blender-01_Approach.png`: approximately 1,365m.
- `desktop-blender-02_Reveal.png`: approximately 1,470m.
- `desktop-blender-03_Exit.png`: approximately 1,585m, corresponding to the
  offline reference exit camera; this is still inside the hero segment.
- `desktop-blender-04_AfterHero.png`: approximately 2,050m, actual downstream
  exit with the foundation obstructing the view.
- `desktop-blender-05_Departure.png`: approximately 2,350m.
- `desktop-blender-drive.webm`: continuous 1,000–2,450m normal-chase drive.
- Matching original/mobile PNGs and JSON traces, plus
  `desktop-original-drive.webm` and `road-reference-comparison.json`.

### Visual findings requiring owner review

The main hero view shows the river, opposing layered wall and large backdrop,
but the river remains thin. Game lighting/ACES differs from Blender's lighting
and AgX; weathering is not baked. Cars, HUD, traffic cones and existing safety
rails are still game objects. Mobile retains the original 1,400m far clip, so
its distant backdrop can differ from desktop's 2,200m clip. Visible narrow
Blender shoulders also do not redefine the original off-road contact surface.

Vertical probes every 10m at lateral offsets -6.5/0/+6.5m found no art at or
above pavement within 1,340–1,940m. This sampled check is not an exhaustive
intersection proof. The full 1,000–2,450m check found **94 probe locations** with
art above the road, first at 2,040m on the right edge. The existing mesh
`GROUND_|_continuous_canyon_foundation_-_no_sky_seams` rises through the continuing
road: at 2,050m its centerline surface is about 3.11m above the road, obscuring
the chase view; at 2,350m it is about 30.84m above. Art is non-colliding, so the
car continues underneath. This is an existing v2 foundation problem, not a
loader coordinate adjustment or overlapping legacy terrain.

Before the hero segment, open cutting ends and slab undersides are also
visible. Simple caps cannot solve the downstream foundation intersection.
No caps, mesh carving, arbitrary repositioning, road changes or third art
revision were made to conceal these findings. Driving/streaming verification
passed; entry/exit visual acceptance remains unresolved.

### Checks

`npm run build` passed (existing large-chunk warning remains). The active CI
unit suite passed: 77 files / 242 tests, including exact road/contact
preservation and visual masking checks. The command retains the repository's
existing historical-test exclusions:

```powershell
npm test -- --exclude src/handling.test.ts --exclude tests/v07d2-review.unit.ts --exclude tests/v081-stage.unit.ts --exclude tests/vertical-width.unit.ts
$env:OUTRUN_BROWSER = 'chrome'
npx playwright test tests/blender-canyon.spec.ts --reporter=line
```

Browser checks cover original/Blender desktop and mobile continuous drives,
missing-asset handling, isolation from the 69km route, and a built production
preview. All seven cases passed across the initial comparison run and final
Blender/production rerun. GLB-dependent cases skip when the intentionally
untracked local asset is absent. Output captures, videos, scene files and logs
remain ignored; only integration code, tests and this report belong in Git.

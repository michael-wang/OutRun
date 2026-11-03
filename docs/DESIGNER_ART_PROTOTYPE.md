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

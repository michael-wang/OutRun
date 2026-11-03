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
the scene by hand; rerunning the script will overwrite the starter `.blend`.
Keep a copy of your artistic edits.

Maximum two major visual revision rounds before a go / stop decision.
Do not add more procedural scenery systems as a workaround.

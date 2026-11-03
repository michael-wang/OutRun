# Grand Canyon · Grand Curves v3 → Blender terrain pass

**Current local handoff: Final Attempt, below. Visual acceptance FAILED.**
The earlier terrain handoff is retained as history; the roadlock Blender URL
now loads `grand_canyon_final.glb`. This last attempt starts from an empty
Blender scene, superseding the earlier permission to reuse v2 rock meshes.

## Road is the source of truth

Play at `?showcase=canyon&road=lock`. This **overwrites** the prior Road
Lock design. 5.65km, four one-way lanes, white lane separators, no double
yellow, no standard traffic or cones. Three 34–36° banked C08 hairpins
remain exactly where they were. The short, repeated left/right flicks
(C07) are replaced by **single long C02 sweeps** and just **two roomy C06
S-bends**, giving the player time to commit to a turn. The severe
climbs/descents are retained.

### Intended geography and visual rhythm

| Road-relative m | Driving | Geography for Blender |
|---|---|---|
| 0–340 | One committed approach curve | Close canyon walls; conceal incomplete distance |
| **340–870** | **Hero 1: left 180° banked hairpin** | Open a wide valley as the road turns; broad visible opposing escarpment |
| 930–1370 | Continuous right-hand canyon sweeper | Travel around a mountain spur rather than weaving among arbitrary cones |
| **1430–1970** | **Hero 2: right 180° banked hairpin** | Dramatic outer ledge, river and previous road glimpsed at a different elevation |
| 2050–2590 | One big S, no four-flick oscillation | Two adjacent cut slopes, then valley reveal |
| **2670–3230** | **Hero 3: high left 180° banked hairpin** | High plateau, far vistas, road below. Hero vista must fall into normal chase view |
| 3340–3900 | Long right sweeper | Open, breathable wide silhouette, still sustained steering |
| 4010–4560 | One large S across a steep descent | Near cliff then opposing wide canyon wall; use rock to hide incomplete backdrop |
| 4670–5590 | Two opposite long bends with one clear reversal | Progressive exit reward; no small jitter or kilometer-long straight |

**No new road tweaks until the scenery playtest reveals a concrete need.**

## Immediately move into Blender (next stage)

From updated `dev` on the local Windows machine, run:

```powershell
npm run art:roadlock
```

This exports `art-prototype/output/roadlock-road-reference.json` containing
the **exact full 5.65km game track** (10m samples), road-protection
coordinates (5m samples), and **nine fixed chase-camera positions** for
the three heroes. It DOES NOT build or overwrite the old 400m .blend.

### Codex/Blender brief: scenic graybox before polish

1. Use the exported centerline, height, banking and 14m-wide driving
   envelope as absolute constraints. **Track first, landscape second.**
   Reuse useful rock meshes from v2, but NEVER load the old GLB unchanged.
2. Build the complete route's **coarse** terrain in Blender:
   three distinctive large canyon basins/terraces around the three heroes,
   and mostly simple continuous rocky corridors in between. Keep the
   environment in world coordinates, considering adjacent switchback
   road levels together. Do not generate independent hills around each
   road segment that might overlap on hairpins.
3. Use close cliff walls and foreground ridges to hide incomplete terrain
   without colliding with the road or obstructing the player camera.
   Hero bends must be intentionally **open**, with distant mesas,
   height separation and some suggestion of valley depth.
4. Make the three hero compositions readable from normal chase cameras.
   A static screenshot that cannot see the payoff is a failed composition;
   move the art, NOT the camera/road. Start with nine 16:9 captures.
5. Before any stone details, bring a **local GLB art-only export** into the
   roadlock route (new toggle `&art=blender` if needed). Drive the entire
   route at normal speed and fix visible clipping, exposed voids and
   jarring scene joins. This is a single one-minute arcade level, not
   a realistic continent simulation.
6. Keep work on local `art-prototype/output/` and `dev`. Don't commit
   large GLB/blend/videos. Don't touch `main`; don't run CI unless the
   actual driving reveals a concrete failure.

**The output we need is an editable full-route .blend, art-only GLB,
nine hero viewpoint images and one continuous playable roadlock recording.**
Don't spend time adding more generative rules, new editor architecture or
realistic physics. The only success criterion is the driving experience
*with* terrain.

## Local full-route terrain handoff — 2026-11-03

The full-route graybox uses road revision `2c7c8d2` and the fresh
`npm run art:roadlock` export: 566 road frames, 1,131 protection frames and
nine original chase poses. The road, banking, four one-way white-marked lanes,
vehicle handling and chase-camera code were not edited.

Open `http://127.0.0.1:5173/?showcase=canyon&road=lock&art=blender` with
`npm run dev` running. Remove `&art=blender` for the road-only comparison.
The existing 400m v2 scene and its old Blender URL remain separate.

### Editable local assets

All large outputs stay ignored under `art-prototype/output/roadlock/`:

- `Grand_Canyon_Full_Route.blend`: editable full-route terrain, reference road,
  original nine cameras, materials, source JSON embedded as a text block.
- `canyon_roadlock_art.glb`: art only, 2,807,820 bytes; world translation zero,
  scale one, no corrective rotation. The reference road is excluded.
- `H1_Approach.png` through `H3_Exit.png`: nine offline Blender composition
  renders; the reference-only paint is simplified. Real gameplay captures below
  use the unchanged four-lane dashed white markings.
- `drive-H1_Approach.png`, `drive-H1_Reveal.png`, `drive-H1_Exit.png`;
  corresponding `drive-H2_*` and `drive-H3_*`: nine 1920×1080 gameplay captures.
- `Grand_Canyon_Full_Drive.webm`: continuous start-to-finish normal-chase drive.
- `driving-report.json`, `art-clearance.json`, `finalize.log`, `drive-final.log`:
  local driving, art-clearance and export evidence.

The GLB SHA-256 is
`3684F3D5E0330FE72E8E35C7BB32B39243FEDE8297DBDE2C192B397E660D0F4F`.
The scene contains a shared terrain mesh, a finite upper stone saddle, two river
meshes and nine deliberately placed large escarpment/mesa masses. No trees or
small-rock scattering were added. These are baked editable Blender meshes;
the local one-off mesh authoring record is not a runtime generation system.

Hero 1 has a lowered basin and southern opposing temple; Hero 2 uses an outer
river gorge, inner mountain spur and tall northern/western escarpments; Hero 3
looks towards the northern crown and distant tableland. The remaining route
uses the same connected slope field, with large exit rims and close cuts.

The road crosses itself twice in plan (around game distances 930/2,850m and
1,160/2,640m), with about 157m vertical separation. The shared lower terrain and
separate upper rock saddle preserve both levels rather than filling the lower
road with a solid mountain. Heights and coverage were adjusted in Blender;
the actual road was never moved to accommodate terrain.

### Integration and authoring workflow

The existing loader selects the new GLB only for `road=lock&art=blender`.
The local Vite/preview asset endpoint serves the ignored file without adding it
to `dist`. In that mode, the worker suppresses old placeholder scenery and
visible terrain/water/support meshes. Original asphalt, lane markings, rails,
shoulder contact meshes and collision behavior are retained. The original
shoulders remain invisible contact surfaces. Low cloud blobs that intersect
the high plateau views are hidden only in this mode.

After editing the saved scene, export existing art without rebuilding it:

```powershell
$env:BLENDER_BIN = 'C:\astra-dev\tools\blender-4.5.13-windows-x64\blender.exe'
& $env:BLENDER_BIN --background art-prototype/output/roadlock/Grand_Canyon_Full_Route.blend --python-exit-code 1 --python scripts/art-proto/export-roadlock-scene.py
```

Append `-- --render` to refresh the nine Blender renders. Edit collections
`10_EDIT_FULL_ROUTE_LANDSCAPE` and `20_EDIT_THREE_HERO_MASSING`; the `00` road
reference collection and `90` chase-camera collection remain authoritative.
Do not rerun the original `art:blockout` command over this scene.

### Verification scope and remaining visual limits

`npm run build` passed locally. No CI, unit-test suite, road redesign or new
procedural scenery system was run or added. The export helper was exercised
against the saved scene. An art-only clearance pass sampled all 1,131 exported
road frames at seven lateral positions (-10/-7/-3.5/0/3.5/7/10m), checking from
0.3m below pavement to 80m above: **7,917 samples, zero art intersections**.
This checks the new art against the locked road; it is not a new road audit or
an exhaustive geometric proof.

The recording uses real Chrome/WebGL and the normal RAF driving physics on the
local desktop. Automated steering/throttle/braking drives from game distance
350m to 6,000m, starting at rest, without teleporting between viewpoints.
This is a driving/visual capture, not human handling approval or a physical
phone performance result. Final measured results are recorded below.

The final desktop run completed all 5.65km in **89.89 seconds**. GLB fetch/parse
took **15.2ms**, ready time was **830ms**, and warm-run median / 5th-percentile
FPS were **60.0 / 59.99** (first ten 200ms samples excluded). There were zero
missing road frames, unsafe streaming frames, stalls or JavaScript errors;
maximum lateral offset was 0.51m. All nine hero captures were taken during this
continuous drive. The 1920×1080, 30fps WebM is 59,962,213 bytes and was opened
and decoded at its midpoint. `review.html` provides a local nine-image/video
gallery. The compiled local preview also returned the GLB with HTTP 200 and
entered normal play without browser errors. These are desktop results only.

This remains a coarse visual review candidate. The 34–36° banked pavement and
steep climbs occupy much of the fixed hero frames; the river is not reliably
readable at all nine stops. The first hero's rock saddle and some steep terrain
joins remain angular, and the three scenic peaks are not equally strong yet.
Blender lighting differs from the game's lighting/fog. The original road's
thin safety rails and turn signs can also read as floating above the reshaped
shoulders; their placement and collision were deliberately not changed.
Driving clearance is not a claim that polished canyon art or the visual
acceptance gate is complete.

## Final Attempt — 2026-11-03 — visual gate failed

This experiment produced a new editable scene and actual driving evidence,
but did **not** achieve the requested believable Grand Canyon experience.
No previous terrain geometry or GLB was loaded as its base. Fresh
`npm run art:roadlock` data from dev `a37f238` was the only geometric input.
The original four-lane road, banking, handling and chase camera remain intact.

### Local artifacts and inspection entry

All paths below are relative to ignored `art-prototype/output/`:

- `Grand_Canyon_Final_Attempt.blend`: editable newly constructed scene.
- `grand_canyon_final.glb`: art only, 1,892,404 bytes.
- `final-attempt/H{1,2,3}_{Approach,Reveal,Exit}.png`: nine 1920×1080
  Cycles renders using the exported original camera positions, targets and FOV.
- `final-attempt/drive-H{1,2,3}_{Approach,Reveal,Exit}.png`: actual gameplay.
- `final-attempt/Grand_Canyon_Final_Drive.webm`: continuous normal-chase drive.
- `final-attempt/review.html`: local Blender/game image and video gallery.
- `final-attempt/structure-check.json`, `driving-report.json`, `summary.json`:
  measurements and limitations, not aesthetic approval.

Run `npm run dev`, then open
`http://127.0.0.1:5173/?showcase=canyon&road=lock&art=blender`.
The loader uses original world coordinates, identity scale/rotation/translation,
and the existing scenery suppression. The GLB remains local and outside `dist`.
The original `?showcase=canyon&road=lock` comparison is unchanged.

Edit collections `10_FINAL_SHARED_TERRAIN`, `20_FINAL_ESCARPMENTS`, and
`30_FINAL_ROAD_SUPPORT`. The `00_LOCKED_REFERENCE_NO_EXPORT` road and
`90_ORIGINAL_CHASE_CAMERAS` are reference only. The .blend embeds the source
JSON and its SHA-256. The local one-off mesh-authoring and clearance scripts
are archived alongside the outputs; no runtime terrain system was added.

Export the edited scene without rebuilding it:

```powershell
$env:BLENDER_BIN = 'C:\astra-dev\tools\blender-4.5.13-windows-x64\blender.exe'
& $env:BLENDER_BIN --background art-prototype/output/Grand_Canyon_Final_Attempt.blend --python-exit-code 1 --python scripts/art-proto/export-final-scene.py
```

Append `-- --render` to refresh the nine static renders.

### Structural changes and remaining failures

The fresh mesh uses one shared constrained terrain surface around all road
levels, five connected escarpment masses, talus feet, and a low dry-wash/water
corridor. This avoids independently extruding overlapping hills along each
switchback. At the two XZ road crossings, the upper section uses a concrete
viaduct with banked crossheads and piers instead of a solid rock roof over the
lower road. Its approach was moved back to reduce the first hero's blocking
support mound. Abutment overlap fixes two measured support gaps (up to 3.67m).

Final sampled clearance: 1,131 road frames × seven lateral positions = 7,917
upward rays from 0.05m to 80m above pavement, zero art hits. Downward support
rays across five pavement offsets found no gaps above 1m; maximum was 0.201m.
This is a sampled check, not a watertight collision proof or a structural
engineering assessment. The bridge structure exists only as visual art.

Gate A remains failed. H1 is dominated by the upper viaduct and its support
forms rather than a readable deep valley. H2's main view is mostly banked
road and sky. H3 shows layered opposing rims, but they read as faceted walls,
not a convincing panoramic canyon. The other slopes are continuous but too
smooth and artificial. Large landform transitions and some shoulder shapes
remain angular. Existing signs and thin safety rails still look under-supported.
The river is not reliably visible. Blender lighting, shadowing and far clip
also differ from the game's fog/lighting, so game captures are authoritative.
The terminal view points toward an oversized distant cliff and reads like a
dead end; the finish composition is also failed, even though the playable
route reaches its existing finish without entering that cliff.

The current mesh-authoring approach did not deliver sufficient natural
sculpting or composition control under the fixed camera constraints. This is
an execution/artist-capability limit, not evidence that the road must change.
Integration and driving proceeded solely to deliver an inspectable failed
candidate. No extra decoration or increasing rule complexity was used to
claim an artistic pass. Further art iterations stop here per the brief.

Local `npm run build` passed. No CI or additional test suite was run. The full
drive uses automated steering/throttle/braking through the existing input
hook and real Chrome/WebGL/RAF physics, beginning at rest at 350m and ending
at 6,000m, with no intermediate teleports or camera changes. These are desktop
results; Pixel 8 performance and human handling approval were not measured.

The final recording is 89.876 seconds at 1920×1080, canvas-captured at 30fps.
GLB fetch/parse measured 10.9ms, startup ready 1.061s, with 56 art meshes and
69,602 triangles. Warm-run median / 5th-percentile FPS were 60.0 / 59.99
(first ten 200ms samples excluded). Across 5,395 driving frames: zero missing
road frames, unsafe streaming frames, stalls or browser errors; maximum
lateral deviation 0.489m. The video was decoded at seven points including
start and finish; all nine static/game images were inspected. This verifies
playability of the recorded run, not the failed scenic-quality requirements.

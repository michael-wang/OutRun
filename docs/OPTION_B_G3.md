# Option B G3 — local playable review

Issue #66 continues the accepted G1/G2 prototype directly on dev, version 0.10.33. This is **LOCAL-DEMO ONLY**: the public repository contains code, recipe and tests, not the private model or screenshots. No main release or deployment is authorized.

Run `npm run dev -- --port 5183 --strictPort` with the selected private GLB copied to `.local/option-b.glb`, then open `http://127.0.0.1:5183/?hero3d=1`. Omit the query for the unchanged default car. Missing/malformed assets retain the original car with a visible fallback notice.

## Changes and reference comparison

The three private G3 Page images were directly inspected as image bytes, including the white-game/red-concept comparison. The design calls for tapered dark tail-lamp housings, a central Coastal Highway Racing panel, a contoured diffuser and broad metal-framed exhaust openings. These replace the old FZR-123 plate/base and circular exhausts only in the Option B adapter. The new tail skin shares the existing paint material; rear LEDs share the running/brake controller. Five static material batches, including a single 512×128 generated brand texture, bound the rear assembly cost.

G2's four overlapping shoulder patches are absent. The new Blender derivative starts from preserved G1, deforms 3,239 existing source vertices into broader integrated quarter panels and relaxes their transition into the side. Wheel-cut boundary radius is .515m; the four G2 bronze five-spoke wheels retain their .46m radius, centers, pivots, steer and roll. This is source-surface editing, **not watertight retopology**. Small rough wheel-cut edges/gaps, sculpt asymmetry and rear/deck seams remain visible at closer side angles. The rear design is a prototype interpretation, not an exact reproduction of the concept.

An inward edge-extrusion trial produced stripes and a whole-surface voxel-remesh trial tore the open sculpt. Both were rejected after actual game inspection and remain private. The delivered recipe preserves the better original topology rather than shipping either failed trial. No new Shape or Paint inference was used.

## Camera and controls

Standard pad right-stick X (`axes[2]`) integrates a world-Y camera offset at up to 117 degrees/second, with a .18 dead zone. Release holds the angle; full 360-degree turns wrap continuously. L3 (`buttons[10]`) resets chase. Existing Touchpad-first photo routing remains: button 17 on an 18-button pad, otherwise R3/button 11. F8/UI photo and L1/R1 spectate remain unchanged.

Reset waits for right-stick neutral before accepting a new turn, preventing a held/stale axis from immediately undoing L3 or race restart.

Orbit uses the existing camera and rotates its eye/look offsets around the player, preserving follow radius and height without altering car yaw/physics. It works in ready/countdown/playing, suspends while paused/unfocused/disconnected or in inspection/spectate, and resets with the race. Standard chase remains 8m, 2.6m height and 76-degree horizontal FOV. Physical-controller and Pixel 8 acceptance remain UNKNOWN; browser gamepad mocks are explicitly identified as mocks.

## Private source and reproduction

```text
blender -b -P scripts/blender/refine_option_b_g3.py -- PRESERVED_G1.blend NEW_PRIVATE_DIRECTORY
```

The recipe requires G1 Blender SHA-256 `db70243ec4db7deed3ab531d9ce7b4b292c68a1eac97a44e75e34a5ddfc73fea`. Existing Blender 4.5.13 LTS was used. The locally selected derivative is `outrun-issue66-private/model-05` under the owner's temporary workspace. Runtime rear/glass/wheels are code-generated assemblies; the Blender file is the editable body source, not a falsely complete game scene.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Selected body GLB | 545876 | `01152cd6c938c2bf3298ba3ec18abcc1228e99db0ecae9f1f07a86a48ce6ab00` |
| Editable body Blender | 1834205 | `a990cfcd6d71d61952a400a5d17d7539eeab412c7d374dc3d3d7b6a483948a39` |

G1/G2, the original #62 outputs and prior failure evidence remain unchanged. Tencent/Hunyuan licensing still requires separate worldwide commercial-release review. Zero incremental service spend; requested reasoning Medium, applied UNKNOWN.

## Validation

Actual Chrome gameplay evidence remains private in `game-delivery`: red/white front, side and rear three-quarter; normal 8m chase; four orbit angles; left/right steering and gripping-hand views; wheel motion; dusk and QA-daylight lamp/brake combinations; pause/restart. The `g2-` lighting filename prefix comes from the reused test and does not denote old screenshots. Daylight is an explicit QA lighting override, not a new authored daytime stage.

The local browser suite covers default, valid Option B, missing and malformed asset paths plus launch/ready/recovery. Model-dependent camera/vehicle cases were rerun after selecting the final derivative. Full `verify:dev` includes build, scenic contracts and all retained unit tests. Detailed final counts and short PC render samples are recorded in the Issue handoff; they are not sustained FPS/device certification.

Selected GLB body: 27,998 triangles. Runtime Option B body/rear/glass/lamp assembly: 33,536 triangles, excluding the reused occupants/wheels. Comparable short Chrome samples at 1600×900, pixel ratio 1: default 371 draw calls / 524,974 scene triangles / 181 frames in 3005.7ms; G3 378 calls / 560,938 triangles / 180 frames in 3002.7ms. This is a roughly three-second local sample, not a long-run performance guarantee. Pixel 8 remains UNKNOWN.

# Stage content — R1 static prefab slice

Stage recipe: `content/stages/coast/scene.json`
Prefab registry: `content/prefabs/catalog.json`
Model: `public/assets/coast-props/r1-farmhouse.glb`

**Visual verification:** start the local Vite dev server and open `/?at=985&prefabdebug=1`. Choose 海濱公路. The upper-right Prefab QA panel shows the actual player distance, target distance (1085 m), load state and model path. A golden wireframe highlights the **loaded GLB**, and a floating `▼ GLB · 1085m` marker points to the exact farm house. No guessing which distant building is the target.

The QA overlay only runs in Vite development with `prefabdebug=1`; it is unavailable in production. Normal play and release assets are unchanged. The HUD rounds the course distance to tenths of a kilometre, so `0.9 km` means roughly 900 m, *not* the 1085 m prefab. For an ordinary unmarked view, use `/?at=985` or `/?at=850`.

- Change `prefabs['taiwan-farmhouse'].model` to any local compatible GLB path to swap the house, **without editing TypeScript**.
- Change `staticProps[0].roadDistance/lateral/yaw/scale` to move/rotate/resize it. Road distance is an **absolute** metre, not a segment-local parameter. Yaw is relative to the road direction, in radians; model entrance faces local -X.
- The `replaces` field hides the matching original Worker-generated house, avoiding doubled geometry. Its distance identifies the **old house** and stays unchanged when you move the new one.
- `src/content/static-props.ts` is a reusable static GLB loader using the current stage scene and disposal lifecycle. `src/content/coast-static-props.ts` supplies coast terrain height. Rendering, road and gameplay are unchanged.
- First GLB is a lightweight, original, hand-authored Taiwanese farm-house study (320 triangles, one material, vertex colors). It is deliberately a functionality proof, **not** the final hero scenery design.
- Optional GLB load errors log a warning and do not prevent starting the race. No dynamic collision or wind effect is implied by a static prefab.
- Later stages can use the same loader with different JSON data and a terrain height adapter; no new entity framework is needed.

R1 acceptance: current coast can be played and the prefab appears at the specified position. Test changing only the JSON model path or a placement coordinate, rebuilding, and inspecting the difference.

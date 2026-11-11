# Stage content — R1 static prefab slice

Stage recipe: `content/stages/coast/scene.json`
Prefab registry: `content/prefabs/catalog.json`
Model: `public/assets/coast-props/r1-farmhouse.glb`

**Try it:** open `/?at=850`, choose 海濱公路, press START, and inspect the small farmhouse at absolute road distance ~1085 m, inland/right at offset 45 m.

- Change `prefabs['taiwan-farmhouse'].model` to any local compatible GLB path to swap the house, **without editing TypeScript**.
- Change `staticProps[0].roadDistance/lateral/yaw/scale` to move/rotate/resize it. Road distance is an **absolute** metre, not a segment-local parameter. Yaw is relative to the road direction, in radians; model entrance faces local -X.
- The `replaces` field hides the matching original Worker-generated house, avoiding doubled geometry. Its distance identifies the **old house** and stays unchanged when you move the new one.
- `src/content/static-props.ts` is a reusable static GLB loader using the current stage scene and disposal lifecycle. `src/content/coast-static-props.ts` supplies coast terrain height. Rendering, road and gameplay are unchanged.
- First GLB is a lightweight, original, hand-authored Taiwanese farm-house study (320 triangles, one material, vertex colors). It is deliberately a functionality proof, **not** the final hero scenery design.
- Optional GLB load errors log a warning and do not prevent starting the race. No dynamic collision or wind effect is implied by a static prefab.
- Later stages can use the same loader with different JSON data and a terrain height adapter; no new entity framework is needed.

R1 acceptance: current coast can be played and the prefab appears at the specified position. Test changing only the JSON model path or a placement coordinate, rebuilding, and inspecting the difference.

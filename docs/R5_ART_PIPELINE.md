# R5 — Julia / Codex / owner collaboration and Blender asset pipeline

Status: **production plan only**, November 2026.

## Accountable roles

**Julia — product, art and technical director**

- Translate owner feedback into route beats, one-slice acceptance
  criteria and measurable visual/performance budgets.
- Choose which road, vista, terrain, collision and traffic elements
  are necessary; reject overengineered abstractions and inconsistent
  visual language.
- Maintain the GitHub design brief, review code/diffs and test
  evidence, and make code/data changes through available repo tools.
- Verify road/scene/Worker single-source coherence, owner-reported
  Pixel 8 visual quality, parallax and gameplay rhythm.
- Julia can edit the connected GitHub repo but cannot directly
  operate the owner's Windows-local Codex or Blender GUI in this
  environment; local execution requires a connected local agent.

**Codex — implementation and tools engineer on the local workstation**

- Hand-author/edit bounded road data and implement precise event
  eligibility/accident props in the existing data/streaming pipeline.
- Write and run local Blender Python/Geometry Nodes exporters,
  asset optimizers and scene assembly scripts as needed.
- Perform local builds, unit tests, deterministic traffic seeds,
  screenshot/video captures and GPU/CPU performance diagnostics
  **before** pushing to `dev`.
- Deliver short reproduction links: named lesson IDs and metres,
  test results, screenshots and reproducible commit hashes.
- Never independently publish the public release without
  owner authorization.

**Owner — player, taste and shipping authority**

- Drive PC and Pixel 8 builds; choose whether handling and spectacle
  are satisfying. Accept/reject small slices with specific in-game
  distance and seed when useful.
- Make final trade-offs on sightlines, car feel and art quality;
  explicitly approve any `main` release.

## Map construction — do not mix these two responsibilities

### Stage logic: the **single authored road-space truth**

One finite road/path definition is sampled identically by gameplay,
opponents, physics, Worker geometry, terrain alignment, decorations
and road-relative prop placement. If curves are edited in Blender,
Codex must **export back to that shared source**. Do not allow a
separately modeled Blender asphalt mesh to disagree with the driving
surface and collision geometry.

### Scenic production: Blender as an **offline DCC tool**

Proposed practical route:

1. Draw/place the authored road whitebox and test drive it at speed.
2. Lock a candidate geometry snapshot; mark hero views, visible
   terrain silhouette and near/mid/far depth zones in world space.
3. Use Blender 5.3 modeling, Geometry Nodes, procedural scattering
   and reusable prefab authoring for rock walls, cliffs, settlements,
   bridges, forests and static props.
4. Export optimized **glTF/GLB meshes**, compact textures, appropriate
   LODs, instanced repeated props, explicit placement transforms.
   Prefer per-chunk or bounded groups to one enormous unstreamable
   stage object. Never make decorative mesh the road collision source.
5. Integrate with the existing Three.js `WebGLRenderer` and finite
   scene streamer; test occlusion, silhouettes and **moving parallax**,
   then PC/Pixel 8 frame-time and memory.
6. Iterate locally; change the road only if owner driving feedback
   proves a geometry problem. Otherwise iterate scenery independently.

## Blender 5.3 Gaussian Splatting: allowed experiment, not a dependency

Blender 5.3 (official initial release 2026-11-10) natively imports
3D Gaussian Splats from PLY/SPZ (and glTF input) and can edit them via
point clouds / Geometry Nodes and render in Workbench, EEVEE and Cycles.
This is useful for highly irregular, **static captured scenes** and
as a **reference or offline art-authoring** source. It does NOT
automatically turn a captured set of points into lightweight,
rigid mesh colliders or classic glTF game objects. Blender's initial
5.3 splat support does not provide a general native export workflow
equivalent to exporting scene meshes as ordinary GLBs.

Our current engine relies on `THREE.WebGLRenderer`, whereas the
official Three.js `GaussianSplat` object requires
`WebGPURenderer` (its own forced WebGL backend is distinct from the
old `WebGLRenderer`). Third-party WebGL2 splat renderers exist,
but introducing one requires integration and real Pixel 8 testing.

Don't conflate Blender render-time performance with the workload of
a WebGL2 mobile browser. Gaussian splats can be expensive from
transparency overdraw, sorting, memory and network transfer.
Collision and animated foliage still need simpler geometry/effects.

**Decision:** use Blender's mesh/Geometry Nodes/glTF workflow for
the first playable map. Optionally evaluate **one bounded, distant,
non-colliding scenic feature** with Gaussian Splats after the whitebox
and performance budget are stable; compare against a regular GLB
under identical mobile conditions. No renderer migration for R5a.

Official references:
- https://www.blender.org/press/blender-5-3-release/
- https://www.blender.org/download/releases/5-3/
- https://developer.blender.org/docs/release_notes/5.3/rendering/
- https://threejs.org/docs/pages/GaussianSplat.html
- https://developer.playcanvas.com/user-manual/gaussian-splatting/building/performance/

## Quality gates

1. **Whitebox:** road safety, learnable flow, no surprise impossible
   event, reproducible seed, visible lesson markers.
2. **Hero scene:** credible world-space distances, camera parallax,
   large readable composition at 200–300 km/h.
3. **Asset budget:** Pixel 8 FPS, no large shader compile stutter
   mid-race, bounded streaming memory, sensible LOD and texture sizes.
4. **Production:** locally `npm run verify:dev`; `dev` pushes should
   not launch a full deploy; public `main` needs owner approval.

R5 map should not require Gaussian Splats, a giant procedural
world-generator or a new rendering engine in order to look beautiful.

## R5a implemented offline road-guide interchange

We added the first **Geometry Nodes authoring bridge**, without
bundling Blender or its output into the Three.js game.

1. Run `npm run r5:road-guide`. This uses Vite SSR to call the
   **same** `coastWorkerRoad().track.sample()` as the game and Worker.
   It exports A0–A3 points, bank angle, road width and lesson IDs to
   `art-prototype/output/r5-road-guide.json` (ignored by Git).
2. With Blender installed locally, run:
   `blender -b --python scripts/blender/r5_guides.py -- art-prototype/output/r5-road-guide.json art-prototype/output/r5-road-guide.blend`.
   The script converts Three.js Y-up into Blender Z-up, creates
   centerline and shoulder guide curves, and adds a minimal
   **Geometry Nodes rock-scatter preview** along the inland verge.
3. These are reference curves and non-colliding rock proxies, **not
   runtime road geometry or production scenery**. Do not export
   the preview as the playable road, and do not take the placeholder
   rock surface as a final art style.
4. Once R5a road shape is accepted, use these guides for one
   well-chosen material/geometry prototype with realistic PBR textures
   and mobile LOD. Then measure Pixel 8 before scaling up.

Neither Blender nor GPU-heavy splatting is required for road whitebox.
The importer is currently a source-level integration artifact; it
needs local Blender execution before considering the GN step verified.

## New map lighting acceptance: avoid 1D depth shortcuts

The old lamp atlas uses world Z as a one-dimensional nearest-fixture
lookup. Longer, sharper curves can bring two lights within the same
projected 38m range; one atlas cell cannot represent both sources.
World-XZ overlap on winding roads can also pick physically distant
fixtures that happen to share a Z coordinate. New-map scenic/night
lighting should evaluate a proper spatial or road-relative lookup
before locking lamp placements. Keep the Pixel 8 shadow/GPU budget;
do not solve this by scattering hundreds of live point lights.

## First drift whitebox before high-cost scenery

The two R5b drift corners have been authored in the same
finite road source as A0–A3. Run and review them through
the chase camera **before** designing accident setpieces,
roadside collision meshes or new Geometry Nodes cliffs.
Do not let the Blender road guide become a second source
of collision geometry. A future art pass must also preserve
the visible S crossover and corner sightlines at speed.

### R5b extension

The road-guide export now covers **350–6760m**, including both
drift bends, their recovery straight and the new immediate S
transition. The Geometry Nodes prototype remains purely offline
and never overrides the game's real road, barriers or collisions.

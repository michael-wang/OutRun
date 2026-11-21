# Coastal Highway — Hair motion technology review / technical decision R0
> **Owner R6 override (2026-11-14): retry Spring Bones as a full artistic implementation, not a strict identical-geometry 979-triangle B test.** The Issue #43 B result remains technically valid but did NOT test independently optimized *medium-to-tip weights, tapered strands, richer cabin turbulence and 1.0-size characters together*. Spring B may now be tuned differently to maximize beauty, with real Pixel 8 profiling, in the single [Issue #45](https://github.com/michael-wang/OutRun/issues/45) integrated playable pass. This supersedes the earlier postmortem's instruction to hold Spring Bones until a separate A-only art gate. Full construction specification: [R6](COAST_HEROINE_R6_INTEGRATED_PASS.md).

Date: 2026-11-14
Decision owner: Julia + gameplay owner. Status: research/architecture recommendation only; no runtime benchmark completed, and no new 3D model produced here.

## Postmortem — Issue #43 completed 2026-11-14 (supersedes speculative preference below)

**Measured decision: DO NOT adopt the current Spring Bone B.** Codex's [exact A/B report](art-review/hair-spring-ab/README.md) and owner-uploaded 13.3s near-camera video confirm the physics is functional, but the normal game chase view does not show a meaningful beauty/readability advantage. The earlier line "Spring Bones preferred experiment" below describes the hypothesis *before it was tested*, not a production mandate.

- Identical A/B: **979 triangles / 709 vertices**, one opaque material, six tip chains in B (19 bones / 12 active joints), same camera/lighting/inputs. The 979-tri proxy came from an earlier **12,000-triangle accepted hair study**; it is not a proof that 979 is the artistic sweet spot. Both variants also shared a modest 42% local narrowing of the tip region, so the narrowing cannot be credited to Spring Bones.
- PC sampled B about **+0.29ms CPU per 60Hz frame** (two 120Hz sim steps), GPU effectively similar; Pixel 8 never measured. B **max local displacement 6.58cm**, smaller than A **9.38cm**. That indicates a conservative visible outcome, but by itself does not establish wrong spring stiffness/weight placement.
- The spring affected six short side/nape tip regions. **Unknown from report:** exact skin-weight influence across root/mid/tip, local stiffness/drag per joint and how much wind turbulence reaches each chain. Don't diagnose the precise rig failure or mandate wider root movement without inspecting the saved `.blend` / controller.
- At **8m / 960×540**, the model's blonde hair spans only around **20–30 pixels**. Subpixel individual fibers will vanish or shimmer. The accepted 2D concept uses **large flowing main locks plus a few slender tapered end silhouettes, layered value/gold highlights, and varied timing**, not the physical simulation of every fiber.
- **New artistic direction:** stabilize crown and most swept bangs; redesign a small number of *mid-to-end* feathered locks with visibly tapered tips and separated arcs; ensure any shape-induced movement is readable at chase size; use highlights/secondary tone to suggest delicacy, without overdraw/transparency. Only then compare motion options.
- A damped spring under a strictly constant speed-relative wind tends toward equilibrium. **Continuous highway flutter needs small, changing gust/turbulence inputs**, even if springs are physically sound. Existing `flutterPhase` provides such a signal, but its effective strength and phase dispersion were not validated from the report. If another targeted motion test becomes warranted, inspect this before adding bones.

**Follow-up:** one **geometry-and-value-first** art check, *with the existing Morph A*, before any additional spring solver work. If it is beautiful and reads at chase size, keep A. Only if its timing is still convincingly deficient consider testing the SAME improved mesh under both physics controllers. No full cloth solver. Preserve Codex quota and NT$0 service cost.

## User's question and bottom line

The owner asks whether natural wind-blown heroine hair should behave like a soft cloth rather than be hand-authored by moving specific vertices. **Yes about the secondary-motion physics; no to a full cloth solver for this short, thick, stylized blonde bob.**

Recommendation for Pixel 8 / Three.js WebGL:
**lightweight Blender-authored hair clumps + small 2–3-joint Spring Bone / Verlet chains + GPU skinning**, with the existing game wind and turning values as driving forces; use **optional tiny shader flutter only later** if truly needed. This matches the character's recognizable layered bob, responds automatically to left/right cornering and future side-facing rival shouts, and does not require CPU iteration over every rendered vertex each frame.

A purely scripted morph target is not "CPU pushing every vertex" at runtime. Our current `hero-groom.ts` precomputes morph displacements and moves instanced locks; per-frame CPU updates are small. The **limitation** is that its movement is predefined by morph/rotation formulas, not physically responding with coupled inertia/collisions. Switching to springs is an **art/behavior improvement hypothesis**, not an automatic promise of higher FPS.

## Options for THIS asset

| Method | Dynamic reaction | Setup & runtime budget | Decision |
| --- | --- | --- | --- |
| Manual/prebaked Shape Keys (current 5-key hair proxy) | Smooth but limited to authored deformations; little true collision/tail coupling | Very simple runtime; multiple morph attributes increase memory/bandwidth | **Baseline**, keep for comparison or faces |
| **Spring Bones + Verlet / position constraints** | Root anchored; tip naturally lags, returns, turns independently, can collide with spheres/capsules | Only a handful of bones simulated CPU-side; mesh follows via glTF skinning | **Preferred experiment** |
| Full cloth / XPBD mesh on complete short hairstyle | More degrees of freedom, collision and folds | Significantly more state/solver/mesh work; harder tuning & determinism | **Not for R0** |
| Pure vertex shader wind bend | Cheap high-frequency motion | Shape-only response not inherently inertial/collision aware; material pipeline cost | Later optional micro-flutter; not primary |
| Offline Blender cloth/hair physics bake | Great offline lookdev or scripted sequence | Baked animation does not automatically respond to live speed, turning, head rotation | Reference/benchmark, not gameplay solver |

Source grounding:
- VRM 1.0 Spring Bone standard explicitly targets hair/costume inertia, stiffness, drag, gravity and sphere/capsule collision. Algorithm section illustrates Verlet integration: https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_springBone-1.0/README.md
- Pixiv has a small MIT package **@pixiv/three-vrm-springbone**, separate from full VRM avatar runtime. API exposes VRMSpringBoneManager, VRMSpringBoneJoint and colliders, including reset()/setInitState()/update(delta). Propose testing **package only**, NOT migrating the game or model to VRM: https://pixiv.github.io/three-vrm/docs/modules/three-vrm-springbone.html and https://www.npmjs.com/package/@pixiv/three-vrm-springbone
- Three.js SkinnedMesh uses bone indices/weights and Skeleton; Blender exports bone transforms and Shape Keys as glTF: https://github.com/mrdoob/three.js/blob/dev/docs/pages/SkinnedMesh.html.md and https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html
- VRM notes model scale can change effective spring behavior; our passenger is currently scaled to 0.84, so check scaling and collider radii, and avoid vehicle-world translation creating giant hair forces: https://pixiv.github.io/three-vrm/docs/documents/spring-bones-on-scaled-models.html
- Blender experimental XPBD nodes are intended for cloth/hair but Blender simulations are authoring-time, not magically exported as real-time game physics: https://developer.blender.org/docs/features/nodes/xpbd_simulation/

## How it would work in OutRun (small composition, no engine refactor)

**Asset:** preserve the approved bob crown/hairline as rigid (or nearly rigid) and form approximately **4–8 side/back clumps** in a lighter mesh. Rig a **short chain of about 2–3 joints per clump**, roots pinned; weight-paint gradient to each tip. These are INITIAL ART AUTHORING SUGGESTIONS, not measured limits. Hair can be one opaque SkinnedMesh/one or two shared materials and a few colliders near neck/ear/shoulder. Do not animate the current 1.48M triangle sculpture or add the 12k-triangle proxy unmeasured to a car whose earlier whole-model budget was ~14k.

**Physics:** on the CPU update *only spring joint state*, preferably fixed timestep/substeps with clamped dt and deterministic damping; don't iterate whole mesh vertices. Spring/Bone rotations control GPU skinning by Three.js. A meaningful implementation must also model **directional airflow**: at 300 km/h a fully physical aerodynamic force would look absurd, so use saturated, stylized speed-relative backward force (car/head local frame) plus the existing measured lateral acceleration and tip lag. Head rotation and subsequent turn/shout should reposition the roots; tips lag in spring coordinates. Set colliders in the passenger head/neck local hierarchy. Be careful not to double-count apparent inertia from the entire car's rapid forward world translation; use the center/head-relative spring-space strategy or explicitly compensate, then inject controlled wind. No one-off random per-vertex noise.

**Runtime integration:** preserve `src/occupants.ts` as owner of `wind`, `sway`, `tipSway`, `flutterPhase`, with an adapter for a SpringBone hair controller. Avoid replacing the vehicle, physics, passenger gestures, scene wind or AI. Keep existing parametric hair as working fallback until an owner-approved GLB hair version exists. Reset springs on race restart/checkpoint teleport and while paused; avoid one-frame exploded locks. Preload once, dispose cleanly, no per-frame mesh allocation. Check collision and camera frustum bounds for moving SkinnedMesh.

## Cheapest credible A/B (Codex quota protection)

Do **not** redesign, retopologize the whole face or rewrite issue #42 implementation mid-flight. Before committing to a new rig, perform **one isolated proof**, ideally using the SAME simple accepted proxy:

A. Existing morph-target path with tuned wind amplitude.
B. 4–8 hair clumps with a few deform bones + spring solver (test @pixiv/three-vrm-springbone MIT package only; if integration too cumbersome, stop and report, do NOT port full VRM system).

Match **geometry resolution, shading, chase camera, input velocity/turn curve, same test fixture**. Show side-by-side *short* clips at 0 / 120 / 280–300 km/h, left and right curve, fast deceleration, rapid head turn. Need to inspect subtle movement at **real chase size** on Pixel 8 (or PC 960×540 proxy initially), not close-ups alone. Measure draw calls, triangles, GLB size, GPU/CPU frame time where possible, source complexity and collision/pop/clipping. Pick the simpler solution that *actually looks better*: keep current morphs if bone solver adds cost without visible value.

**Gate:** If spring-bone A/B is favorable and small, adopt it for Issue #42's game integration. If Codex already began integration with the 5 Shape Keys, finish a bounded baseline first and schedule one switch experiment rather than throwing away working code. Don't let implementation turn into full-body character or hair physics engine.

## Release cautions

Hunyuan3D-2.1-generated reference mesh remains R&D; its community license/region restrictions still need review before international distribution. `@pixiv/three-vrm-springbone` MIT code has different terms from the generated character. No paid tools, no main promotion without owner approval.

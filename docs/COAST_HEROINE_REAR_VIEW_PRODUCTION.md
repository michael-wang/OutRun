# Coastal Highway — Heroine race-view pipeline / rear hair design (R0)
Date: 2026-11-14
Status: Owner accepts the current **colored Hunyuan3D-2.1 heroine as lookdev base**, not a game-ready asset. Next milestone is **back-of-head readability + natural wind movement**, not facial polish.

## Visual director's decision

The normal arcade chase camera shows the passenger's short **blonde back/side hair, shoulder and upper back** for most of the race. This is the art composition with the highest visual exposure. Priorities:
1. Preserve the accepted beautiful 3D hairstyle's broad swept asymmetric crown + back/side silhouette under motion.
2. Make a few grouped locks respond to **speed and cornering** without looking like a soft rubber helmet, cloth ribbon or thin transparency cards.
3. Build a lightweight exportable candidate capable of mobile rendering; the current **~1,478,414 triangle single connected sculpt** is a modeling/high-poly reference, not a runtime mesh.
4. Facial micro-detail, eye/eyebrow hardness, slightly too straight nose and too sharp jaw are intentionally deferred. The front-facing photo/final hero mesh remains a later pass.

The current locally held source reported by Codex:
- `C:/astra-dev/tools/outrun-h1ar3d/heroine-candidate.blend` — original neutral sculpt.
- `C:/astra-dev/tools/outrun-h1ar3d/heroine-color-study.blend` — first accepted color study.
- `C:/astra-dev/tools/outrun-h1ar3d/heroine-candidate.glb` — high-density candidate, **not** mobile-ready.
Confirm exact existence before use. Large source files and model weights stay outside the tracked OutRun repo.
Canonical 2D appearance: `docs/art-review/h1ar/README.md`. Primary game aesthetic: `art/reference/coast/03_STYLE_B_coastal_highway.png`.

## New pipeline: two separate passes, no full-game work in Pass A

### Pass A — prove moving hair *in Blender*, with a lightweight proxy (next Codex ticket)

A1. Keep the colored original unchanged and duplicate to an ignored local `heroine-hair-motion-study.blend`. Establish practical hair masks / vertex groups on the **existing high-poly mesh**. Determine whether blonde hair is fused to scalp/skin, and how to isolate control areas without ripping face/earring or hairline surfaces. Report actual topology, do not assume separate material = separate mesh.

A2. Make a **small game-friendly hair proxy** based on the existing sculpt's silhouette, not a new TS/procedural hairstyle. Favor:
- **Stationary crown, hairline and most of swept bangs** anchored to the head.
- **4–8 broad locks** along outer sides/nape/back of the bob with roots fixed to the crown and tips deformable.
- A few bones or shape keys/morph targets with soft root weights; choose whichever best preserves the design and exports cleanly to glTF. Preserve flowing thickness and end taper, minimize clipping through collar, bare shoulders, ear/earrings and seat.
- Treat material groups simply (blonde root color and warm golden highlights) and omit alpha haircards/independent particle or cloth simulation. No per-frame deformation of the original 1.48M geometry, no new runtime physics engine.

A3. Create one **Blender animated proof** using the actual proxy, not a composited/video-only effect:
- stationary/0 km/h: hair relaxed, iconic layered bob silhouette;
- ~100–120 km/h straight: outer ends lean gently backward with minor asynchronous flutter;
- ~240–300 km/h straight: stronger controlled backward sweep, anchored crown still recognizable; don't turn all hair horizontal;
- sustained left/right corner: asymmetric wind/inertial lag; roots lead, tips follow with a small release delay.
- Include acceleration and deceleration/recovery, no abrupt snapping or clipping.
- Test **rear chase-equivalent angle first**, then rear three-quarter and side. A frontal face render is a supporting check only.

A4. Existing gameplay already computes speed/rate and lateral-force-driven wind data in `src/occupants.ts`: `wind`, `sway`, `tipSway`, `flutterPhase`, and calls `hair.sync(wind,sway,tipSway,phase)`. The current procedural hairstyle in `src/hero-groom.ts` already uses geometry morphs + instance transform for locks. **The proof should establish compatible control meanings** and rough bone/morph naming (`crown`, `backLocks`, `sideLocks`) so later GLB can receive those values. Do not duplicate the movement controller or modify the game in Pass A. Hair motion should be predominantly caused by speed-relative air, with existing lateral inertia / shared environmental wind as a secondary influence; direction depends on head/car pose, not a global fixed XYZ axis.

A5. Produce real Blender orthographic/reproducible video or GIF of back camera at 0 / 120 / 280 km/h and left/right turn, with at least one side/rear three-quarter example. Include rest and moving silhouettes, concise data (separate proxy meshes / bones / shape keys / triangles / materials / approximate GLB size). No stock/AI animation substitutions. Try one bounded prototype, then STOP for Julia and owner.

### Pass B — *after* owner accepts moving rear silhouette

B1. Make a game-ready **head/upper-body proxy + hair**, with controlled retopology/decimation + baked/transfered color/normal detail as required. Preserve approved rear silhouette, eye color/hair shading. Avoid collapsing lid/lip detail and hair roots. Need not replicate all high-poly detail visible only in static portrait. Report triangles, materials, texture memory and GLB total; **benchmark before choosing a fixed triangle budget**, because current Riviera with old head/occupants already has an about-14k-triangle unit guardrail. The new part must replace—not render alongside—the old head/hair.

B2. Verify actual GLB import/export preserves materials and any morph/skin animation; Blender's exporter and Three.js GLTFLoader support glTF animation and shape keys but each specific asset must be tested. Start with an isolated local glTF viewer before touching the playable car. The `.blend` source is authoritative; GLB is runtime delivery.

B3. Add the head/hair to the existing left-drive Riviera 62, using existing `src/occupants.ts` outputs and accepted gestures/seat positions; do not reimplement steering, passenger waving, vehicle or world physics. Check existing `src/car.ts` is synchronous; preload once where appropriate rather than downloading per car/frame. Don't spawn the complete high-poly bust/legs during driving.

B4. Pixel 8 drive test at fixed seed: stationary, speed transitions, ~280–300km/h straight, sustained L/R bends, acceleration release. Compare visible **rear and side hairstyle**, clipping, shader warm-up/stream stalls, draw calls, GPU/CPU frame time/percentiles, retained memory, and existing game FPS baseline. Test load/restart/disposal. Do not alter game-wide shadow/map settings to mask new head cost.

## Additional requirement (owner): directional overtake shout, LEFT and RIGHT (future)

The owner wants the blonde passenger to **turn and shout at a car being overtaken on whichever side it occupies**. This should be treated as a defining personality animation, not a facial close-up accessory. The art is intended to be read from the actual third-person chase camera: upper back and shoulders, head/neck turn, expressive open mouth, and hair's inertia.

**This does not broaden Pass A into gameplay work.** While authoring hair controls, ensure we do not lock the head to the torso or make side-turns destroy the hair. Keep a usable neck/head yaw pivot, modest upper-body twist/shoulder pose, independent side/back locks; check that the visible swept bob retains silhouette when the head glances left and right. A quick ± head-turn pose while previewing hair is useful *if it fits the existing bounded hair study*, but full gesture/voice/trigger is a later task.

Later runtime integration: [directional overtake reaction plan](COAST_HEROINE_OVERTAKE_REACTION.md). **Do not** change `RivalOvertakes` scoring or implement the event in Pass A. A final pass is recognized only at longitudinal clearance, which is later than the desired side-by-side moment; the animation should start while beside an actually closing opponent, with cooldown, independent from score/rank and with correct lateral side.

## Art acceptance / stopping conditions

- **Primary goal:** normal follow-camera back hair silhouette and dynamic movement. The owner should recognize the same heroine even while moving at 300 km/h.
- Natural staggered hair movement from **grouped clumps**, not artificial noodle sway. Stable roots and tips lag; no tremor/strobe and no clipping through collar/earrings/shoulder.
- Character face/color must not deteriorate materially from first accepted color study; can defer tiny nose/chin/eyebrow corrections.
- Zero additional paid AI services, generated models, assets, licenses or clouds. Do not assume Hunyuan3D-2.1-generated assets are cleared for worldwide shipping: current community license needs a separate legal/distribution resolution. Keep this R&D offline and do not publish `main`.
- Pass A should be short and evidence-based. If the high-poly hair cannot be separated, make a low-poly approximation from its silhouette and report the limitation, **do not** develop a huge automatic segmentation or rigging framework.
- If Pass A animation/art fails, do not invest in full retopology or game integration; fix art once, or revert to accepted simpler hairstyle before scaling.

References: `docs/COAST_CHARACTER_ZERO_COST_3D_PIPELINE.md`, `docs/COAST_CHARACTER_ASSET_STRATEGY.md`, `docs/COAST_ART_BIBLE.md`, [Blender glTF export](https://docs.blender.org/manual/en/5.0/addons/import_export/scene_gltf2.html), [Three.js Animation System](https://threejs.org/manual/pages/animation-system.html).

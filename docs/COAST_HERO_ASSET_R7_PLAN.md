# OutRun R7+ — Hero occupants first, then Riviera 62 (art director's plan)
Date: 2026-11-14. Status: OWNER requests **stop blonde hair art and move on**. This is a roadmap/acceptance contract, **NOT a request for automatic multi-week Codex background work**.

## Frozen constraints

- Blonde hair: **R6d / v0.10.23 exact appearance** `public/assets/characters/coast-blonde-r6d.glb`, **WILD wind for DEV beauty review**, 1.0 person scale, existing head/seat pivots and 8m chase camera. R6e was merely proposed, R6f and R6g were explored but visually rejected. Do not re-author hair or add detail to it.
- **Performance remains a release blocker**: one R6 Pixel 8 run declined 22.87 → 18.05 FPS with spring/skin. Do not claim mobile release-ready; once characters/car settle, profile actual Pixel 8 at same seed and distinguish hair CPU, scene GPU and cold-start cost. Avoid pre-emptive rewrite during the art gates.
- Previously approved heroine **face identity** is the explicit blond woman front/45°/profile sheet `docs/art-review/h1ar/README.md`, **NOT** the R6g multi-view hair experiment. Avoid a generic new face. Classic cartoon-inspired coastal world Style Option B remains overall art direction.
- Same recognizable young Asian male driver with layered dark hair and suit, left driving position and one arm resting at the door as applicable. Do NOT design the man as the woman's recolour or a plastic mannequin.
- NT$0 additional spend; local Blender/RTX 5070 Ti source assets belong outside tracked repo, with small render reviews and optimized runtime GLB committed to dev if needed. License of the Hunyuan3D-derived sculpt must be reviewed before global release.

## Milestone R7A — female passenger approved head + shoulders/upper body

**Present code:** `src/passenger-face.ts` still builds a mathematical/Three.js facial mesh rejected as hero portrait; `src/hero-tailoring.ts` and `src/car.ts` construct simplified torso, arms and clothing. The previously generated real editable Blender 3D source (colored bust) exists on owner's Windows PC (reported `C:/astra-dev/tools/outrun-h1ar3d/heroine-color-study.blend`). The sculpt is a high-poly art master, not a game mesh; do not import it at 1.48 million triangles.

1. Inspect the actually available local sculpt and current 1.0 seated body; produce one **real Blender color/light turntable** from front / 45° / profile / rear + a single chase camera test. Check approved design's eyes, nose/chin, cheeks, expression, shoulders, ivory halter dress, gold earrings, seat fit and approved R6d hair integration.
2. Make a **lightweight head/neck/upper-body gameplay GLB** from accepted sculpt/color if the model visually fits; include simple expressive mouth and head/neck pivot needed for future two-sided playful overtaking call-out. The face must not come from new TS sphere/eyeball formulas. Keep R6d hair as **independent** existing runtime asset; don't bake the old large hair sculpt on top. Body torso and arms may remain existing code temporarily if this gives a better art gate; don't replace the cockpit architecture without proof.
3. Front/45/profile + normal rear chase and cockpit screenshots. Owner/Julia must accept face/identity before switching player rendering by default. Check hands/arms, dress overlap with door and seat, reset/pause/pose. Record draw calls/triangles/asset load. Stop after one character; no giant animation system.

## Milestone R7B — male driver real 3D identity, head + upper torso

1. First **approve a distinct front/45/profile male character concept** in the same palette and level of stylization. Use current Style Option B male inspiration, but model actual approved human facial anatomy (not generic procedural heads). His profile needs longer layered dark hair (appropriate sculpted clumps), suit collar, shoulders and hands on wheel/door.
2. Produce an editable real Blender source and mobile-optimized race variant. Reuse **the character-presentation interfaces/loader** proven by R7A instead of creating a second character engine; distinct identity/face geometry, shared pipeline. No need to make the male hair use the same Spring system until there is a visible need.
3. Audit side by side with heroine under same camera and sunset light. Ensure they visually belong to the same game and fit correctly in seats when turning/celebrating. The front/cockpit camera is important for eventual in-game photo, but no immediate need for full lower-body or standing portrait.

## Milestone R8 — Riviera 62 hero car (AFTER occupants)

Riviera 62 is already playable as a custom 3D car constructed with `src/hero-classic-geometry.ts`, `src/hero-body.ts`, `src/hero-tailoring.ts`, `src/car.ts`. **Do not discard an accepted functional car by default.** Aesthetic look/physical plausibility should be reviewed *with both improved occupants seated*.

1. Same in-game dusk light + chase/side/front3/4/rear3/4/cockpit captures. Diagnose highest-impact deficiencies: exterior silhouette/stance, oversized/small mirror and taillight details, paint clearcoat, front/rear lamps, wheels/brakes/stance, windshield, dash and leather seats/door trim. Choose only top 2–3 issues.
2. Improve chassis/exterior using existing modular geometry or a new Blender GLB only if side-by-side proves it substantially better; preserve **Riviera 62** identity, red/pure-white paints, FZR-123 plate, left drive, wheelbase, collision and camera anchors, 6-speed handling, sparks/audio/traffic interaction.
3. Race acceptance at 0/120/300, side rivals, wet sunset highlights and phone FPS; color switching, wheel animation, exhaust/hud all remain. Do not redesign racing rules, roads or coast props.
4. Only then consider optional full-body/standing portraits or photo sequences from the same character masters, NOT as prerequisites to finishing the hero car.

## Working practices

One local Codex task per art gate, 1–2 comparison clips and exact verified model exports, not an enormous one-shot "redo all characters and car." Julia is product/art/tech director; owner accepts appearance and driving, Codex performs local 3D and QA. In-game artwork and style quality matter more than the number of green unit tests. No `main` or external paid service without explicit owner approval.

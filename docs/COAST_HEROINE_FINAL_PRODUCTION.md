# R7H — 女主角最終角色製作規格 / Heroine Completion Contract

**Owner correction, 2026-11-15 / v0.10.29:** the newer supplied half-open-back reference supersedes the waist-level deep back opening in the original brief below. Keep shoulders and upper back exposed, but raise the continuous ivory dress back panel to below the shoulder blades and fully cover the lower back. No diagonal straps. Preserve the character, hair, animation and gameplay. See [garment correction review](art-review/r7h-coverage/README.md).
Date: 2026-11-15
Status: **OWNER APPROVED — ready for Codex local Blender + game implementation.**
Goal: finish one lovable, expressive heroine who truly belongs in Coastal Highway Racing. This is a character production milestone, **not another concept generation / hair experiment**.

## Art references & precedence

1. **FACE identity is frozen**: original owner-approved front / 45 / profile design in `docs/art-review/h1ar/README.md`. The current R7A in-game face is a functional but visibly imperfect first 3D match, not permission to redesign her identity.
2. **HAIR is frozen**: exact R6d runtime asset `public/assets/characters/coast-blonde-r6d.glb`; **wild DEV** wind and existing Spring Bone motion, character scale 1.0 and 8m rear chase camera. Do not regenerate, recolor, re-rig or resculpt the hair. Hair can follow the head during poses through the existing pivot.
3. **BODY / CLOTHING / ANIMATION**: the *most recent* full-body / backless halter / rear gameplay pose concept design created in the ChatGPT collaboration on 2026-11-15 (reference package supplied separately to owner: `OutRun_R7_Heroine_Final_Design_and_Pose_Reference.zip`). It has (i) full-body front / three-quarter / side / back, (ii) open back with no straps down the back, (iii) rear-facing game-like gestures. Latest outfit design supersedes any R7A placeholder straps and old dress patterns. Visual labels on generated images can be wrong about left/right; **the explicit coordinate contract below wins**.
4. **Whole world:** Style Option B stylized sunset roadster, gold/ivory highlights; do not move to photo-real skin / cloth.

If Codex cannot see the reference package in its Windows local workspace, do NOT invent its image contents; ask owner to supply the ZIP, then save it locally outside heavy tracked assets. Images are visual targets, not precise skeletal topology or license grants.

## 1. Approved complete costume / identity

- Friendly, confident, lively blonde woman; approved eye / cheeks / smile, gold geometric diamond earrings.
- **Ivory/soft pearl WHITE halter-neck backless wrap MINI DRESS**: front halter/cross-over at neck with tasteful knot; side waist or hip gathered knot; asymmetrical overlapping skirt panels; relaxed cloth folds. **NO two diagonal back straps.** Open back should be actually visible in normal rear camera, clean shoulder blades / graceful neck-to-back continuity. Dress still has lower-waist/side support and plausible textile topology; do not introduce exposed buttocks or impossible torso holes.
- Fullbody source: 168cm conceptual reference at character visual scale 1.0 (do NOT change game passenger size to manufacture exact number); slim athletic proportions, gold bracelet, delicate warm ivory strappy heels, natural posed standing body. Feet, hem and jewelry must have no absurd material drift. Front/45/side/back turnaround match the same woman and one coherent garment; NO different face in standing version.
- Keep hand/finger shapes usable for open-hand kiss, cupped hand shout, overhead raised arms. Feet/shoes only needed in photo/portrait asset, not constant driving scene.

## 2. Two PRESENTATION profiles from ONE editable Blender character master

**A. Photo/showcase full body**: one editable Blender master with consistent head/neck/shoulders, skin, entire dress, knees/legs/heels, earrings, wrist jewelry, a minimal poseable arm/torso/leg rig; output a separate standalone GLB for later photo / finish stage, which is not loaded during ordinary racing. Ensure front/45/profile/back and gesture poses work.

**B. Race/passenger profile**: optimized head/neck, bare upper back, shoulders, continuous arms / upper chest, secured halter front + visible waist portion, minimal cockpit/lap garment. Derive from SAME master, not a second character. Reuse original `src/car.ts` seat anchor, `src/heroine-bust-asset.ts` loading/fallback, `src/occupants.ts` head and torso pivots, existing steering/non-player code. Prior R7A bust `coast-heroine-r7a.glb` had 30,502 tris / 1.3MiB / 4 draws; do not import the ~1.48M high-poly master or invisibly render full legs into normal play. Aim to **reduce** cost as good visual topology permits; report actual game draw/CPU/GPU/mobile FPS, not just a triangles target. Optimize portrait/fullbody separately.

**R7A weaknesses to fix intentionally**:
- Shoulder to old code-generated arms shows hard split / different normals and peach skin colors. Join/bake matching shoulder-arm topology or consolidate into the single rig; remove exposed duplicated skin at arm openings. Keep gestures, including hands high overhead.
- Neck/ivory halter cloth seam is rough; replace back straps with correct open-back garment topology, preserve cloth front, waist continuity and visually coherent folds.
- Eyelid/eyebrow pigment edges are jagged and warm sunset skin can appear overly orange. Correct in Blender/material without changing accepted face identity; smile, teeth/inner mouth if visible, natural expression.
- Gold earrings should belong to actual head transform without popping, clipping hair or swinging through cheek; lightweight secondary motion optional, never divert into full jewelry physics.

## 3. FIVE explicit gestures — **REAR CHASE CAMERA IS THE SOURCE OF TRUTH**

### Coordinate truth (matches `src/car.ts` current layout)
- The car faces vehicle local **+Z forward**. Camera is BEHIND vehicle (toward local -Z) looking forward.
- Driver seats at car-local **+X**, appears on **SCREEN LEFT** in actual rear chase camera. Passenger seats at car-local **-X**, appears on **SCREEN RIGHT**.
- Therefore **RIGHT target** means passenger-door side, **SCREEN RIGHT**, vehicle local **-X**; **LEFT target** means across the driver, **SCREEN LEFT**, vehicle local **+X**.
- **Do not trust an auto-generated sheet label if the face/hand actually points in the opposite direction.** Explicitly demonstrate both sides with highlighted target rival in *real in-game screenshots*, no mirrored camera or reversed video.

### Required cinematic actions
| Action | Position | Real target direction | Expression/hand | Character silhouette |
|---|---|---|---|---|
| `shoutRight` | **SEATED** in passenger seat | screen-RIGHT / passenger side | turns RIGHT; opens mouth, cups a hand to shout | upper torso/head lean outward, shoulder natural, hair follows |
| `kissRight` | **SEATED** | screen-RIGHT / passenger side | turns RIGHT; lips pucker, hand reaches mouth then releases blown kiss to RIGHT | readable outgoing gesture, no teleporting hand |
| `shoutLeft` | **RISES / STANDS UP** FROM passenger seat (arcade, not walking outside car) | screen-LEFT / driver side | turns LEFT; mouth open and hand cupped | rises above seat enough to clear driver's head; no intersect driver/steering/windshield |
| `kissLeft` | **RISES / STANDS UP** FROM passenger seat | screen-LEFT / driver side | turns LEFT; puckers, hand blows kiss over/across toward LEFT | clearly aims screen-left, not a mislabeled screen-right pose; backless dress and back/shoulder readable |
| `victory` | in/above passenger seat (stays anchored, modest rise optional) | faces broadly forward/upward | **BOTH arms raised higher than head**, large happy open-mouth cheer | unmistakable overhead hands in normal chase + rear 3/4 |

Animation aesthetic: fun, flirty, cute, confident, not sexualized motion. Short anticipation → readable pose hold → return to seated rest (~0.8–1.8s as useful); don't be robotic and do not mix a kiss and shout in same event. Allow a short expressive pause, but don't obscure road visibility. Preserve existing R6d wind and pose hair continuity throughout; backless shoulder skin remains seamless during flexion and torso turn.

**For left standing poses**, anchor feet/hips/seat contact consistently for arcade stylization; do not literally put a person on top of a speeding car roof/hood. Old passenger's shoulder and hand pose code may need replacement by new modest character rig, but don't build a universal fullbody animation framework. Waving and existing cheering behavior should gracefully coexist.

## 4. Event semantics: player side pass, not finished-race score event

- Preserve `src/rival-overtakes.ts` completed-pass hysteresis and race scoring **unchanged**. Existing event reports after 5.5m clearance, too late for side-facing gesturing.
- Implement a small **passenger-only** animation opportunity detector from `RivalRace` live states: relative longitudinal overlap, relative speed closing, relative lateral position. Trigger in the **side-by-side moment** during a real player overtake; latch exactly one rival ID and side at trigger, even if it changes lane, and refuse to flip halfway through.
- Only react to a race opponent, not random traffic, for v1. If both left/right targets are alongside, pick the most legible one, not two simultaneously. Cooldown (~3–5 sec), no reaction during impact, pause, loading, restart/teleport, finish or player-being-overtaken.
- Choose shout/kiss with a seeded, deterministic pseudo-random mechanism or an explicit controlled pattern, independent of `Math.random()` state affecting races. Optionally introduce a dev-only `heroineAction` QA mode to force each action while preserving normal game query contract. Do NOT rely on real opponents naturally appearing at specific positions for *all* gesture QA shots.
- **Victory** triggers at a real finish / suitable result-screen moment (not every checkpoint), and must be visible during the race completion/transition. Preserve game outcome, car handling, traffic & AI unchanged.

## 5. Precise acceptance / art gate

A. **Fullbody design:** one neutral studio front/45/side/back showing open back with NO straps, correctly wrapped ivory dress, legs, heels and consistent face. One backless rear 3/4 closeup to check shoulder blades / waist knot. One Blender file path (editable).
B. **Real game upper-body:** front45, rear45, normal rear chase, seat side/back under identical sunset lighting, 1.0 body scale. No hard shoulder-arm seam, no strange texture/skin mismatch, eyelid edges improved; R6d hair, 8m camera, WILD in DEV identical to chosen baseline.
C. **Five poses:** 5 × original-size **ACTUAL rear game camera** image (primary) with visible target direction and left/right side. At least one short real game video of `right shout → right kiss`, `left stand shout → left stand kiss`, `victory` with on-screen pose name and target-side indicator for verification only. Supplemental front/side studio allowed, but cannot replace in-game rear evidence. No mirrored footage or flipped 3D camera.
D. **Engineering:** pause/resume/fps-stall, restart/scene re-entry and asset disposal; no stuck standing pose, no unbounded cheering loops, no driver intersections on left gestures. GLB/source origin, triangles, render call delta, bytes, mobile FPS/P95 from real Pixel 8 if available; no claim of performance approval without device measurement. Report known R7A cost and R6d Spring perf issue.
E. **Source & traceability:** original colored heroine sculpt on owner Windows is a high-poly master; new separate Blender fullbody source and race-GLB with trackable identity. Do NOT overwrite R7A GLB or old face fallback; create separate versioned asset and optional dev-only rollback `heroine=previous|r7a`.

## 6. Execution & stop rules

- Only female hero work. No male character model, no Riviera car rebuild, no head-hair art revisions, no scene/road AI/physics/water changes, no main promotion.
- User's incremental paid asset / API budget is **NT$0**; only installed local Blender, existing rig/GLB, no cloud services.
- Codex usage is valuable: DO NOT redo Hunyuan3D inference or the character face from math; reuse R7A master + approved concept. Small standalone checks before committing a full game asset. Work in two internal steps: **(1) one complete editable fullbody model + five pose previews; (2) integrate race profile and event logic; (3) one bundled QA pass.** If unexpected blockers occur, preserve the playable R7A and stop with evidence rather than replacing it with half-working content. Do not ask owner to re-approve the already-approved 2D costume concept.
- Run focused tests and one `npm run verify:dev` before ONE `dev` push; include 5 pose event cases, garment/backless geometry checks, direction latching and asset preload/rollback QA. No CI loops on dev. Mobile release gate remains unresolved; production/main unchanged until explicit owner approval.
- Treat the auto-generated design sheet as a visual aid, not a machine-readable UV/skeleton map; avoid literally copying any nonsensical typography or mislabelled arrow.

Canonical technical context: `docs/art-review/r7a/README.md`, `docs/COAST_HERO_ASSET_R7_PLAN.md`, `docs/COAST_HEROINE_OVERTAKE_REACTION.md`, `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md`. Related [Issue #41](https://github.com/michael-wang/OutRun/issues/41) has the previous overtake observer plan; this R7H completion task supersedes its technical implementation and prevents duplicate work.

# R7H Rev. B-2 — shoulder ribbons, v0.10.30

2026-11-15 · Issue #51 · costume-only review candidate. Stop here for Julia / owner art acceptance.

## Owner clarification and references

The owner explicitly chose **「依附圖 B-2：取消繞頸，跨肩後向腰部收攏」**. This overrides the older neck-to-waist construction in Issue #51 and the supplied ZIP. [Approved B-2 illustration](approved-b2.png), SHA-256 `f6f31f2be9cb268a0e814ce4e0ab23b2921dee00f71829ff8d8d6eed8f9ef781`.

The ZIP was received and inspected at `C:/astra-dev/outrun/OutRun_R7H_RevB_Ribbon_Back_Reference.zip`; extracted originals remain in `art-prototype/reference/r7h-revb/`:

- `R7H_RevB_Design.png`: `7e2e4284ce00a0509cc8b47a99f574f9d49bb2793595ad77298a6dda21136da7` (older neck construction, superseded).
- `R7H_v0.10.29_Before.png`: `6ecdb4e163d6f7d13f8e7393a8cc5dc228aaaceca8aa2f46c079ac2fd2cde19a`.
- `R7H_RevB_Construction_Notes.md`: read as historical guidance; B-2 clarification governs the final garment.

## What changed

- Rear center edge lowered **10cm**, from 1.100m to **1.000m** in character coordinates. Side edge curves upward; continuous cloth still covers lower back and waist.
- Removed the neck loop, old crossover front ribbons and neck-front knot. The ivory bodice now has a soft shoulder-supported neckline. Existing waist-side knot and skirt remain.
- Added two rounded **3.2cm wide / 4.6mm thick** satin ribbons, rising from the front bodice, passing over the shoulders and converging toward the back waist. No X, neck loop or independent horizontal band.
- Each ribbon shares four actual garment vertices at its front/back attachment. Surface fitting and interpolated existing skin weights keep it close to the shoulder/back during the five clips. There is no added cloth simulation.
- Both exports derive from the saved v0.10.29 Blender master. [Construction measurements](construction.json) and [export data audit](asset-audit.json) record the change. All non-cloth positions, normals, colors, indices, morphs, skin bindings and seven existing clips are **identical** to v0.10.29. Frozen R6d hair hash is unchanged. No `src/` edits; 1.0 people, wild wind, camera, male, car and events remain unchanged.

## Actual review evidence

Before/after pairs are **left v0.10.29 / right B-2**:

- [Game rear comparison](compare-back.jpg) · [rear45 comparison](compare-rear45.jpg) · [normal chase comparison](compare-chase.jpg).
- [Fullbody rear comparison](compare-studio-back.jpg) · [Blender rear attachment detail](studio-back-detail.jpg).
- [Normal chase](game-chase.jpg) · [rear45](game-rear45.jpg).
- [Seated shout right](game-shoutRight.jpg) · [seated kiss right](game-kissRight.jpg).
- [Standing shout left](game-shoutLeft.jpg) · [standing kiss left](game-kissLeft.jpg) · [overhead victory](game-victory.jpg).
- [16.77-second wild actual game clip](revb-wild.mp4): seated → right shout → right kiss → left shout → left kiss → victory. 1600×900, 30fps delivery, approximately 224km/h. This is a capture frame rate, **not** a measured game/phone FPS result.

Same Chrome/WebGL renderer, sunset lighting, 1600×900 DPR1, `trafficSeed=42`, `hairWind=wild`; static frames use HUD3210m. The original 8m chase camera is unchanged; only the extra detail shots use a temporary inspection camera. Before pages intercept just the race GLB with the exact v0.10.29 file. Video uses the existing DEV pose/target fixtures while driving; labels are added to the recording canvas, not game UI. No mirrored shots, generated video or altered event logic.

Inspected seated, twisted/rising left and overhead poses in Blender and the game. The supplied frames show connected ribbons and covered lower back without obvious skin penetration or detached straps. Close-ups retain small seam ridges and the existing simplified shoulder/elbow/face finish; this pass does not claim those inherited character limitations were corrected. Final shape, coverage and ribbon elegance remain for owner/Julia approval.

## Model and runtime costs

| Asset | Before → after triangles | Material draws | Before → after GLB bytes |
| --- | ---: | ---: | ---: |
| Race body (hair loaded separately) | 28,647 → **28,943** | **4**, unchanged | 1,559,060 → **1,567,480** |
| Fullbody including frozen hair | 40,238 → **40,534** | **5**, unchanged | 2,049,728 → **2,058,164** |

Delta: **+296 triangles**, +8,420 bytes race / +8,436 bytes full. Same 14 body bones, seven clips, four body materials and morph channels. A few additional skinned vertices are the only ongoing GPU cost; no new lighting, textures, shaders, animation update or physics work. In the matched chase render, Three.js reports **469 → 469 calls**, **779,812 → 780,108 triangles**; these scene counts are snapshot-specific. [Before counters](game-before.json) / [after counters](game-after.json). No Pixel 8 measurement in this costume pass.

## Sources, reproduction and verification

- Editable master: `C:/astra-dev/outrun/art-prototype/output/r7h-heroine-fullbody.blend`.
- Standing review scene: `C:/astra-dev/outrun/art-prototype/output/r7h-heroine-review.blend`.
- Preserved originals: `r7h-heroine-fullbody-v029.blend`, `r7h-heroine-review-v029.blend` in the same directory. Original master SHA-256: `54cf63cff5f9eda3ce626244645ebb84a11896b41cbccf5a32b06c559632052c`. These editable working files remain local under the repository's existing ignore policy. Runtime originals can be recovered from commit `278c01a7e0dfb8f9a9746ecd006b182c13224164`.
- Export: Blender 4.5.13 `-b -t 4 -P scripts/blender/revise_r7h_revb.py`. This patches the preserved v0.10.29 source, preserving face/body/rig data. Do not rerun the older `build_r7h.py` recipe over B-2.
- Render: set `OUTRUN_HEROINE_REVIEW=docs/art-review/r7h-revb`, then Blender `-b -t 4 -P scripts/blender/render_r7h.py`.
- Game capture: `node docs/art-review/r7h-revb/capture.mjs before` / `after`; requires local Vite5194 and `test-results/r7h-revb/before-race.glb`. `audit.mjs` also needs `before-full.glb`. Both baseline GLBs were copied before editing.
- Focused heroine test: **2 passed**. Full **one `npm run verify:dev` passed**: scenic validation, scenic behavior checks, TypeScript/Vite production build, **120 test files / 517 tests**. Existing collision/geometry/safety checks preserved. Updated garment raycast coverage expectation to match the 10cm lowered edge.
- Asset invariants audit passed; both browser pages had **0 page errors**; MP4 decoded without errors. Existing Vite large-chunk advisory remains. NT$0 additional spend.
- Playable dev: `http://192.168.1.106:5194/?at=3210&trafficSeed=42&hairWind=wild`. No main changes, deployment or manually dispatched CI. Stop after this costume revision for review.

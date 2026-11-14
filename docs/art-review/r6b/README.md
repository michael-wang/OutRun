# R6b — mid-hair flexible skin: remotely baked dev art candidate
Date: 2026-11-14. STATUS: **CODE + GLB CREATED; VISUAL & PIXEL 8 QA NOT YET PASSED**.

## Intended comparison
- **R6b** `http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild` — unchanged WILD wind/18 springs/1.0 characters, but looser *outer middle* skin weights from a second immutable GLB.
- **Original R6** `http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairMid=old` — identical wind and character size; chooses original `coast-blonde-r6.glb`.
- Both use 8m chase, same drawn resolution. Optional QA points: `&at=13910` near end, `&at=3305` left curve and `&at=4000` right curve. The dev server must have pulled this commit; links alone do not publish any code to the user's Windows computer.

## What was changed, precisely
Existing `scripts/blender/export_r6_blonde.py` weighted outside hair as `flex=(1-smooth(-.015,.075,height))*sideMask*angleMask`. This pins all hair above 7.5cm, and markedly weakens 0–7.5cm mid-layers. R6b uses `1-smooth(.010,.108,height)` **with identical side/angle masks**: loosen selected exposed middle locks; everything >=10.8cm remains fixed, terminal ends below -4cm unchanged. Existing six bone chains / 18 active joints, old rigid crown/part, accepted tips, GLB geometry, vertex color, normals and WILD wind are unchanged. No stronger global wind.

Original GLB `coast-blonde-r6.glb` remains in repo; new `coast-blonde-r6b.glb` contains only changed `WEIGHTS_0/JOINTS_0` buffer fields. R6b skin is reconstructed from the current Blender source mask; verification against original GLB found max old-mask discrepancy ~0.00011. Actual candidate: **182 / 1592 render vertices** changed, **0** tip vertices below -4cm altered, **0** crown vertices >=10.8cm altered. In a measured exposed mid band (back, y 0..8cm), mean flex rose from **0.516 to 0.853** (74 render vertices); max single delta **0.450**. Weight sums stay within ~1e-7 of 1. Existing 2279 triangles, 25 bones and one opaque material are unchanged; GLB same byte length (109,144 bytes). Core design is now much less rigid in the upper/mid swept locks, without disturbing previously approved tail flutter.

**Production/reproducibility:** Blender exporter formula now matches this reweighted GLB; full original `.blend` file on the owner's Windows machine was not accessed here. This binary was directly reweighted from the accepted source GLB without touching geometry; no claim of freshly rendering in Blender or of measuring real Pixel 8 FPS. To continue editing the `.blend` master, Codex should use the updated Blender exporter or reapply these weights in Blender, not assume its older local `.blend` automatically reflects this Git commit.

## Owner/Julia art gate
1. In actual game at 60/80/120/300km/h, is the **middle of a few outer locks visibly flexing** while the upper hairline stays elegant?
2. Are the previously approved tips still lively and graceful under WILD? Does any mid-hair fold/collapse or clip through head/ear/neck, especially in extreme right turns?
3. If the new hair is too floppy, revert via `&hairMid=old` immediately and report which region; no further extra springs or wind until art feedback. Capture one short matched before/after video and Pixel 8 follow-up before treating as passed.

## Engineering check
Standalone binary inspection PASS: identical glTF JSON and primitive geometry, all joints valid, finite nonnegative normalized weights, crown/end masks unchanged; new unit test asserts these properties. **Full npm build, Vitest and browser rendering have not been run in this remote GitHub-only environment**, and should not be claimed. No `main` changes or spending (NT$0). Development artifact awaits real Codex local build/visual review.

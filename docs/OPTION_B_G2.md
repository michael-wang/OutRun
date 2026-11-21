# Option B G2 exterior — LOCAL-DEMO ONLY

Issue #65 continues G1 on the same cumulative Draft PR #64. Default car, driving physics, wheel contact, race, camera, audio and characters remain authoritative. Use `http://127.0.0.1:5183/?hero3d=1` on the owner's PC; omit the query to use the original car. This is not a hosted demo. No binary art, input images, screenshots or detailed logs are in the public branch.

## Current local asset and recipe

With the prepared private G2 `option-b.glb` at `.local/option-b.glb`, run `npm run dev -- --port 5183 --strictPort`. Missing or malformed assets retain the original car and show a fallback notice. The fixed loopback endpoint and development-only query remain in place; production output does not include the private model.

Existing Blender 4.5.13 can reproduce the derivative from the preserved G1 editable file:

```text
blender -b -t 4 -P scripts/blender/refine_option_b_g2.py -- G1_OPTION_B.blend NEW_PRIVATE_OUTPUT_DIRECTORY
```

The recipe verifies G1 source SHA-256 `db70243ec4db7deed3ab531d9ce7b4b292c68a1eac97a44e75e34a5ddfc73fea`. It adjusts 1,283 wheel-cut boundary vertices to a .515m opening and joins four broad painted shoulder surfaces into the editable body object. This is local overlapping surface construction, not a claim of watertight retopology. Original G1 and #62 files are unchanged. Runtime no longer adds `createWheelBrow` or `option-b-wheel-arches` to Option B. Earlier unsuccessful external flare attempts remain private evidence.

| Current private artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| G2 option-b.glb | 599472 | `95f2d93ccb63fd78793521795e58026dba7033ac82a5cc36640775ba8843c142` |
| G2 option-b.blend | 1946259 | `5b90e5831c3aa28ff0eb79aed978e0e130048c42d567acc57f4c8bb2ab193301` |

Source #62 raw GLB remains `9ff58651c3fd69e7a1d833e3e2e18d02e953dd974d9851f7648d68eadadc825b`; G1 GLB remains `d48f9e5aaab03efeb29cd26ba0f269fb10f5e8defd37e9c33d52d4baefdebd27`. The modern wheel/glass/lamp parts are editable TypeScript mesh builders in `src/option-b-details.ts`, not falsely presented as parts of the Blender export.

## Visible and functional changes

- All four wheels use rounded tire shoulders, recessed bronze rim barrels and five tapered open spokes with dark brake discs/calipers. `setVisuals` replaces geometry on the existing rolling axle; the original pivot, rolling distance, front steering smoothing, slip, spin blur and contact radius .46m are unchanged. Centers remain x ±1.055, y .46, z 1.38/-1.45 before suspension motion.
- Windshield is wider and lower, with a curved transparent pane and slim dark satin perimeter. Original windshield is grouped and hidden only after Option B validation. The existing steering wheel, right-hand grip, door-resting arm, both occupants and hair/gesture controllers are untouched.
- Front swept LED signatures use a smooth shallow housing fitted to measured sculpt depth. Rear signatures remain horizontal while following depth. Two materials supply front and rear emission; no new SpotLights, shadow lights, bloom pass or textures. Reserved indicator attachment names do not implement a turn-signal mechanic.

| Headlights | Brake | Front emission | Rear running | Rear emission |
| --- | --- | ---: | --- | ---: |
| off | off | 0 | off | 0 |
| off | on | 0 | off | 1.7 |
| on | off | 2.4 | steady on | 0.55 |
| on | on | 2.4 | steady on | 1.7 |

Existing coast dusk configuration initializes headlights on; a non-dusk car initializes them off. `brakeLights.set/reset` remains the gameplay brake interface. Narrow `setHeadlights` controls both headlights and running lamps without changing braking. Development QA exposes `__drive.optionBHeadlights(boolean)` and `optionBReviewDaylight(boolean)` for inspection. The latter is explicitly a reversible game-scene lighting override, not a new authored daylight stage or validated day/night system; sky/water and fixed shadow direction are not a complete daytime art pass.

## Review limits

Real game views, not Blender-only images, are required for this handoff. Broad shoulder junctions still show small seams/highlight discontinuities; the thin glass can have a dark edge at grazing angles. The source rear lower fascia/diffuser remains deferred. This is an indie prototype, not final CAD-quality topology. No new Shape/Paint, package stack, global CUDA change or service cost. Hunyuan/Tencent worldwide commercial-release rights remain unresolved. Pixel 8 performance and physical controller acceptance are UNKNOWN. Requested effort Medium; applied effort UNKNOWN.

Do not delete branches as part of G2. After final acceptance/integration, separately inspect unique commits and historical evidence references before proposing cleanup. Future dev-first policy does not require migrating this in-flight cumulative PR.

## Measured local QA

Final `npm run verify:dev` passed: production build and 121 files / 521 unit tests. `git diff --check` passed, and production `dist` contains no Option B asset. No dependency change or physical-device test.

Final actual Chrome suite: 14 selected scenarios passed, including G2/default/missing/malformed GLB, start/drive/restart, ready controls and reload recovery. An additional G2 run explicitly passed pause and restart into the established countdown. Captures are 1600×900 at pixel ratio 1: 8m chase, front/rear three-quarter, side, both steering directions, rolling wheels, and eight day/dusk × headlights × brake combinations, each photographed front/rear. `daylight-qa` filenames identify the inspection override. All evidence remains in the owner's private local G2 folder; no screenshots are committed.

G2 body has 29,919 triangles after triangulating the shoulder quads. Body/diffuser/windshield/lamp group totals 30,635 triangles. Each wheel appearance has 560 tire + 800 rim + 220 spoke triangles, plus 140 for stationary brake parts; existing spin-blur layers are retained. No added textures. Sampled whole-scene render counts: default 371 calls / 524,974 triangles, G2 376 calls / 558,207 triangles. The unchanged default windshield is now independently grouped, costing two additional calls versus G1's material batch. Real-time short samples: default 180 frames/3002.7ms, G2 180 frames/3002.9ms. These are headless PC snapshots, not sustained or mobile benchmarks.

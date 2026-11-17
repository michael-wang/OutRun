# Option B playable prototype — LOCAL-DEMO ONLY

Issue #63 adds an optional local car body while the original car remains the default and load-error fallback. This is a development experiment, not a public vehicle release or final art/device acceptance. #62's original Shape evidence and #59/#60/#61 failures remain unchanged.

## Run locally

Use this branch with its locked dependencies (`npm ci`). Obtain the owner's private prepared `option-b.glb` and copy it to `.local/option-b.glb` in this worktree. The asset is intentionally absent from Git. Start `npm run dev -- --port 5183 --strictPort`, then open:

- Option B: `http://127.0.0.1:5183/?hero3d=1`
- Original: `http://127.0.0.1:5183/`

The switch is development-only. A fixed loopback endpoint serves the ignored local file; it is outside `public/` and is not copied into production `dist/`. Missing, oversized, malformed or cancelled assets retain the original car with a visible fallback notice. No arbitrary URLs, third-party assets or external glTF resources are accepted. Loading is bounded to eight seconds before fallback.

## Local source and recipe

Source is the owner's preserved #62 AB1 `shape-01/raw.glb`, SHA-256 `9ff58651c3fd69e7a1d833e3e2e18d02e953dd974d9851f7648d68eadadc825b`. Preserved original `candidate.blend` SHA-256 is `c11ce15ec29ee8f96a5ca0d01fbe15582047e6a807dc564edb31a1cd41e18349`. Original files are never overwritten.

With existing Blender 4.5.13, run:

```text
blender -b -t 4 -P scripts/blender/prepare_option_b.py -- SOURCE_RAW.glb NEW_PRIVATE_OUTPUT_DIRECTORY
```

The recipe validates source hash, normalizes one 4.9m length transform, removes generated wheel/cabin overlap and porous lower rear faces, recalculates normals, merges coincident vertices, decimates the body to about 28k triangles and adds a simple dark diffuser. It saves a new editable `option-b.blend`, exported `option-b.glb` and recipe measurements. This is bounded cleanup of the actual Hunyuan sculpt, not a new Shape or Paint generation. The raw input contained 555,456 repeated-index/zero-area faces; Blender imports the remaining 767,324 polygons before cleanup.

The adapter reuses the existing paint palette, wheel pivots/spin/front steer, steering-wheel/driver grip, left door-resting arm, occupants, glass, cockpit, heroine hair/gestures and running/brake light materials. Four small wheel-arch surfaces reuse the existing geometry helper. Lamp zones attach to raycast positions on the new body. Physics/collision/race/traffic/camera remain authoritative and unchanged. No second set of generated wheels is rendered. Original hidden surfaces remain available during the session; normal scene disposal owns all attached resources.

## Review limits

Red/white/seafoam palette remains supported. Seats use a simple tan material in Option B. There are no new texture maps or dynamic shadow-casting headlights. Body/arches remain a rough prototype: local seams, simplified lamps/cabin and softened sculpt detail are deferred polish. Dark diffuser obscures the porous lower rear at the normal chase scale. No claim of production topology, suspension rig, final art PASS, or worldwide shipping clearance; Tencent Hunyuan territorial/license restrictions remain a release gate.

Private game screenshots and diagnostics remain on the owner's PC and are not included in this public code PR. Pixel 8 FPS is UNKNOWN. PC browser evidence is not a mobile or hardware-controller acceptance claim.

## Recorded local prototype

Prepared GLB: 560,400 bytes, SHA-256 `d48f9e5aaab03efeb29cd26ba0f269fb10f5e8defd37e9c33d52d4baefdebd27`. Editable Blender source: 1,875,919 bytes, SHA-256 `db70243ec4db7deed3ab531d9ce7b4b292c68a1eac97a44e75e34a5ddfc73fea`. The exported body has 27,999 triangles; diffuser and runtime arches/lamps bring the adapter to 28,875 triangles. No added texture maps.

Actual 1600×900 Chrome game frames show the sculpt in the original 8m chase camera, dusk front/rear three-quarter, both steering directions, running/braking lamps and a deterministic high-speed braking/steering sample. The rear diffuser covers the worst lower-fascia damage at normal chase scale. Close front views still show rough wheel-arch junctions and small dark gaps; rear lamps follow the uneven surface. These remain explicit prototype polish TODOs, not claims of final art acceptance. Existing right-hand steering grip, left arm resting pose, heroine and animated wheels remain in use.

Short real-time PC samples (about three seconds, pixel ratio 1, shadows enabled): default 181 frames/3005ms, Option B 180 frames/3003.4ms. Sampled whole-scene renderer counts were 369 calls for both, with 524,974 versus 550,887 triangles. These are short headless Chrome observations, not a sustained benchmark or device guarantee. Added service spend: zero. Requested reasoning: Medium; applied effort: UNKNOWN.

## Verification

`npm run verify:dev` runs scenic checks, build and retained unit tests. Adapter tests cover opt-in, geometry validation, default fallback, controller identity, paint, steering grip and running/brake intensity. Local browser suite uses existing Chrome and an explicitly supplied private evidence directory:

```powershell
$env:OUTRUN_OPTION_B_EVIDENCE = '<private local evidence folder>'
npx playwright test --config playwright.option-b.config.ts
```

Run the isolated Vite service on port 5183 first. Browser suite exercises default, new body and deliberately missing asset, start/restart, both steering directions, wheel motion, actual coast views and existing launch/ready/recovery regressions. Screenshots are actual game frames; deterministic QA inputs are labeled in the tests. Do not commit generated evidence or model files.

Recorded checks: final `npm run verify:dev` passed (production build plus 121 files / 520 unit tests). The three local model/default/fallback browser scenarios passed. Existing launch/recovery scenarios passed; the four ready-state scenarios passed after correcting one stale expectation: pause-menu restart has intentionally begun a fresh countdown since R5b.4, while result-screen replay is a separate START route. No gameplay restart logic changed. In total, all 13 selected browser scenarios passed across the final runs. Production output was checked to contain no Option B asset. An earlier concurrent build/browser attempt was interrupted after generated-data HMR interfered with the test; subsequent runs were sequential. No physical controller or Pixel 8 test was performed.

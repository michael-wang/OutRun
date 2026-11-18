# Accepted coastal route: local dev default

Michael accepted the route and START/restart/menu fixes on 2026-11-18. The new balanced beach composition is still awaiting his visual review. This is a local Macro prototype, not a public release or final asset pass.

## Play and compare

- `npm run dev -- --port 5184 --strictPort`, then `http://127.0.0.1:5184/`.
- `?at=4000` starts before the beach approach. Restart preserves that station and waits for START again.
- `?at=4000&beach=dense` compares the previous dense crowd with the same accepted route.
- `?coast=original` restores the original authored road/light configuration. Existing explicit `beachMacro=b` and fully specified diagnostic URLs remain available.

DEV resolves the accepted profile in memory: right macro, scene orientation, left sun, beach vista/flow, close coast, beach zones and activity. It does not expand the address bar or change production defaults. `predev` bakes both original and accepted shoreline masks. Track station minus 350 m is HUD progress; `at=4000` means HUD 3650 m.

The accepted geometry retains the single 280 m braking right turn, approximately 1700 m beach, gentle coastal arc, continuous rising headland and closer post-tower shore. The sun stays fixed at world azimuth -10 degrees, with shared sky/water/lighting direction. World axes are not real compass bearings.

## Composition and retained behavior

Three activity pockets now have different crowd/canopy densities and offsets. Entry, rental and lifeguard corridors stay open; the shore margin provides breathing room. Swimmers are placed only over submerged terrain. Six inexpensive gliding gull silhouettes occupy two beach pockets, separate from the unchanged lighthouse flock. The tower retains its larger silhouette and rotating emissive beacon; it does not add a shadow-casting light.

The beach's left visual rails are hidden locally, but the collision boundary remains active. Traffic, opponents, steering, camera orbit, photo controls, occupants, private Option B and failure fallback are retained. Invisible-wall feedback still inherits the existing metal contact semantics; see [the architecture audit](ROAD_SURFACE_FEEDBACK_AUDIT.md).

## Local assets and reproducibility

The public source commit contains no GLB, Blender source, private reference pictures, screenshots, ZIPs or private logs. The local game requires the retained `.local/option-b.glb` (SHA-256 `01152cd6c938c2bf3298ba3ec18abcc1228e99db0ecae9f1f07a86a48ce6ab00`) and the existing locally staged beach kit under `public/generated/`. Missing local art is not evidence of a complete remote visual delivery.

The original direct-Blender recipes are `scripts/blender/build_kenting_lighthouse.py` and `build_kenting_beach_kit.py`. Each accepts a NEW output directory after `--`, preserves an editable source and exports GLB. These are authored geometry, not Hunyuan runs. Copy the lighthouse export to `public/generated/kenting-lighthouse.glb` and the kit exports to their matching `kenting-*.glb` names only in an authorized local workspace. Terrain and shoreline adaptation remain the stage's responsibility; relocating a package does not automatically refit arbitrary terrain.

`OUTRUN_PRIVATE_PREVIEW=1 npm run verify:dev` is the existing authorized private-build check (PowerShell: set the process environment variable first). Do not publish that build. Unflagged build retains **GLOBAL RELEASE BLOCKED — LICENSE**. Netlify's existing ignore rule skips dev/PR builds; GitHub automatic release validation remains main-only. No release/license clearance is implied by a dev push.

## Evidence limits

Private evidence contains actual Chrome chase/orbit images, continuous race telemetry, collision contact, beacon/gull motion, short-URL restart/menu regression and matched dense/balanced performance samples. Simulated controls are not physical gamepad evidence. Stationary inspection views are not driving proof. Pixel 8 and physical-controller performance remain UNKNOWN; the first-start fixes do not prove every cold-PC shader stall eliminated.

## 2026-11-18 verification

- Private aggregate verify:dev: build and 569 unit tests in 135 files passed. The new predev mask preparation passed; an unflagged build stopped at the expected license gate.
- Normal continuous START-to-finish run: track 350 to 14550, 175.35 simulated game seconds, 3516 telemetry samples and 104 private images; normal traffic/opponents/collisions remained active, no reset/teleport. The beach interval was 19.45 seconds at 145–240 km/h.
- Matched stationary 1600×900 Chrome ABBA comparison at track 5430: old dense versus balanced, both approximately 60 FPS, p95 16.8 ms; 601 calls in both, 1,576,164 versus 1,145,276 triangles at the sampled frame. Each sample used 5 seconds warmup and 10 seconds measurement. This short capped-PC result is not a device guarantee.
- Added festival figures: 190 on shore and 78 in water, 18 extra parasols, 14 instanced batches. These counts exclude retained package objects and earlier shore/swim groups. Six new beach gulls use one additional draw.
- The invisible beach boundary was hit by actual held gas/left inputs; one contact, minimum center lateral -9.47 m, no escape. Beacon rotation was captured at two game times.
- Three Chrome regression tests passed: plain and `at=4000` pause/result/repeated restart wait at START; simulated stick/D-pad/mouse, held confirm, focus/reconnect, orbit reset and Touchpad/R3 photo routing.

Actual images remain local. The full-race controller is simulated; Michael still owns final composition acceptance.

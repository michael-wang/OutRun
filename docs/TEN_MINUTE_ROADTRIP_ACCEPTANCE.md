# Roadtrip streaming — development sequence, executable acceptance

**STATUS UPDATED 2026-10-29:** v0.8.5 streaming foundation was delivered and owner-playtested; user **explicitly authorized v0.9 Ten-Minute Road Trip as the CURRENT scope**. v0.9.1 visual-art pass remains planning-only and is NOT authorized. Detailed v0.9 requirements are in `docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md` / `docs/V0.9_TEN_MINUTE_ACCEPTANCE.md`. Product brief \`docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md\`. The historical original benchmark used local v0.8.4 (\`edd7018\` / \`4d2b6ad\`). Current v0.9 baseline is local playable v0.8.5 (\`97cff65\` implementation / \`f160929\` handoff), source must be verified by Codex. Remote \`main\` only documents the plan.

## Milestone v0.8.5 — Streaming foundation

| Gate | Required evidence |
| --- | --- |
| COMPAT-1 | Latest two-minute Stage \`S01-v0.8.3-r1-1-ALB1\` rendered with rolling chunks, no change to seed, road pose function, powertrain, controls, feedback, telemetry and prior review data. Baseline v0.8.4 route record reproducible to numerical tolerance (not exact subjective player inputs). |
| BOOT-1 | At startup only a compact logical \`RoutePlan\` plus initial playable/chase-view scene window is generated. Show counters for planned total distance vs currently realized geometry distance, including per-chunk CPU/GPU readiness. Initial load avoids scene objects for the whole future 10-minute trip. |
| CHUNK-1 | At least three complete 2-min seeds driven and all boundaries checked (road top, width, dashed marks, shoulder, ground, props, water/cliffs, biome); continuous x/z, tangent, height, grade and road-relative driving. No visible holes, row jumps, lane-width pops or road surface clipping. |
| CHUNK-2 | Chunks unload behind and prefetch ahead with state machine. No missing road near camera or visible ahead; curved/crest views also tested. Peek behind and capture screenshots at boundaries. Use LOD for distant road silhouettes if viewport sees beyond full-detail coverage. |
| TIME-1 | Provide desktop 60fps/30fps and Pixel 8 baselines, measured p50/p95/p99/worst frame times, along with per-chunk CPU geometry and main-thread GPU upload times. No new perceptible stutter (provisional explicit target no **≥50ms** chunk-transition frame on supported 60fps desktop and real Pixel where baseline allows); if not met, identify the bottleneck and fix, not just mark tests green. The Pixel's actual capabilities and performance must be honestly reported as unverified if no device access. |
| MEM-1 | Ten-minute and twenty-minute continuous synthetic drives through repeated/varied chunk positions plus New Route/Replay; chart or tabulate renderer.info geometries/textures, active chunk count and heap before/after 1, 5, 10, 20min; after warmup the game-managed world resource count is bounded rather than growing linearly with total stage distance. Shared assets must not be incorrectly disposed. |
| SEED-1 | Generating chunk N before N-1 produces the same road, scenery random seeds and data as generating in natural order. No random popping or changed course after New Route/Replay, nor changes to photo metadata due to floating-origin rebase. |
| PHOTO-1 | In active drive, successful photo = brief "📸 Saved" toast only; no path or gallery overlay. Capture errors cannot falsely show success; no impairment to steering. |
| PHOTO-2 | Pause menu contains one row showing full dated Windows capture directory and working "Open Folder" button on **local PC dev**. Remove \`Recent Photos\`. The button must truly open Explorer for the fixed capture directory via a secure local dev-only implementation or state "unsupported" honestly. No unsafe \`file://\` link pretending to work from HTTP, no arbitrary OS command/path, no exposed endpoint on public deployment. Pixel LAN view tells owner the files are on Windows host, and doesn't claim it opened a phone folder. |
| REVIEW-1 | Existing user-approved v0.8.4 screenshot multiple-file archive, gamepad Touchpad/Share mapping, UI control, input frames, Stage review history intact. Source remains local on new branch from v0.8.4; no push, merge, deploy or further milestone. |

**STOP after v0.8.5** for owner driving test and performance diagnostics. Do not proceed with 10-minute course while this gate fails.

## Milestone v0.9 — 10-minute Road Trip

| Gate | Required evidence |
| --- | --- |
| TRIP-1 | New named \`10-Minute Road Trip\` driving option. Route plan assembled cheaply from L1/L2/L3 metadata; full game geometry is NOT prebuilt. Keep original two-minute mode and StageCode working; long mode has its own seed/version code and consistent replay. |
| TRIP-2 | Target approximately **8–12 minutes** on representative real/simulated drivers. Measure actual duration; derived initial length ≈70,000 game distance units from 114.95s/13.49k run, not blind repetition or fixed timer. Driving speed varies; do not auto-advance or time-warp to force a 600s race. |
| TRIP-3 | L2 cores + transition/recovery portions, mixed curve/grade/width combinations, geographically reasonable road sequence, meaningful changes in visual scenery using existing city/coast/canyon families. At least two different seed-generated route sequences clearly distinct in driving rhythm and biome ordering. No padding with repeated long unchallenging straights or identical three challenges repeated five times. |
| TRIP-4 | At start, report amount of active scene CPU/GPU resources vs total route and show that only a near window exists; inspect at ~2, 5, 8, 10 minutes. At all biome boundaries, gameplay uninterrupted (no new loading UI, sudden pause, hitch, road disappearing, unhidden LOD change). |
| TRIP-5 | Drive three full long-route seeds with browser QA + two real user seeds with owner ratings; record user praise/issue at actual course positions, and include performance plots at boundaries. Game still playable with approved 144px Pixel thumb control and PS4. |
| TRIP-6 | Prove scene/GPU memory bounded on continuous ≥20-min looping or extended route, screenshots after rebase/after long drive still accurate, replay remains deterministic. |
| TRIP-7 | Basic road support has no catastrophic new ribbon gaps; defer full tree art and rich skylines to visual milestone if the core is fun and performance is good. |

**STOP after v0.9**. User judges whether a 10-minute drive is worth repeating. "More varied" must be supported by real play, not just generated L1 count.

## Milestone v0.9.1 — Scenery support, richness & variety

| Gate | Required evidence |
| --- | --- |
| SCENE-1 | Earlier user screenshot: long uphill roadway visible in distance no longer looks hollow or like a sheet suspended in the air; road-edge terrain/ridge/bridge meshes visibly connect to proper ground/water for same seed/time and 4 other locations, including from side-looking camera. No scenery covers playable road. |
| SCENE-2 | Earlier user screenshot: coast palms no longer a uniform one-dimensional thin row. Visible larger 3D/volumetric crowns, varied height/lean/size and foliage density, clusters/clearings, same low-poly arcade style and reasonable number of shared instanced shapes. Compare aligned before/after shots, not only mesh count. |
| SCENE-3 | City building row has depth; behind the first facades there's another silhouette/built environment layer. Canyon high-altitude terrain is spatially coherent; no abrupt scene-asset teleport at chunks/biome borders. |
| PERF-2 | No perceptible chunk-boundary hitch or runaway memory after additional scenery, three 10-minute browser drives and real Pixel check if accessible. Record render and resource budgets. |
| REVIEW-2 | Historical Stage Codes and all owner review records preserved; no extra driving physics/economy feature without new request. |

## Handoff contract after each authorized goal

- Local branch, implementation/handoff commits, working tree, exact test command and build results.
- Current PC/Pixel dev URL if server running; never assert physical Pixel compatibility without test.
- Baseline and after performance on identical scene/seed, frame-time distribution + memory plateau and chunk coverage, not only one cherry-picked screenshot.
- User-visible screenshots/video of representative transition, far-distance view, road support, city skyline and trees; explicit PASS / FAIL / UNVERIFIED.
- Written limitations and next one bounded goal; STOP. **No push, merge, public deployment or unrelated work.**

## Small list of hard failure conditions

- Play/pause resets streaming progress; steering sticks during chunk creation; frame jumps at biome boundary; source code replaced by remote docs-only main; browser downloads overwrite prior photos; previous reviews disappear; 70km world coordinates cause visible jitter or screenshots with wrong position; terrain geometry blocks the road; benchmark green but physical Pixel hitches; screen shows a broken road ahead.

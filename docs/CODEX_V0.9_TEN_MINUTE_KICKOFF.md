# Codex kickoff — Project OutRun v0.9 Ten-Minute Road Trip

**USER-APPROVED TO PROCEED (29 October 2026, Taiwan time).** The owner played streamed v0.8.5 and reports **no perceptible stutter, scene popping, interruption**; photo capture works. That is the necessary subjective GO for v0.9, **not a measured claim that real Pixel 8 can run ten minutes at 60fps**. This Goal implements **the requested NEW, FULL-LENGTH PLAYABLE GAME MODE**, not another architecture-only milestone.

**Document precedence:**
1. `AGENTS.md` — current restricted local scope.
2. `docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md` — product/technical requirements, new mode & generated content.
3. `docs/V0.9_TEN_MINUTE_ACCEPTANCE.md` — measurable long-route tests and hard stops.
4. `docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md` — previous routePlan/streaming architecture context, not another Goal.
5. `docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md` — original phased milestones, v0.9.1 remains future-only.
6. `docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md` — historical stream compatibility.
7. `docs/V0.8_BIOME_VERTICALITY_METADATA.md` — canyon dramatic vs coast/city gentle/rolling, soft weighting.
8. Actually inspect latest playable LOCAL v0.8.5 engine source, current stage generation/feedback/streamer.

## Local source and safe Git preparation

- Game lives on owner's Windows checkout `C:\astra-dev\OutRun`. Previous Codex report: **local** `codex/v0.8.5-scene-streaming` branch with implementation `97cff65`, handoff `f160929` and clean tree; **verify actual HEAD/branch/status and any new edits** before modifying. Remote expected `michael-wang/OutRun`, GitHub `origin/main` is **DOCUMENTS FIRST, not current game code**.
- Start fresh local `codex/v0.9-ten-minute-roadtrip` from the latest PLAYABLE LOCAL HEAD, not from docs-only remote main. Do NOT merge/rebase/reset/checkout origin/main over working code. `git fetch origin` and selectively import ONLY `AGENTS.md`, `docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md`, `docs/V0.9_TEN_MINUTE_ACCEPTANCE.md`, `docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md`, plus the existing planning/biome docs as needed without overwriting local source/README.
- Preserve user-generated screenshots in `captures/YYYY-MM-DD`, prior local JSON telemetry and history of BRK/L2Pilot human KEEP + earlier Stage REWORK ratings. New v0.9 Trip codes have separate generator version and start HUMAN UNREVIEWED. No other repo like TopWar; no pushes/merges/public deployment, paid services, cloud data, license-unclear art, new game engine or destructive checkout.
- Previous Codex Goal STOP at v0.8.5 is now resolved by owner's explicit current approval. If automated branch/fetch approval continues to block, ask owner for an explicit *ordinary non-/goal* message in the SAME existing OutRun Codex conversation, respect real sandbox denials, do not retry bypasses.

## Suggested NORMAL chat authorization (send once before Goal to avoid stop-after permission block)

`I explicitly authorize Project OutRun v0.9 — 10-Minute Road Trip, superseding the previous stop-after-v0.8.5 instruction for THIS milestone only.

I played v0.8.5 and noticed no abrupt popping or lag, and photo capture worked. You may create a local branch from the latest playable v0.8.5 checkout, selectively import the approved v0.9 documents from origin/main, build a genuinely new seeded ten-minute Road Trip mode using the existing bounded SceneStreamer and L1/L2/L3 generator, test different route seeds end to end, and commit locally.

Do not replace the existing two-minute Stage, change approved driving controls/handling, construct the entire ten-minute 3D world at startup, begin v0.9.1 visual art work, or add traffic/RPG/editor. Keep historical reviews and local captures intact. No push, merge, deployment or other-project edits. I will send the development Goal separately.`

## READY TO PASTE current Codex /goal

```text
/goal Implement Project OutRun v0.9 — GENUINELY SEEDED 10-MINUTE ROAD TRIP on the CURRENT PLAYABLE LOCAL v0.8.5 game at C:\astra-dev\OutRun.

Owner ACTUALLY played v0.8.5 and did not notice stutter, missing/popping scene or photo problems. v0.8.5 Codex reported local implementation 97cff65 and handoff f160929 on codex/v0.8.5-scene-streaming (or later); verify current local Git remote, HEAD, worktree and no conflicting Goal. Create NEW LOCAL codex/v0.9-ten-minute-roadtrip branch from latest PLAYABLE LOCAL HEAD, NOT remote main. Fetch origin/main and selectively import current AGENTS.md, docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md, docs/V0.9_TEN_MINUTE_ACCEPTANCE.md, docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md, docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md, docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md and docs/V0.8_BIOME_VERTICALITY_METADATA.md. NEVER merge/check out/reset documentation-only origin/main over local game. Read complete specs, audit current v0.8.5 SceneStreamer/RoutePlan/Stage/feedback code, preserve old data.

PRODUCT DELIVERABLE: Add a NEW accessible '10-Minute Road Trip' option and direct URL (?trip=10m or a documented equivalent), independent from UNCHANGED original two-minute Stage 01 and all historical BRK/L2Pilot menus/reviews. Build a continuous distance-based seeded long journey lasting roughly 8–12 min for representative drivers (~70k game spatial units initial estimate, measure actual speed/elapsed, not a 600s imposed timer), with real start/finish, Trip Code, Replay Same, New Route, progress and final KEEP/REWORK/REJECT+difficulty. No forced interruptions or loading transitions.

CONTENT: Form a cheap logical 10-minute RoutePlan from existing 18 L1 C/E/W primitives, multi-placement L2 challenge cores and L3 city/coast/canyon phases. Vary substantial DRIVEABLE road shape and emotional rhythm across seeds: big thrilling flat-out sweepers, several readable speed-management technical bends, canyon climb/crest/long downhill, coast vista/recovery, S reversals, lane-width variety (4 lanes main, 6/8 secondary, scarce 2/3), and purposeful buffers only, NOT rigid empty approach/exit with every L2. Use old KEEP pilots as inspirations but DO NOT clone three Pilots over and over or replay previous two-minute Stage five times. Allow coherent biome order/duration differences and seeded scenery variation. Keep L3 canyon's soft bias for dramatic elevation. Do not overengineer a universal AAA planner or overhaul old sparse palms/hollow distant roadway (future v0.9.1), but NO catastrophic new unsupported road/surface.

STREAMING: REUSE the v0.8.5 bounded SceneStreamer. RoutePlan may be planned all at once as tiny parameter data, but at startup materialize ONLY a safe initial local road/support/biome 3D window, not every future chunk. Prefetch critical road/edge and scene assets well ahead of player; unload/pool behind, dispose chunk-owned GPU resources, retain shared materials, and smoothly blend city/coast/canyon worlds without input/frame lag/pop-in. Same Trip Code must always reproduce same geometry/scenery independent of chunk scheduling, including road seams, absolute feedback 's' and photo metadata. Test high world-distance precision near 70k and floating-origin only if needed by measurements. If CPU/GPU prep hitches, budget main-thread uploads and use current incremental/Worker architecture, not synchronous full route build.

KEEP UX/DRIVING: existing six-speed 300kmh flat/downhill overrun, 1.75x arcade world pace, slope and speed-sensitive Arcade Lateral Balance, responsive 144px Pixel two-thumb steering, gamepad PS4 Touchpad photo/SHARE fullscreen/OPTIONS Play-Pause, PC keyboard, 1s frozen resume, quiet skid/warm engine, private historical retrospective instant praise/issue, local telemetry export, screenshot archive and PC Open Folder/photo saved toast. New long-trip review/export must attach Trip Code, seed, L2 instance, actual ABSOLUTE distance and correct historical eventAt vs reactionAt. 10min telemetry may be several MB, don't redesign compression/cloud analytics now.

AUTONOMOUS REAL TESTS: Generate/fingerprint >=5 distinct reproducible Trip Codes. FULLY DRIVE/RECORD >=3 genuinely different full ~8–12min long routes in an actual rendering browser (at least one controlled braking driver), plus compare careful brake vs no-brake technical sections, biome transitions and driving inputs. Measure initial loading and planned-vs-materialized route coverage, frame p50/p95/p99/max near chunk/biome seams, per-chunk CPU/GPU work, ready-ahead window, and renderer.info geometries/textures/draw calls+JS heap at 0/1/3/5/8/10min. Perform >=20min synthetic soak/replay/new-seed memory and queue cancellation test. Confirm no visible gaps, physics/gear glitches, steering freeze or camera jitter at far 70k progress. Run build/unit/Playwright, 30/60fps browser/Pixel-like viewport and controller/keyboard/photo/regression tests; fix all critical failures, physical Pixel/DS4 full-duration test remains honestly UNVERIFIED unless actually available.

Commit LOCALLY and write docs/V0.9_HANDOFF.md with branch/SHAs, current PC/LAN URL, real 5 Trip Codes, 3 full journey video/evidence paths, actual duration/distance, biome/L2 route maps, input/telemetry/review proof, startup vs full-scene allocation, frame/memory trend and PASS/FAIL/UNVERIFIED with known artistic limitations. No push, merge, public deployment, new traffic, rival AI, RPG, snow/mountain/volcano art packs, giant editor, Stage 02, or v0.9.1 visual pass. STOP for OWNER'S real 10-minute multi-seed playtest and desire-to-replay judgement.
```

## Human release gate

Owner runs at least two 10-minute Trip Codes and judges driving variety, sense of travel, challenge/recovery rhythm and scene-change smoothness on preferred PC/PS4 and Pixel 8 where useful; leave instant praise/issues at exact moments and export data. If v0.9 is not actually fun, fix trip grammar/scene switching before adding car upgrades or beautiful new world assets. Future v0.9.1 scenery pass is separately authorized after user acceptance.

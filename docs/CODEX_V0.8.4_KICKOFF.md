# Codex kickoff — v0.8.4 Visual Grounding, Scenery Continuity & Photo Archive

**User has just completed v0.8.3 testing and now requests these corrections.** Prior Codex v0.8.3 local branch `codex/v0.8.3-pad-challenge`, implementation `c3c8125` / handoff `962ec67` (verify actual local tree). Screenshots and original v0.8.3 ~114.54-sec seed1 JSON were supplied in ChatGPT, NOT automatically in Windows checkout. Human observations and grounded numbers are described in `docs/V0.8.3_HUMAN_VISUAL_REVIEW.md`. Critical facts: screenshot SHARE is ergonomically inconvenient during left thumb steering, photos appear to be overwritten so only last one remains, tires penetrate/hover despite small pivot gap, distant roads look unsupported and city backgrounds empty.

Authoritative specs:
- `docs/V0.8.4_SPEC.md`
- `docs/V0.8.4_ACCEPTANCE.md`
- `docs/V0.8.3_HUMAN_VISUAL_REVIEW.md`
- updated `AGENTS.md`.

## Local branch & data safety

1. Work in real Windows `C:\astra-dev\OutRun`. Verify current branch, HEAD, origin remote, worktree clean and any parallel Goal before editing. **Local playable v0.8.3 code**, NOT remote docs-only main, is source of truth.
2. Create `codex/v0.8.4-visual-captures` from current latest playable local HEAD. Fetch `origin/main` and selectively bring ONLY `AGENTS.md`, `docs/V0.8.4_SPEC.md`, `docs/V0.8.4_ACCEPTANCE.md`, `docs/CODEX_V0.8.4_KICKOFF.md`, `docs/V0.8.3_HUMAN_VISUAL_REVIEW.md`; do NOT checkout/reset/merge docs-only main over game files.
3. Do not touch stored old BRK/L2Pilot/Stage review votes, user screenshot folders, gameplay Stage Code/seed recipe/telemetry, or unrelated project (TopWar).
4. If prior `stop-after-v0.8.3` requires explicit authorization, owner must send ordinary chat authorization within SAME OutRun Codex conversation, THEN send new Goal. Respect any permission denial; do not try to bypass a gate.

## Compact ordinary authorization (use before Goal if required)

`I authorize Project OutRun v0.8.4 — Visual Grounding, Screenshot Archive and Scenery Continuity, superseding the previous stop-after-v0.8.3 instruction. You may branch locally from the latest playable v0.8.3 and selectively import only v0.8.4 specifications. Swap the PS4 screenshot/fullscreen buttons as specified; store EVERY screenshot as a distinct PNG in a dated folder under C:\astra-dev\OutRun\captures; visually ground all four wheels on the actual rendered road surface; and make procedural road/city/coast/canyon scenery complete with lightweight terrain support, simple buildings and layered distant backgrounds. Preserve all car handling, Stage generation, telemetry and human reviews. Build/test/browser drive, commit locally and stop for my playtest. Do not push, merge, deploy or change other projects.`

## Ready-to-paste /goal

```text
/goal Implement Project OutRun v0.8.4 — Photo Archive, Wheel Contact & Procedural Scenery Continuity. Continue from latest PLAYABLE LOCAL v0.8.3 source at C:\astra-dev\OutRun (reported codex/v0.8.3-pad-challenge, c3c8125 + 962ec67, verify actual local status). New branch codex/v0.8.4-visual-captures from playable local HEAD. Fetch docs-only origin/main and selectively import only AGENTS.md, docs/V0.8.4_SPEC.md, docs/V0.8.4_ACCEPTANCE.md, docs/CODEX_V0.8.4_KICKOFF.md, docs/V0.8.3_HUMAN_VISUAL_REVIEW.md. Do not check out/merge/reset docs-only main over game source. Read all specs and study existing actual code. The actual user's photos and raw telemetry are in the ChatGPT conversation and NOT guaranteed available in Windows: use their recorded facts in human review doc; don't pretend to view source media you don't have.

P0-A CONTROLLER SWAP: DS4 TOUCHPAD CLICK (supported extra button, often button17; confirm id/mapping/indices via existing debug) now captures a real PNG in the ACTIVE steering frame, not fullscreen. SHARE/Select standard candidate button8 now toggles fullscreen and handles browser Promise success/rejection honestly; R3 screenshot fallback ONLY if Touchpad not exposed, no stale R3 fullscreen. OPTIONS Play/Pause/Resume, 1-second frozen countdown, L1 praise, Square issue, R2 gas, L2 brake, left stick, keyboard F8 and F, mobile camera preserved. Update contextual hints/tests. Physical Touchpad and fullscreen remain unverified until owner tries it.

P0-B MULTIPLE PHOTOS: investigate WHY current screenshot workflow seems to preserve only last photo. Preserve working PNG render path but save EACH shot automatically on the Windows Vite DEV server to C:\astra-dev\OutRun\captures\YYYY-MM-DD\ with collision-proof names and optional matched JSON pose metadata. Use small dev-only configureServer middleware for same-origin PNG POST, fixed project-scoped target, PNG signature/size/origin limits, no arbitrary user path/CORS, no production endpoint; gitignore captures. Client on Pixel LAN writes to running Windows server captures directory too. 12 shots in a row must create 12 valid separate PNGs remaining after page reload. UI shows saved count/path and explicit error/fallback when no server; offline/production cannot falsely claim saved to PC. NO cloud/account/gallery framework.

P0-C WHEEL/ROAD VISUAL: user photo of big canyon turn shows tires clipping/floating while pivot surfaceGap≈+0.010m. Trace actual Three.js road geometry and car/wheel/suspension/yaw transforms. Sample road mesh-consistent surface at FOUR actual wheel contact patches, including grade, crest/trough and steering; collect four measured gaps. Add small frame-rate-stable arcade VISUAL suspension/body pitch/roll and actual contact alignment/shadows so wheels stop visibly penetrating or hovering, including at high steer/steep grade. NO full rigidbody, no change to Arcade Lateral Balance physics, vehicle speed/grip or Stage shape. Capture before/after evidence at comparable steep turns, 150/300 km/h and shoulders.

P0-D GENERATED SCENERY: user screenshot of seed1 ~s8426m coast/city shows left far floating roadway with no terrain under it and right city buildings ending in empty void. Do NOT handpatch seed1 or construct full world. Extend existing L3 procedural scenery with VERY SMALL set of batched/reused low-poly terrain road-edge skirts/cliffs/retaining walls or supported bridge spans, cheap city backdrop building blocks/ground, canyon mesas and far skyline/haze. Use near/mid/far visual bands and occlusion to conceal ends and fill world, no road clipping/overshadowing (old v0.4 mountain regression). Preserve existing 2–8 lanes, biomes, seeded Stage geometry and chase camera, Pixel budget. Inspect five seeds at 3 biome transitions and s≈8426 seed1, three full rendered drives and near/far screenshots. Validate no road/support holes and before/after performance.

Do not change Stage Code, seed difficulty/handling, telemetry sample rate/storage (673KB acceptable), review votes, engine sounds, core controls, screenshot data, previous user-approved content. No traffic, rivals, RPG, Stage02, expensive AAA terrain, new biomes, cloud, public deployment, or unrelated work. Build/unit/Playwright and targeted screenshot saving/PNG decode, filesystem security, gamepad remap, wheel contact and generated world tests. Commit LOCALLY with docs/V0.8.4_HANDOFF.md (branch+SHA, PC+Pixel URL, exact captures path and 12 filenames/count, real per-wheel values + before/after screenshots, biome performance data, five seed IDs/3 full videos, PASS/FAIL/UNVERIFIED). STOP for owner's actual DS4 Touchpad/SHARE, screenshot archive and visual playtest. No push, merge or deploy.
```

## Product owner's critical acceptance

1. Can keep left thumb steering during corner and press Touchpad for screenshot without changing driving, selecting rating or pausing.
2. Every screenshot remains as a unique PNG under `C:\astra-dev\OutRun\captures\YYYY-MM-DD\`, not only the last screenshot.
3. On steep left/right turns all four tire bottoms look attached to the pavement; measured origin height alone insufficient.
4. Elevated road and building backdrops look physically embedded in a believable city/coast/canyon, generated automatically for unknown Seeds with minimal geometry.
5. Tests + honest caveats, then stop for human visual acceptance.

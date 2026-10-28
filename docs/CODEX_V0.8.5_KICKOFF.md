# Codex v0.8.5 Kickoff — Bounded Scene Streaming & Photo-Menu Trim

**HISTORICAL v0.8.5 KICKOFF: COMPLETED, DO NOT RE-RUN.** Codex locally implemented v0.8.5 (`97cff65` + `f160929`), the owner played and confirmed smooth feel, and v0.9 is now authorized under `docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md`. The historical v0.8.5 kickoff began when **the owner had commissioned v0.8.5**. This is the FIRST dependent step on the route to v0.9 ten-minute Road Trip. Do **NOT** automatically begin v0.9 or v0.9.1 inside this Goal. Previous ChatGPT planning documents are now approved for **v0.8.5 only**.

## Ground truth / source safety (read before any operation)

- User's real playable Windows app: `C:\astra-dev\OutRun`, latest Codex v0.8.4 branch `codex/v0.8.4-visual-captures`, implementation `edd7018` and handoff `4d2b6ad` (reported clean; verify actual `git status` and HEAD; user may have newer local edits).
- GitHub `michael-wang/OutRun` remote `main` contains mostly SPECS and guidance, not the working game. NEVER checkout, merge, rebase, reset or switch to remote docs-only main over the code.
- Create new LOCAL `codex/v0.8.5-scene-streaming` branch from latest PLAYABLE LOCAL HEAD, after verifying no concurrent Goal and preserving local changed files. `git fetch origin` then selectively import ONLY this kickoff, `AGENTS.md`, `docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md`, `docs/V0.8.5_ACCEPTANCE.md`, `docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md`, `docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md`, `docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md`; do not wholesale restore README/source/docs from main. Existing user-generated screenshots and reviews are protected.
- Last physical owner screenshot test showed multi-photo archive works; distant road still looked like a hollow ribbon and palms too thin/repetitive. The overriding request is **10-minute smooth driving**, but this milestone first validates **streaming current 2-minute Stage unchanged**. Art makeover belongs AFTER long drive exists. Raw uploaded user JSON/photos in ChatGPT are not guaranteed to be present at this local Windows path.
- If previous Codex Goal says STOP after v0.8.4 and automatic approval blocks local branch/fetch, user must send an explicit **ordinary (non-/goal) chat authorization IN THIS SAME CODEX CONVERSATION** before a fresh Goal. Do not bypass or endlessly retry rejected actions. Codex tooling may require user interaction, never promise behind-the-scenes work to user.

## Owner's ordinary authorization for Codex conversation (copy as a NORMAL message first)

`I explicitly authorize Project OutRun v0.8.5 — Bounded Road & Scene Streaming Foundation, superseding the previous stop-after-v0.8.4 instruction FOR THIS milestone only.

You may create a new local feature branch from my latest playable v0.8.4 source, fetch and selectively import the v0.8.5 specs, refactor current two-minute Stage One to use deterministic scene chunks with rolling prefetch/disposal and bounded CPU/GPU/frame-time cost, and update the photo UX so driving shows only a saved toast while paused/menu shows the dated capture folder and a working local-PC Open Folder action with Recent Photos removed.

Preserve the current Stage Code, seed, all L1/L2/L3 driving geometry, car handling, screenshots, controller mappings, feedback and human reviews. Measure startup, chunk hitches and memory over longer synthetic journeys, test and commit LOCALLY.

Do not push, merge, deploy, change other projects or begin v0.9 ten-minute content or a scenery-art overhaul. I will submit the separate /goal next.`

## Exact current Goal (copy AFTER authorization, as a separate message)

```text
/goal Build Project OutRun v0.8.5 BOUNDED ROAD/SCENE STREAMING FOUNDATION and compact PHOTO MENU UX.

Start with latest playable LOCAL v0.8.4 at C:\astra-dev\OutRun (reported local branch codex/v0.8.4-visual-captures, commits edd7018 + 4d2b6ad or later). Verify actual origin/HEAD/branch/worktree and no parallel Goal. Branch codex/v0.8.5-scene-streaming FROM CURRENT LOCAL playable HEAD; fetch origin/main and selectively import ONLY AGENTS.md, docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md, docs/V0.8.5_ACCEPTANCE.md, docs/CODEX_V0.8.5_KICKOFF.md, docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md, docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md, docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md. NEVER checkout/merge/reset DOCS-ONLY remote main over game source or overwrite actual user reviews/photos.

Audit REAL existing code first: sampleRoad(s), current Stage/geometry generation, L3 biome/scenery mesh creation, Three.js object ownership and Vite screenshot server; take v0.8.4 BEFORE benchmarks.

IMPLEMENT v0.8.5 ONLY: preserve existing 2-minute Stage 01 Code, seed, C/E/W road shape, difficulty, handling and scenery design; introduce a tiny logical RoutePlan versus lazily realized SceneChunks and bounded SceneStreamer window based on actual world-distance/player speed/camera visibility. Initial chunk length ~800-1000 game units, ahead ~4000-6000, behind ~800-1500, PROFILE AND TUNE; do not turn these suggestions into unquestioned constants. Materialize only initial road-safe window at startup, prefetch critical road+edge/support ahead BEFORE visible, stream optional props with LOD, release/pool behind. Shared immutable sampleRoad(s)/seed ensures seamless tangent, grade, width, lane marking and scenery reproducibility across chunks; no chunk-boundary floating/missing road or changes to arcade physics/1.75x world pace. Worker for numeric CPU data only IF profiling proves needed; use transferable ArrayBuffers; budget GPU creations/upload/disposals across frames and preserve input responsiveness. Dispose chunk-owned THREE geometries carefully but retain shared textures/materials. No ever-growing memory/cache or async queue. Inspect high s (~70k) precision and use floating-origin only if needed without altering logical positions or screenshot/report anchors.

PHOTO UX in same goal: in gameplay show just unobtrusive '📸 Saved' after real persistent PNG acknowledgment, never path/gallery. Remove Recent Photos. In paused menu show exact dated Windows PC capture folder C:\astra-dev\OutRun\captures\YYYY-MM-DD and clickable Open Folder action; from PC localhost dev only it must actually open Windows Explorer via tightly scoped Vite DEV-ONLY fixed-path user-triggered endpoint/bridge. No arbitrary remote process launch, no file:// fake link; Pixel LAN shows PC path but no fake local Android folder open; production/offline UI accurately handles fallback. Keep 12 distinct photo archive behavior, Touchpad capture, SHARE fullscreen and OPTIONS Play/Pause.

VALIDATE existing 2-minute Stage 01 under at least 3 original Seed codes: compare road centerline/heading/curvature/height/grade/width and gamepad/physics telemetry vs baseline; 3 FULL rendered drives and seam screenshots, 30/60fps across high-speed bends/crests/city-coast-canyon changes, screenshot pose/praise anchors unchanged. Measure boot time, initial GPU object length vs full route, CPU/GPU per-chunk cost, p50/p95/p99/worst frame times, active chunk count and renderer.info memory/draw calls. Run 10/20-minute virtual road-progress/soak in browser with memory plateau, shuffled chunk build-order determinism, restart/new seed cancellation, offline photo failures, security tests of folder-open endpoint and 12 unique PNGs. No actual long-mode gameplay in this version. Run production build, all unit+Playwright tests, screenshot/keyboard/PS4 mock tests, desktop and Pixel-like layouts; fix actual failures. State real physical Pixel/GPU/DS4 status honestly UNVERIFIED unless owner device tested.

Commit LOCALLY and write docs/V0.8.5_HANDOFF.md with source HEAD/SHAs, PC/LAN playable URL, benchmark and memory tables, visible seam/full-drive videos and screenshots, photo folder open test, test PASS/FAIL/UNVERIFIED and limitations. STOP for owner's driving/performance review. Do NOT start v0.9 10-minute Road Trip, Stage 02, scenery makeover, traffic, RPG, editor, any server/cloud backend, public deploy, push, merge or TopWar/other repo changes.
```

## Product Owner gate before next Goal

Codex's automated build/tests cannot verify player's real Pixel 8 GPU, actual DS4 hardware, visible camera artifacts or how seamless streaming FEELS. Owner plays current Stage via new streamer and inspects screenshot folder link/flow; if no obvious stutter/bugs, the **NEXT SEPARATELY AUTHORIZED** milestone is v0.9 ten-minute seeded trip. Do not turn v0.8.5 into a multi-day 3D engine rewrite or start new assets.

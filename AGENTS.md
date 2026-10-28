# Project OutRun — Current Codex Work Agreement (2026-10-28)

## ACTIVE OWNER-COMMISSIONED: v0.8.5 — Bounded Road/Scene Streaming Foundation

The owner explicitly said **"很好，請進行"** after approving a phased path to a **10-minute richly varied procedural road trip**. Current user authorization is ONLY for **v0.8.5**, NOT permission to implement future 10-minute v0.9 or scenery-art v0.9.1 automatically. The user wants no full-route upfront geometry build and no visible scene-load hitch.

**Latest playable LOCAL code:** Windows `C:\astra-dev\OutRun`, reported Codex v0.8.4 on `codex/v0.8.4-visual-captures`, implementation `edd7018` and handoff `4d2b6ad`. Verify actual HEAD/branch/worktree and no concurrent Goal; user may have changed files. Remote GitHub `main` is DOCUMENTATION-FIRST, **never checkout/reset/merge it over playable source**. Start a new LOCAL `codex/v0.8.5-scene-streaming` from playable v0.8.4 HEAD and selectively import only current spec/kickoff/acceptance docs.

### Required reading order

1. `docs/CODEX_V0.8.5_KICKOFF.md` — ordinary-chat authorization text and ONE bounded `/goal`.
2. `docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md` — implementation scope, performance, resource lifecycle, photo UX.
3. `docs/V0.8.5_ACCEPTANCE.md` — exact test gates.
4. `docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md` — product architecture context, **not carte blanche to build v0.9**.
5. `docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md` — authentic user photo/scenery/play observations.
6. `docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md` — dependency gates for v0.8.5 / v0.9 / v0.9.1.

### One active deliverable: stream EXISTING two-minute Stage

- Preserve original seeded Stage Code `S01-v0.8.3-r1-1-ALB1` as used through v0.8.4, track geometry/handling/6-speed+grade physics and all historic player reviews. Plan logical road cheaply; create real road/terrain/prop GPU geometry only near the player via bounded `SceneChunk` window.
- Prefetch road/edge/terrain safety assets before player camera sees them; no gap, popping or controls stall at Stage/chunk/biome transitions. Separate numeric CPU preparation from frame-budgeted main-thread GPU creation; use worker only if profiling demands it.
- Track 30/60fps frame-time P95/P99/worst, chunk ready-ahead distance, renderer.info resources/draw calls, heap and 10/20-min synthetic progress; **resources bounded after warmup**; don't claim physical Pixel pass from browser emulator screenshots.
- Minimal photo UX: in driving just tiny post-confirmation `📸 Saved`; in pause/menu show actual dated Windows captures folder and safe working **Open Folder** on localhost Windows dev, remove `Recent Photos`. Pixel LAN shows truthful PC path but can't launch PC Explorer from remote page. Photo PNG multi-save/metadata must keep working.
- NO new 10-minute route in this goal; NO Stage difficulty change, scenic makeover of hollow ramp/palm trees, new biomes, traffic, rivals, RPG/garage, editor, cloud service or user-data upload. Visual failures reported v0.8.4 remain for eventual v0.9.1; streamer must not introduce new visible gaps.
- Preserve Pixel 8 landscape/PWA, 144px thumb steering, keyboard, tested PS4 Touchpad screenshot/Share fullscreen/Options Play-Pause, L1 praise/Square issue and 1s resume, private JSON telemetry, all approved audio and driving.

### Repo, permissions and STOP

Prior Codex stop-after-v0.8.4 may block new file operations. Owner should send the **ordinary non-/goal authorization** in existing OutRun Codex chat before the new Goal; respect permission rejections without bypass. No work in `TopWar` or other repos. No push, merge or deployment. Commit LOCALLY on new feature branch, create `docs/V0.8.5_HANDOFF.md` with real test results and STOP for owner before any new v0.9 Goal.

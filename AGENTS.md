# OutRun — project operating guidance (2026-10-28)

## STATUS: v0.8.4 complete locally; 10-minute streaming road trip PLANNED, NOT AUTHORIZED

Latest owner-playtested local v0.8.4: \`codex/v0.8.4-visual-captures\` with implementation \`edd7018\` and handoff \`4d2b6ad\` reported by Codex. Working tree reported clean; source is **local Windows** \`C:\astra-dev\OutRun\`. Remote GitHub \`main\` remains **documentation-first**, not the playable application. **Never checkout, merge or reset main over local game code**. Before any authorized work verify actual local playable HEAD and parallel Goals.

**Fresh owner review after v0.8.4:** Multi-photo save works to \`C:\astra-dev\OutRun\captures\YYYY-MM-DD\`. Photo "saved" acknowledgement should be tiny during driving; menu should show dated captures folder + click to actually open that Windows folder from local PC, removing \`Recent Photos\`. Two screenshots still show visibly floating/hollow distant uphill road and unnaturally uniform/thin palms despite v0.8.4 passing automated tests.

**Override in product priorities:** Owner wants **10-minute varied scenic drive**, not further isolated art polish of current two-minute course. Startup must not load/build the full 10-minute geometry and scene switching must be **imperceptible / without lag**; CPU/GPU memory usage bounded. See **required planning docs**:

1. \`docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md\` — exact new human test, two screenshots and 114.95-sec telemetry.
2. \`docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md\` — lightweight whole-route L1/L2/L3 plan, lazy SceneChunks, near/mid/far, deterministic streaming, floating origin, GPU resource ownership, photo menu.
3. \`docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md\` — sequential v0.8.5 (2-min streaming parity and photo menu), v0.9 (10-min distinct route), v0.9.1 (meaningful far-road and lush vegetation art fix) gates.

**Crucial:** These are **PLANS ONLY**. Do not initiate any local development or assume a new Goal was authorized. Await an explicit ordinary ChatGPT Codex authorization and corresponding Goal. Previous stop-after-v0.8.4 remains respected. Each later goal branches from the latest completed PLAYABLE local HEAD and selectively imports only approved new specs; no push, merge, deploy, Stage 02, unrelated work.

**Existing owner-approved systems to preserve by default:** Three.js + TypeScript Vite; 1.75x arcade world pace; Arcade Lateral Balance controls (not physical steering model); six real upshifts and hill-sensitive speed; stage seeded L1/L2/L3, 2–8 lanes, canyon/coast/city, performance-friendly stylized art; Pixel 8 landscape/PWA 144px thumb steering and gas/brake; keyboard and gamepad steering, feedback, Options, Touchpad photo, Share fullscreen; 1.0-sec resume freeze; private telemetry, photo archive, original owner ratings/reviews.

**Never claim screenshots and raw owner JSON are present on the Windows local checkout merely because they were uploaded to ChatGPT.** Their observed findings are carefully transcribed in the docs. v0.8.4 kept stageCode \`S01-v0.8.3-r1-1-ALB1\` intentionally. Do not label it as outdated solely from StageCode. Human visual and real-phone driving acceptance override green scripted test counts.

# OutRun — Active Codex operating agreement

## ACTIVE OWNER-COMMISSIONED NEXT: v0.8.4 — Real Screenshot Archive, Wheel Contact & Scenery Continuity

**Previous v0.8.3 implementation COMPLETED locally and human-playtested.** Codex reported local branch `codex/v0.8.3-pad-challenge`, implementation `c3c8125` and handoff `962ec67` with clean working tree. VERIFY current local HEAD before branching; remote GitHub `main` is docs-only and **NEVER checkout/reset/merge it over playable local code**. Human provided two actual photos and exported `S01-v0.8.3-r1-1-ALB1` seed1, 114.54sec telemetry (saved in ChatGPT, not automatically on Windows). **There is no explicit KEEP/REWORK/REJECT for this v0.8.3 route.** Preserve all previous reviews.

**Human's newly reported problems:**
1. SHARE button for screenshot technically works but is awkward: removes steering thumb and loses moment. **SWAP** Touchpad CLICK = Screenshot; SHARE/Select = Fullscreen. OPTIONS Play/Pause/Resume and other pad controls untouched; R3 = Screenshot fallback only when touchpad click unsupported.
2. Current photo flow appears to keep only latest image. Save EACH captured PNG immediately to `C:\astra-dev\OutRun\captures\YYYY-MM-DD\` under Windows Vite development server using small fixed-path **DEV-ONLY** middleware. Unique filename and (optional) metadata JSON; 12 shots → 12 PNG files. Gitignore captures; show saved path/count; clear fallback if offline/prod. No cloud/gallery project.
3. Four tire contact visuals clip or hover during turns/grades despite reported center `surfaceGap≈0.010m`. Sample contact at **all four wheel footprints against actual road render mesh**, visually align body/wheels/suspension/shadows without changing arcade driving dynamics or building a physical vehicle simulation.
4. Procedural scenery gaps: far road floating with unsupported underside; buildings behind first row are empty. Build cheap reusable **L3 terrain skirts/embankment/bridge supports, secondary city silhouettes and layered distant scenery**, with near/mid/far occlusion and deterministic biome compatibility. No AAA open world or handpatching one seed.

**Required reading before code:** `docs/V0.8.4_SPEC.md`, `docs/V0.8.4_ACCEPTANCE.md`, `docs/CODEX_V0.8.4_KICKOFF.md`, `docs/V0.8.3_HUMAN_VISUAL_REVIEW.md`.

### Repo and scope safety

- LOCAL playable Windows repo is `C:\astra-dev\OutRun`. Start `codex/v0.8.4-visual-captures` FROM local PLAYABLE v0.8.3 HEAD; `git fetch origin` then selectively import ONLY newest AGENTS and v0.8.4 docs plus human review from origin/main. Never erase source by switching to docs-only remote main.
- Previous `stop-after-v0.8.3` gate might require ordinary non-`/goal` authorization in SAME OutRun Codex conversation; respect approval decisions and never loop on denied actions.
- Preserve actual Stage `S01-v0.8.3-r1-1-ALB1` code, existing 18 L1 / L2Pilot/BRK reviews, prior Stage REWORK, algorithmic L2/L3 geometry & stage difficulty, six-speed physical speed / uphill/downhill, Arcade Lateral Balance, 1.75x world pace, soft audio, 144px Pixel8 steering, mobile/keyboard controls, PS4 left stick+R2+L2+L1+Square/OPTIONS, 1s resume, screenshot renderer and telemetry.
- User's v0.8.3 human telemetry: **114.54sec, GAS ~94.1%, brake 3.07sec / seven presses, offroad 0**, documented. **NO Stage difficulty tuning this time**; owner only asked screenshot usability, tire contact and procedural scenery. No formal vote fabricated.
- No new traffic, rival opponents, RPG/garage, new biomes, Stage02, AAA terrain, accounts/cloud, telemetry compression, video recorder, unrelated project (TopWar), push/merge/deployment.
- Run build + unit + Playwright, real test PNG file count and checksums, input context switching & browser fullscreen handling, 4-wheel surface gaps over crest/turn/shoulder, 5 generated Seeds and 3 full Stage visual drives, performance comparison. Correct any problems; local commit(s), handoff `docs/V0.8.4_HANDOFF.md` and STOP for owner PS4 Touchpad screenshot / Scenery playtest. Physical hardware stays UNVERIFIED until owner checks.

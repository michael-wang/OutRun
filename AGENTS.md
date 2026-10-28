# Project OutRun — current Codex operating agreement

## ACTIVE USER-COMMISSIONED: v0.8.2 Driving Evidence, Screenshot & Stage 01 Challenge

**Current human review:** the owner drove `S01-v0.8.1-r1-1-ALB1` and voted **REWORK, difficulty 2 (Moderate)** with note `I want it to be more challenging!` (visible owner-uploaded screenshot). Latest playable v0.8.1 local implementation `fdbf575` + handoff `db5ab4e` or later. DO NOT misstate this as human KEEP or claim all seeds were rejected. Historic original summary: `docs/reviews/V0.8.1_SEED1_HUMAN_PLAYTEST.md`. The owner additionally supplied a user reference MP4, but this ChatGPT runtime's video extractor failed; do not assume the clip is available to Codex as a local file or pretend to have analyzed it.

**Six user requests:**
1. Make actual six-speed **gear shift speed dips more perceptible**, using REAL force/drag and powertrain transient—not subtracting arbitrary km/h from HUD; preserve nonlinear gear power, warm sound and 300 flat top.
2. **Flat nominal 300**, downhill grade can exceed it and uphill full-GAS cannot remain pinned at 300, from same road grade and longitudinal mechanics; gauges/6th gear and 1.75× progression behave above 300.
3. One-button **screenshot in active driving**, PS4 **L1+L2 chord** (L1 alone = praise, L2 alone = brake), PC F8 and small mobile camera. Capture actual rendered road/car and bounded local photo save/PNG export plus road/car pose info. User perceives car floating over road while turning; that visual bug remains UNVERIFIED until captured.
4. **Full-stage driver telemetry**, bounded sampled local speed, gas/brake, steering, grade, road width/x/edge, gear/RPM, active L2/biome and event markers; finish a human-readable per-stage/per-L2 summary + Export Drive Report JSON. Metrics include time and distance near 270/285/300, braking and edge/offroad rates. Never auto-determine human fun/vote.
5. After closing menu/pause/feedback to resume in-progress game, **1.0 real second visible READY countdown**, world + stage timer + telemetry still frozen; neutralize stale held input, no fake distance.
6. **Clean Stage One UI**: remove only Stage menu `Original Bricks` LINK (not actual Brick Lab), remove giant generic keyboard-shortcut sentence, remove `Profile details`. Keep actual useful inline button shortcuts and reviews/controls.

**Plus:** Owner finds Stage 01 too easy (usually near 300km/h). Use telemetry first, then retune a few explicitly readable brake-required driving challenges without destroying fun high-speed sweepers. New generated Stage uses NEW version and UNREVIEWED fresh ratings; old Stage v0.8 Seed1 REWORK and screenshot v0.8.1 Seed1 REWORK remain intact.

### Authoritative docs / order

1. `docs/CODEX_V0.8.2_KICKOFF.md` — safe prep and ready Goal.
2. `docs/V0.8.2_DRIVING_EVIDENCE_SPEC.md` — detailed physical/photo/telemetry/menu requirements.
3. `docs/V0.8.2_ACCEPTANCE.md` — actual force, screenshot, data and Stage seed evidence.
4. `docs/reviews/V0.8.1_SEED1_HUMAN_PLAYTEST.md` — user screenshot review and limitations.
5. Existing v0.8.1 source/handoff and prior v0.8 r1 REWORK, original pilot/BRK human reviews.

### Source safety and QA

- Work only in the actual local Windows `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. GitHub `main` is DOCUMENTATION-first and must NEVER overwrite, reset or be merged over the working game. Branch `codex/v0.8.2-driving-evidence` from CURRENT PLAYABLE LOCAL HEAD. Fetch docs-only main and selectively import the active v0.8.2 docs + AGENTS, preserving any uncommitted changes and user browser history.
- If stop-after-v0.8.1 blocks Codex sandbox permissions, require the owner's ordinary explicit authorization in SAME OutRun Codex conversation; no bypassing rejected action.
- Preserve accepted Arcade Lateral Balance, 6-gear 300 flat road, hill-force, warm engine, quieter skid, 144px mobile steering and compact HUD, actual PS4 controller mapping/quick retrospective praise, keyboard/menu controls, original L1 library + multi-placement L2, 2–8 real lanes and 3 scenic worlds.
- No blanket gearbox simulation rewrite, stage-specific hidden grip, new Stage 02, traffic/rivals, garage/coins/RPG, photo editor, screenshot cloud service, GPS, live AI, broad editor, other-repo edits (`C:\astra-dev\topwar`), push/merge/public deployment.
- Run actual browser driving (≥5 deterministic seed generation, 3 full recorded Stage 01 drives including brake/no-brake contrast), visible PNG export & vehicle photo, physical speed/shift/grade telemetry at 30/60fps, keyboard/PS4/multitouch 1-second countdown, build/unit/Playwright. Commit LOCALLY and write `docs/V0.8.2_HANDOFF.md` with exact PC/LAN URL and honest PASS/FAIL/UNVERIFIED.

**STOP after v0.8.2 for user multi-seed driving + floating-car screenshot review; do not automatically develop Stage 02 or public deploy.**

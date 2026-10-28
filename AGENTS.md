# OutRun — Active Codex operating instructions

## ACTIVE OWNER-COMMISSIONED: v0.8.3 — PS4 Screenshot, One-Button Menu & Stage Challenge

**Last human test:** v0.8.2 implemented locally on `codex/v0.8.2-driving-evidence`, reported implementation `661c571` and handoff `dfa6b0f` (verify actual playable LOCAL HEAD). User delivered ~673KB real driver telemetry from `S01-v0.8.2-r1-EVMPD9-ALB1`, says Stage One is more fun but wants more challenge. **No explicit KEEP/REWORK/REJECT vote for this specific Stage Code**; do NOT forge one.

**CRITICAL HARDWARE FAILURE:** Real physical Sony PS4 DualShock 4 `L1+L2` screenshot failed: opening praise/report rather than capturing PNG. Mouse screenshot PASS. Simulated 30/60fps chord tests were green but hardware reality overrides them. User's DS4 photo points to SHARE/Select small button and large clickable Touchpad. Use single SHARE screenshot, not chord.

**Read:** `docs/CODEX_V0.8.3_KICKOFF.md`, `docs/V0.8.3_CONTROLLER_CHALLENGE_SPEC.md`, `docs/V0.8.3_ACCEPTANCE.md`, `docs/V0.8.2_DRIVER_R1_ANALYSIS.md`.

### Work in order

1. **P0 actual DS4 screenshot fix:** remove `L1+L2` chord; map `SHARE` (standard `buttons[8]` candidate) to existing screenshot real PNG; one action/press, no L1 praise, L2 brake, menu conflict. Real user's Share vs Touchpad button mapping should be discoverable from `gamepad.id` / `mapping` / `buttons.length` and minimal Controls diagnostic; physical USB/BT status remains UNVERIFIED until owner presses Share.
2. **P0 one-press gamepad actions:** `OPTIONS` (standard `buttons[9]`) Play/Play Again from menu, Pause in active drive, Resume via existing 1.0s frozen countdown. `Touchpad CLICK` (extra `buttons[17]` if present) toggle Fullscreen, otherwise `R3` (standard `buttons[11]`) fallback. Browser Fullscreen `requestFullscreen` Promise can reject; never claim success merely because a button was pressed. Show actual controller shortcut hints and keep native keyboard `P/F/F8`.
3. **P0 Stage generator challenge:** real user Stage telemetry: 117.30sec, 93.2% held gas, 2.7% held brake, 9 brake presses, 0 offroad, four of eight beat sections no brake, five presses concentrated S01-07. Preserve accepted wide open full-gas sweepers; add multiple clear brake-beneficial/required driving episodes, not just globally tighter roads or narrow lanes. Pair NO-BRAKE vs controlled-brake on ≥5 seeded stages with current Arcade Lateral Balance; produce 3 full actual rendered drives with notes for human seed review.
4. **DO NOT** "fix floating car" until user can capture an actual turning screenshot and we inspect contact/shadow/pose. Preserve screenshot diagnostic metadata.
5. **NO TELEMETRY COMPRESSION**: ~673KB/2 minutes accepted by user. Keep local 0.1s driving report, no new cloud upload/analytics.

### Repo safety, preservation, human gate

- LOCAL live source `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. Current GitHub `main` contains chiefly specifications, NOT code. NEVER checkout/merge/reset docs-only remote main onto playable local source. Start `codex/v0.8.3-pad-challenge` from actual last playable LOCAL HEAD after checking branch/status/active Goals; selectively import only this `AGENTS.md` and newest v0.8.3 docs.
- Preserve six-speed 300 flat / downhill overrun, gear shift dips, 1.75x arcade flow, grade and speed-sensitive lateral handling, warm engine + soft skid, existing local screenshot renderer, 144px mobile thumb/compact HUD, keyboard/menu controls, PS4 thumbstick/triggers/L1 praise/Square issue, 1.0s resume, Stage reports, 18 L1, v0.7D Pilot human KEEP, BRK human reviews and old v0.8 Stage REWORKs.
- New v0.8.3 stage version and fingerprints must start UNREVIEWED. Do not rewrite actual historical user telemetry or pretend old v0.8.2 Stage vote exists.
- Run build/unit/Playwright, real 30/60fps mocked pad and 5 seeded Stage tests, 3 complete video runs; local commits and `docs/V0.8.3_HANDOFF.md`. **STOP for owner's physical DS4 Screenshot and Stage playtest.**
- No unapproved push, merge, deploy, TopWar/other repo edits, new traffic, RPG/garage, huge Stage editor, mountains art, Stage 02, accounts or remote telemetry. If Codex auto-review blocks local branching because of prior stop-after, ask owner explicit ordinary non-`/goal` authorization within SAME OutRun Codex chat and respect denials.

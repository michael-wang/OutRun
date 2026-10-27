# Project OutRun — Codex operating agreement

## ACTIVE: v0.7C.1 Compact Steering + Six-Speed + 300 km/h + Warm Audio

The owner urgently requests much SHORTER horizontal steering-bar thumb travel on mobile (child and adult cannot comfortably reach far end), six actual automatic gears with audible shifts, an attainable 300 km/h with more satisfying acceleration, and a warmer, less shrill engine tone. This is TASK 1 and is owner-authorized.

### TASK 2, DEPENDENT and NOT to run automatically
v0.7D True Multi-Placement L2 Composer is PREPARED but NOT ACTIVE: must start only AFTER v0.7C.1 is locally finished, committed, **human-playtested**, and a new Codex Goal is authorized. It uses the updated car speed/controls. No concurrent Goals on the same checkout. See `docs/V0.7D_TRUE_L2_COMPOSER_SPEC.md`.

## Read first
1. `docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md`
2. `docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md`
3. `docs/V0.7C1_ACCEPTANCE.md`

The v0.7D docs are future-only, not permission to start a second task.

## Source and permission protection
- Work ONLY in `C:\astra-dev\OutRun`, remote expected `michael-wang/OutRun`. Last reported local playable v0.7C commits `c87860a` / `ec7f844` or later; verify actual HEAD, branch and uncommitted files.
- Remote GitHub `main` holds primarily specifications, NOT the source tree. Never merge/reset/check it out over playable local code. Start `codex/v0.7c1-compact-steering-powertrain` from latest playable LOCAL HEAD and selectively import only current Task 1 documents / this AGENTS.md from origin/main.
- Preserve the original 8 accepted BRK r2 challenges, R1/R2 reviews, the 18 technical L1 profiles and old v0.7C L2 feedback/rejections; new v0.7D compositions are not part of this task.
- Prior stop-after-v0.7C was a milestone review boundary, not a permanent ban. If automated approval still blocks Git actions, seek explicit owner permission in ordinary SAME Codex chat, respect manual sandbox approvals, never bypass denied actions.
- Do not modify TopWar or other projects; no unapproved push/merge/public deployment, paid services, remote telemetry or unlicensed SEGA/Ferrari assets.

## Required v0.7C.1 work
1. SHORTEN ACTUAL touch travel (candidate 120–160 CSS px full lock-to-lock at mobile landscape), keep full ±1 steering and four soft detents each side, accurate hysteresis, left/right hand swap and two-thumb gas/steer.
2. Implement six real auto gears with RPM rise/drop and five shifts; slower but enjoyable acceleration to TRUE 300 km/h (benchmark old; first target 0→300 around 20–28s), preserve 1.75× world pace and approved Arcade Lateral Balance.
3. Improve engine WebAudio harmonic timbre and shift/RPM response, gentle to ears; preserve mute/audio gestures.
4. Real browser PC/Pixel-like touch/audio test, build/unit/Playwright, record actual old/new thumb px reach, speed/gear traces and audio, commit locally and hand off `docs/V0.7C1_HANDOFF.md`.

**STOP AFTER v0.7C.1 for actual user phone/gear/audio review. No automatic v0.7D or v0.7B.**

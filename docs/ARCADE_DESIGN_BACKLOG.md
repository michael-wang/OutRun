# OutRun Roadmap — v0.8.2 Human Driving Evidence → v0.8.3

## What human data now proves and does not prove

One actual `v0.8.2-r1` Stage One human drive (117.30sec, Stage Code `S01-v0.8.2-r1-EVMPD9-ALB1`) completed; gas held 93.2%, braking 2.7%, 9 presses, offroad 0; four of eight beats had NO brake, beat 07 five. Fast 300km/h broad turns can still be exciting, so don't globally require braking in every beat. A previous `v0.8/v0.8.1` Stage Seed 1 was human REWORK, while the latest human said the Stage is "變好玩了" but still wants more distinct challenges. No human vote was explicitly submitted for latest `v0.8.2` Stage; do not forge it. See `docs/V0.8.2_DRIVER_R1_ANALYSIS.md`.

**Hardware vs machine discrepancy:** Codex mock-tested PS4 `L1+L2` screenshot and reported PASS, but actual DS4 user test FAILS (L1 praise screen opens). Existing mouse PNG capture succeeds. Screenshot arbitration needs single SHARE input, measured on actual DS4. Owner provided pad photo showing SHARE and touchpad, and wants one-press controller Play/Fullscreen.

## CURRENT ACTIVE: v0.8.3 Screenshot + Stage Challenge

1. Retire screenshot chord. Prefer **SHARE** single-button screenshot; supported standard DS4 Back/Select slot candidate `buttons[8]`. Do NOT steal L1 praise or L2 brake. Keep existing real rendered PNG with diagnostic metadata and actual local download. Add small mapping diagnostic and clear current gamepad hints. Physical device retest required.
2. **OPTIONS** one-button Play/Play Again in menu, Pause in drive, Resume via existing 1.0-second freeze. **Touchpad CLICK** toggles fullscreen when browser supplies additional button; otherwise **R3** fallback. RequestFullscreen needs browser activation and Promise success; handle rejection, not pretend enabled. Keep Cross+Focus/Dpad and keyboard shortcuts.
3. Stage One keep existing 100–150s generated seeded scenic road, 4lane majority and coastal/canyon grade/style, but add **2–4 initial candidate** clearly differentiable speed-management/challenge moments in middle/end. The user still wants lots of high-speed fun; use optional L3 recovery and readable braking curves, not globally harder grip or 2-lane narrow traps.
4. Compare five seeded NO BRAKE driver vs BRAKING driver and at least three full rendered Stage drives; collect per-beat telemetry and demonstrate where a no-brake driver cannot preserve lane/edge despite full steering while a controlled driver can. Preserve original saved Stage Codes/reviews and new gen revision.
5. 673KB / 2min Telemetry is acceptable per human. No compression work, cloud upload or new analytical pipeline.

See `docs/V0.8.3_CONTROLLER_CHALLENGE_SPEC.md`, `docs/V0.8.3_ACCEPTANCE.md`, `docs/CODEX_V0.8.3_KICKOFF.md`.

## FOLLOWING HUMAN acceptance, not now

Review the new user screenshot of perceived hovering car through wheel-road contact, shadow, tilt and camera/vehicle alignment; only then commission any actual 3D visual correction. Continue seed variety and physical hazard/traffic L1 modules AFTER the first stage actually feels fun with varied driving choices. Longer 5min Guided Pacific Trip, Mystery Drive, new biomes, car choices, and optional RPG income/garage much later. No AAA feasibility optimizer, feature factory, auto human KEEP, unbounded Stage Editor, Stage 02 or unrelated repo edits.

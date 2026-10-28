# OutRun roadmap after v0.8.1 Stage 01 human REWORK

## Current product gate

**One HUMAN Stage 01 seed review**, `S01-v0.8.1-r1-1-ALB1`: **REWORK / 2 (Moderate)** and note `I want it to be more challenging!`, screenshot on-screen finish `1:46`, `1 praise / 0 issue`. The uploaded video for shift comparison was received in ChatGPT but not directly decoded here; don't claim measured visual dip values. Archive: `docs/reviews/V0.8.1_SEED1_HUMAN_PLAYTEST.md`. Last delivered local v0.8.1 `fdbf575` / `db5ab4e`, build/test pass per Codex (source not on GitHub docs branch).

## ACTIVE: v0.8.2 — evidence driven driving feel, Stage One challenge

**P0 vehicle**: shift transients actually briefly reduce road speed when integrated drag/driveline torque makes net negative a (not direct speed subtraction). 300 nominal flat equilibrium, downhills able to exceed 300, uphills full gas not pinned; gauge/6th gear/speed-sensitive curve handling remain coherent, six-speed warm sound and 1.75× optics.

**P0 photo**: PS4 **L1+L2** chord one image of live car/road with on-screen/metadata Stage Code, speed, steering/height and current car pose to capture suspected "floating" rendering on bends. PC F8, optional touch camera. Ensure L1 rating & L2 brake precedence, no accidental screenshots or black PNG; local photo gallery/export only. If image download blocked by gamepad, keep photo and let owner Save PNG later.

**P0 player run telemetry**: locally sample whole Stage run, summarize near-300 time+distance share, pedal/gear/brake events, lateral error/offroad and per-L2 difficulty, relate to actual praise/issues. Human review independent, export one self-contained Drive Report JSON. Only retain bounded sessions, no cloud. This becomes future iterative generation evidence.

**P0 resume**: closing an overlay to active game shows 1.0s READY hold, physics+Stage clock+telemetry frozen; safe neutralized inputs.

**P0 Stage UI cleanup**: remove only Stage menu `Original Bricks` link, long keyboard shortcut legend `P Play · R Replay · N New Route · C Controls · M Sound · F Fullscreen · E Export · K/W/X Vote · 1–5 Difficulty` and `Profile details`; do not delete historic Lab or reviews. Maintain useful real per-button keyboard/PS4 hints and essential Stage actions.

**P0 Stage difficulty**: benchmark current Seed's mostly near-300 drive with telemetry; gently re-tune generator so readable turns force real braking at some moments and exciting fast sweeping remains. Tests 5 seeded stages + 3 full rendered drives and no-brake contrast; human must review new Stage version. No fake grip or AI optimality solver.

Source: `docs/V0.8.2_DRIVING_EVIDENCE_SPEC.md`; `docs/V0.8.2_ACCEPTANCE.md`; `docs/CODEX_V0.8.2_KICKOFF.md`.

## Later only

Stage 01 multi-seed human KEEP, then Stage 02 / five-minute Guided and Surprise road trips, new terrain/obstacle/traffic/rival packages, Garage/RPG progression once replay is genuinely enjoyable. No huge editor/planner and no other-repo work.

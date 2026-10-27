# OutRun roadmap — Stage 01 human REWORK and next iteration

## Latest review: v0.8 Stage One needs rework

Original seed `S01-v0.8-r1-1-ALB1`: user voted **REWORK**, difficulty **2/5**, note "Could use more L2 blocks." No Stage One KEEP. Exact archived source `docs/reviews/V0.8_STAGE01_SEED1_HUMAN_FEEDBACK.json`.

Technical diagnosis from USER EXPORTED Stage Code:
- 13,500-unit route, eight ~1,450-unit "beats", each ONE C + ONE E + ONE W.
- Explicit curvature segments total 6,143 units = 45.5% of route; no explicit C in remaining 54.5% though grade/width may still vary. Inter-curve gaps 732–930 units.
- Four of eight width profiles target 4→2 bottleneck, making narrow roads too frequent; actual drivable 2-lane distance must be measured separately from event count.
- Six-speed speed ramp looks nearly linear and shifts don't create sufficient real acceleration/speed transients for satisfying gear progress.

## ACTIVE: v0.8.1 Powertrain Feel & Stage One Rhythm

**Car:** benchmark and refine 6 gear wheel torque/RPM/shift force, drag v², real integrated acceleration: hard early acceleration, diminishing high-gear/300 approach and small REAL shift-speed dips when force temporarily below drag (not fake km/h subtraction). Preserve warmer engine and other approved handling.

**Composition:** L2 = compact multi-event driving challenge, not compulsory long lead-in/exit; L3 = stage director stitching L2 with **optional varied** transition buffers/reveals/brake warnings, not fixed long straight repeated between every core. Preserve Stage 01 nominal ~100–150s by filling with enjoyable driving events rather than padded emptiness. Compare after vs before in C occupancy/gaps, actual brake/steer sequences, biome scenery.

**Lane policy:** 4 lanes dominate ~55–70% of stage distance; 6–8 ~20–35%; rare 2/3 <=10–15%. These are initial content targets not inviolable rules, and 3 actual lanes deferred if current marking/mesh doesn't truly support it. Avoid repeating 4→2 W04 in 50% of Stage beats. Sample per-seed real width distance shares and keep offroad/rail width coherent.

**Acceptance:** at least five deterministic generated Stage codes and three full browser-driven recorded runs with actual mechanics, visually varying travel and mobile/PS4 regressions. HUMAN GO/REWORK only after personally replaying multiple seeds. Source of truth: `docs/V0.8.1_POWERTRAIN_STAGE_RHYTHM_SPEC.md`, `docs/V0.8.1_ACCEPTANCE.md`, `docs/CODEX_V0.8.1_KICKOFF.md`.

## Later only / NOT currently authorized
- If v0.8.1 genuinely fun, additional Stage 01 seed variety or longer five-minute Guided Pacific Road Trip, Mystery Drive discovery, richer L3 scenery packs and later physical traffic/obstacles.
- Reward/RPG economy, car garage, new models after fun repeat play; no unsolicited AAA constraint engine or expensive Stage Editor.

**Archive old approvals**: Three original v0.7D Pilot L2 (KEEP), later v0.7D.1/.2 pilot reviews, BRK-r2 eight KEEP, original failed v0.7C first-four REJECT. None of those votes automatically approves Stage One or its revised new seeds. Preserve original export versions and timestamps.

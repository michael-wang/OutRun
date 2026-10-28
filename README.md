# Project OutRun

An original Three.js + TypeScript arcade road-trip driving game, PWA/landscape Pixel 8 oriented, inspired by classic Out Run while using original art. Future title should be original.

## Current NEXT milestone: v0.8.4 — Visual Grounding & Photo Capture Archive

**Latest human-playtested playable source is LOCAL Windows v0.8.3**, reported `codex/v0.8.3-pad-challenge` (`c3c8125` + `962ec67`). This GitHub repository's `main` is documentation-first, **not a replacement for playable local source**. Start a new feature branch from genuine playable local HEAD and selectively import only new docs.

Human has supplied two actual v0.8.3 screenshots and a new **114.54-sec seed1** driver report. See [human screenshot review](docs/V0.8.3_HUMAN_VISUAL_REVIEW.md). The owner has **NOT formally voted** KEEP/REWORK/REJECT on this exact version; preserve historical reviews.

### What v0.8.4 should deliver

| Area | Owner's desired result |
| --- | --- |
| **PS4 controls** | Swap: **Touchpad CLICK = instant screenshot**, **SHARE = fullscreen**. R3 screenshot fallback if touchpad button absent; OPTIONS Play/Pause/Resume, L1 praise, Square issue, triggers, keyboard and Pixel camera unchanged. |
| **Capture archive** | Every screenshot saved as unique PNG immediately into **`C:\astra-dev\OutRun\captures\YYYY-MM-DD\`** when Vite DEV server is running on Windows. 12 shots → 12 accessible files; keep metadata, no overwritten last image; secure fixed-path dev-only middleware, clear offline fallback and save status. |
| **Four tire contacts** | Per-wheel road-height sampling and lightweight Arcade Visual Suspension/roll/pitch/shadows so visible wheels stop sinking into/floating over the actual road mesh on steep bends and crests. Do not change Arcade Lateral Balance driving physics. |
| **Procedural L3 scenery** | Minimal reusable terrain shoulders/skirt/embankment/cliffs/bridge supports, cheap city back-row masses and horizon layers so elevated roads and roadside buildings feel embedded in city/coast/canyon. No full 3D open world, no single-seed hardpatch. |
| **Human acceptance** | Photos taken DURING steering, 12 distinct disk PNGs, near/mid/far screenshots in 5 seeded stages, 3 complete drives, build/unit/E2E and performance; then STOP for owner's real PS4 and visual review. |

### Authoritative files

- [AGENTS.md](AGENTS.md) — active scoped task and local repository safety
- [v0.8.3 Human visual/drive review](docs/V0.8.3_HUMAN_VISUAL_REVIEW.md) — real seed1 and two screenshot cases
- [v0.8.4 specification](docs/V0.8.4_SPEC.md) — DS4, secure local photo archive, tire grounding, procedural scenery
- [v0.8.4 acceptance criteria](docs/V0.8.4_ACCEPTANCE.md) — reproducible visual and screenshot proof
- [Codex v0.8.4 kickoff](docs/CODEX_V0.8.4_KICKOFF.md) — ordinary authorization and independent Goal

Prior user-approved core: genuine 3D road/car with visual speed multiplier 1.75x, Arcade Lateral Balance, 144px responsive mobile thumb steering, 2–8 lane dynamic width and variable steep grade, six gears/~300flat/downhill >300, grade-sensitive traction and power, keyboard/PS4/Pixel controls, positive/issue retrospective feedback, procedure-generated deterministic L1+L2+L3 Stage01 seeded city/coast/canyon, warm engine and quieter tire squeal, screenshot/pose metadata, private local 0.1s drive telemetry. **Do not retune Stage difficulty, change seed codes or rewrite human reviews in this milestone.**

Work remains LOCAL on Windows `C:\astra-dev\OutRun`; GitHub main contains only specifications. No push/merge/deploy, Stage 02, RPG, unrelated project edit.

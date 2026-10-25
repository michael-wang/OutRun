# Project OutRun

**An original 3D arcade racer inspired by the *driving experience* of classic 1986 Out Run and 2003 OutRun 2.** This is an independent homage, not an authorized remake. `Project OutRun` is an **internal codename**; `SUNSHIFT GT` is only an uncleared candidate public title. Do not copy SEGA/Ferrari logos, models, artwork, music, code or character designs.

## Current milestone: v0.4.1 — Analog Arcade Steering & Rescue

**Product owner decision:** 1.75× world pace remains accepted. v0.4's handling regressed badly and the player reported road discontinuity. The next priorities are **regression repair**, not new gameplay:

1. **P0:** REPLACE binary on-screen left/right buttons with a **continuous horizontal absolute-position steering strip** on Pixel 8; PC A/D move the same virtual steering point. Direct arcade response with rapid wheel self-centering but NO vehicle lane-centering.
2. **P0:** Resolve sluggish steering/yaw inertia by comparing v0.3.2 vs v0.4; preserve accepted 1.75× world pace and independent player steering. Diagnose/fix road discontinuity with at least 120 seconds' continuity checks.
3. **P0:** Replace upper-right numeric-only HUD with a **LEFT-of-car analog needle speedometer + digital km/h**, responsive and non-overlapping with new steering strip or pedals.
4. **Preserve:** PC A/D steering, Space accelerator, Enter brake; Pixel 8 two-thumb/fullscreen/PWA, long-press fix, bounded off-road slowdown.
5. **Deferred:** Further track difficulty, convertible, occupants, scenery themes and new modes.

**Important repo structure:** GitHub `main` is primarily **design specifications**. The playable v0.4 implementation exists on the **local Windows checkout**; it was reported committed at `04a1f2b` (implementation) + `ba76b22` (handoff). Do not replace this working local code with the documentation-only remote branch.

## Start here

| File | Why it matters |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current Codex autonomy, safety and active milestone instructions |
| [v0.4.1 product specification](docs/V0.4.1_SPEC.md) | Virtual analog steering strip, direct arcade response, road continuity, needle dial |
| [v0.4.1 acceptance](docs/V0.4.1_ACCEPTANCE.md) | Touch/keyboard analog input, heading behavior, long-drive checks and Pixel HUD |
| [v0.4.1 Codex kickoff](docs/CODEX_V0.4.1_KICKOFF.md) | Autonomous local-branch preparation + ready-to-paste Goal |
| [Product vision](docs/PRODUCT_VISION.md) | The sunlit coastal arcade-racing experience |
| [Arcade roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Earlier handling, drift, track and future convertible/scenery ideas |

### Codex workflow

Open the user's existing **Local** Codex OutRun workspace at `C:\astra-dev\OutRun`. The **Goal in the v0.4.1 kickoff** should verify the current local branch, preserve the existing playable implementation, create a v0.4.1 development branch from it, and import **only** current docs from `origin/main`. Do not merge the documentation-only `main` into the working game or restart v0.1.

The autonomous milestone is: **implement → run real game → drive/record/inspect → test/fix → local commit → human playtest**. A green build alone does not prove fun or correct game feel. Codex should not push, merge to main, or deploy publicly without approval.

## Platform and engineering principles

- **Three.js + TypeScript + Vite**; real 3D car and road with original stylized scenery, arcade dynamics rather than full physics simulation.
- **Pixel 8 / Android Chrome:** 20:9 landscape fullscreen/PWA, two-thumb steering and vertically stacked accelerator/brake, swappable hand layout, safe-area and long-press protection.
- **Driving core:** user must steer through curves; going off asphalt reduces speed; outer corridor bounds off-road drift without automatically recentering the car. Visibly fast coherent world travel at the accepted 1.75× pace.
- **Autonomy:** ordinary coding, Git branch work and QA belong to Codex. User chooses product direction and judges final on-device results.

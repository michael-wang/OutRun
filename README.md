# Project OutRun

**An original 3D arcade racer inspired by the *driving experience* of classic 1986 Out Run and 2003 OutRun 2.** This is an independent homage, not an authorized remake. `Project OutRun` is an **internal codename**; `SUNSHIFT GT` is only an uncleared candidate public title. Do not copy SEGA/Ferrari logos, models, artwork, music, code or character designs.

## Current milestone: v0.4 — Arcade Handling & Rhythm

**Product owner decision:** v0.3.2's high-speed **1.75× arcade world pace is provisionally accepted**. The next priorities are:

1. **P0:** Calmer, precise directional steering at 1.75× without slowing down the world or auto-following the road.
2. **P0:** PC controls: `A/D` steering, `Space` gas, `Enter` brake; Pixel 8 two-thumb layout remains as before.
3. **P0:** Prominent arcade speedometer, readable in landscape fullscreen without obscuring the road.
4. **P1:** Larger but controllable intentional drifts, with tire squeal tied to real slip rather than every gentle correction.
5. **P1:** Designed arcade road rhythm: longer acceleration sections alternating with demanding S bends and short dangerous corners.
6. **Deferred:** Original open-top sports car and two expressive occupants; themed scenery transitions.

**Important repo structure:** GitHub `main` is primarily **design specifications**. The playable v0.3.2 implementation exists on the **local Windows checkout**; it was reported committed at `43fba35` (implementation) + `cd36798` (handoff). Do not replace this working local code with the documentation-only remote branch.

## Start here

| File | Why it matters |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current Codex autonomy, safety and active milestone instructions |
| [v0.4 product specification](docs/V0.4_SPEC.md) | Controls, steering, HUD, drift, track rhythm, non-goals |
| [v0.4 acceptance](docs/V0.4_ACCEPTANCE.md) | Objective browser/phone regression tests and human playtest gates |
| [v0.4 Codex kickoff](docs/CODEX_V0.4_KICKOFF.md) | Autonomous local-branch preparation + ready-to-paste Goal |
| [Product vision](docs/PRODUCT_VISION.md) | The sunlit coastal arcade-racing experience |
| [Arcade roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Current v0.4 work versus later convertible/scenery projects |

### Codex workflow

Open the user's existing **Local** Codex OutRun workspace at `C:\astra-dev\OutRun`. The **Goal in the v0.4 kickoff** should verify the current local branch, preserve the existing playable implementation, create a v0.4 development branch from it, and import **only** current docs from `origin/main`. Do not merge the documentation-only `main` into the working game or restart v0.1.

The autonomous milestone is: **implement → run real game → drive/record/inspect → test/fix → local commit → human playtest**. A green build alone does not prove fun or correct game feel. Codex should not push, merge to main, or deploy publicly without approval.

## Platform and engineering principles

- **Three.js + TypeScript + Vite**; real 3D car and road with original stylized scenery, arcade dynamics rather than full physics simulation.
- **Pixel 8 / Android Chrome:** 20:9 landscape fullscreen/PWA, two-thumb steering and vertically stacked accelerator/brake, swappable hand layout, safe-area and long-press protection.
- **Driving core:** user must steer through curves; going off asphalt reduces speed; outer corridor bounds off-road drift without automatically recentering the car. Visibly fast coherent world travel at the accepted 1.75× pace.
- **Autonomy:** ordinary coding, Git branch work and QA belong to Codex. User chooses product direction and judges final on-device results.

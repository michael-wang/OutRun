# Project OutRun

**An original 3D arcade-driving game inspired by the feeling—not copyrighted assets—of 1986 Out Run and 2003 OutRun 2.** `Project OutRun` is an internal codename only; `SUNSHIFT GT` remains an uncleared candidate public name. No SEGA/Ferrari music, logos, cars or game art.

## Current milestone: v0.4.2 — Corner Exit & Road Rhythm

The owner has completed v0.4.1 playtesting and reports: **analog turn-in is more enjoyable**, but post-corner control causes overshoot to the opposite shoulder; much of the road is too straight and flat.

**Priorities:**
1. **P0:** Fix post-corner yaw/slip and allow prompt, proportionate correction **without** road/lane auto-centering. Keep the successful continuous steering strip and PC A/D virtual wheel.
2. **P1:** Add more frequent, deliberately designed sweeping and challenging turns, especially S-curves, with real elevation climbs, crests and descents.
3. **Preserve:** owner-accepted `1.75×` arcade world speed, car-left analog needle speedometer, PC A/D + Space gas + Enter brake, Pixel 8 landscape fullscreen/PWA/two-thumb/long-press, off-road slowdown/bounded shoulder, fixed chase camera and road continuity.
4. **Deferred:** original convertible/passengers, scenery/biome transitions, traffic, scoring and new races.

**Repo architecture:** GitHub remote `main` is primarily the specification/documentation base. The latest playable v0.4.1 source and handoff are on the user's LOCAL checkout, reported commits `4d4b05c` (code) and `34b6a3e` (handoff). **Do not replace the local playable branch with remote main**.

## Start here

| Document | Role |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current Codex operating rules and safe branch handling |
| [v0.4.2 spec](docs/V0.4.2_SPEC.md) | Corner-exit handling, bend cadence, elevation and preservation |
| [v0.4.2 acceptance](docs/V0.4.2_ACCEPTANCE.md) | Actual steering traces, corner-exit video, curvature/elevation and long-drive tests |
| [v0.4.2 Codex kickoff](docs/CODEX_V0.4.2_KICKOFF.md) | Ready-to-paste Goal, including autonomous local branch/spec integration |
| [Product vision](docs/PRODUCT_VISION.md) | The core sunny arcade-driving experience |
| [Arcade roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Current versus deferred improvements |

## Implementation workflow

Use the already playable **Local Codex** OutRun project at `C:\astra-dev\OutRun`. Start from the current local v0.4.1 game, not a new scaffold. The v0.4.2 Goal verifies git state, safely branches from the playable code and imports **only** relevant docs from `origin/main`.

Autonomous cycle: inspect source → implement and tune → actually drive in browser and record → compare traces → test and fix → commit locally → human PC/Pixel 8 playtest. Build/tests alone cannot certify a good arcade feel.

## Platform principles

Three.js + TypeScript + Vite. Real 3D road/car with stylized scenery, coherent 1.75× world movement, player-owned steering and recoverable off-road penalty. Pixel 8 landscape uses an absolute-position steering strip and separate gas/brake fingers, with handedness swap; PC uses A/D to steer and Space/Enter for throttle/brake. No accidental Android long-press menus, no automatic road tracking and no forced speed-based camera zoom.

Never push/merge/deploy publicly or change other projects without authorization.

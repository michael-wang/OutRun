# Project OutRun

Original browser 3D arcade driving game inspired by the joy of classic Out Run / OutRun 2, not a licensed SEGA remake. Project name is internal only; original/license-cleared assets required for public release.

## ACTIVE — v0.8.2 Driving Evidence & Stage One Challenge

**Owner's latest v0.8.1 Stage 01 playtest:** `S01-v0.8.1-r1-1-ALB1` → **REWORK**, difficulty `2 / Moderate`, note `I want it to be more challenging!` and on-screen finish `1:46`. See [archived review from screenshot](docs/reviews/V0.8.1_SEED1_HUMAN_PLAYTEST.md). This is one human stage review, not rejection of every other machine seed. Existing generator, original BRK and accepted L2 Pilot reviews remain preserved.

### New release goals

- **More believable real six-speed shift dip:** wheel-force/drag torque hole where actual car speed may naturally briefly dip, not fake subtracting displayed km/h.
- **Grade-dependent flat top:** ~300 km/h equilibrium on flat. Strong sustained downhill can go PAST 300, uphill with full throttle loses the plateau. Actual physics, odometer, speedometer and RPM coherent above 300; maintain 1.75× arcade world travel.
- **One-gesture screenshot:** PS4 `L1+L2` chord; PC `F8`; Pixel safe camera button. Save nonblank 3D gameplay PNG with Stage Code, speed, curvature/grade and car pose diagnostics. User reports a visual floating-car sensation while turning; investigate only after screenshot evidence.
- **In-game driving TELEMETRY:** compact bounded local ~5–10 Hz stage samples and brake/steer/offroad/gear events, with summary for % time+distance near 270/285/300, brake count, steering, road edge/offroad and per-L2 segments. User shares explicit JSON Export Drive Report to help design actual challenge; no online accounts/telemetry.
- **Pause resume countdown:** 1.0 second READY overlay after returning from pause/menu/review, with world, stage time and telemetry frozen until complete.
- **Stage menu decluttering:** remove `Original Bricks` Stage nav link (Brick Lab remains via existing URL); remove long generic keyboard shortcut legend and `Profile details`, keep actual on-button contextual hints and key reviews/Stage controls.
- **Difficulty tuning:** current Stage Seed easily held near 300; add a few clearly visible brake-worthy L2 challenges, preserving fast/high-scenic relief and seed variety. Let driving telemetry show what really happens. Fresh stage generator and human vote separate from original v0.8/v0.8.1 REWORK histories.

### Authoritative specs and kickoff

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current Codex task and local source safety |
| [v0.8.2 Implementation Specification](docs/V0.8.2_DRIVING_EVIDENCE_SPEC.md) | Detailed force/overspeed/screenshot/telemetry/countdown/menu and challenge requirements |
| [v0.8.2 Acceptance](docs/V0.8.2_ACCEPTANCE.md) | Actual physics, PNG, per-Stage run JSON and five seeds |
| [v0.8.2 Codex Kickoff](docs/CODEX_V0.8.2_KICKOFF.md) | Normal owner authorization and new autonomous Goal |
| [v0.8.1 Human Review](docs/reviews/V0.8.1_SEED1_HUMAN_PLAYTEST.md) | Original screenshot REWORK and missing direct clip validation |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Future progression after first Stage genuinely fun |

### Keep the working source safe

Playable latest LOCAL v0.8.1 lives at `C:\astra-dev\OutRun` (reported commits `fdbf575` implementation and `db5ab4e` handoff; inspect actual local HEAD). GitHub `main` is DOCS-first and not a replacement working game; never reset/merge it over local source. Use existing single OutRun Codex conversation, authorize v0.8.2 as an ordinary message if needed, then launch the separate `/goal`. Local branch/tests/commits only; no push/merge/public deployment, TopWar changes or other repo edits.

### Preserved game
Three.js/TypeScript/Vite, Arcade Lateral Balance 1.75×, real 3D car/road/scenery (coast/canyon/city), 18 technical L1 shapes, multi-placement L2 and generated Stage One, real 2–8 road widths and responsive full-hills driving, 300km/h six-speed, animated car and two occupants, human-approved warm engine, gentle tire sound, Pixel 8 landscape fullscreen/PWA/two-thumb 144px steering and hand swap, keyboard/PS4 Gamepad, direct historical praise/issue JSON exports.

**Deferred until owner likes Stage 01:** Stage 02, five-minute Guided/Mystery journeys, traffic/collision obstacles/rival AI, snow/volcano, expanded car garage/RPG, stage editor.

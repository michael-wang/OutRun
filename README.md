# Project OutRun

**An original 3D arcade racer inspired by the *fun and feeling* of classic Out Run / OutRun 2.** This is an independent game, not an authorized SEGA remake. `Project OutRun` is an internal codename only; `SUNSHIFT GT` is an uncleared public-title candidate. Use only original or appropriately licensed content.

## NOW: v0.5 High-Speed Spectacle

**Major human milestone:** v0.4.3 was the FIRST version in which the owner genuinely enjoyed high-speed cornering. The `Arcade Lateral Balance`, gameplay-first road design, 4-notch soft-detent steering and 1.75× world pace are accepted as the baseline. **Do not rewrite these systems.**

New owner requests:
1. Vehicle *visual* yaw should begin noticeably **earlier** on gentle real bends, but near-straight tiny corrections still remain calm.
2. Strong real high-speed drifts should display more striking body yaw: explore ~50–60° peaks if camera/road/collision stay readable.
3. Add **large high-speed sweeping curves** whose road direction changes dramatically while still being navigable at ~220–234 indicated km/h without braking, contrasting with existing Extreme brake-required corners.
4. When P0 is sound, start the previously deferred **original convertible sports car**, with a visible driver and passenger. Modest reactions are BONUS. Scenic-stage changes, rival traffic and difficulty director remain future work.

### Working repository caution

Latest playable v0.4.3 is in the user's **LOCAL** `C:\astra-dev\OutRun` checkout (code `84b18b3`, handoff `d370ef6` as last reported). The GitHub `main` branch contains chiefly **design documentation**, not the playable implementation. Codex must not check out/reset/merge it over game code.

## Active documents

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Codex active milestone, source protection and quality rules |
| [v0.5 specification](docs/V0.5_SPEC.md) | Pose onset/peak, at-speed sweeping corners, original convertible |
| [v0.5 acceptance](docs/V0.5_ACCEPTANCE.md) | Required browser driving, pose/corner measurements, phone visual checks |
| [v0.5 Codex kickoff](docs/CODEX_V0.5_KICKOFF.md) | Ready-to-paste autonomous Goal |
| [Product vision](docs/PRODUCT_VISION.md) | OutRun-style sunny-road arcade emotion |
| [Product roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Later scenic transitions, traffic, DDA and car variants |

### Development handoff

In the existing OutRun Codex **Local** workspace, start a new real `/goal` using the [kickoff](docs/CODEX_V0.5_KICKOFF.md). Codex should safely branch from the playable v0.4.3 code and import ONLY current v0.5 docs/`AGENTS.md` from `origin/main`, then autonomously implement, actually drive/browser-record, inspect and test, and commit locally.

**P0 gameplay fun is a gate before P1 vehicle art.** Green tests alone do not certify visual flair or fun. Human PC/Pixel 8 playtests decide acceptance. No automatic push/merge/public deployment.

## Platform and driving invariants

Three.js + TypeScript + Vite; original stylized sunny coastal 3D road/car. Continuous-looking smartphone steering strip with four soft detents each side; gas/brake with other thumb and swap; Pixel 8 20:9 landscape fullscreen/PWA/long-press safeguards. PC A/D+Space/Enter. Car-left analog speedometer. Road curvature induces outward pressure, steering offsets it, off-road loses speed and stays bounded; **no lane-centering autopilot**. Fixed-FOV chase camera with exciting 1.75× world flow.

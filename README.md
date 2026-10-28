# Project OutRun

An original stylized browser arcade road-trip driving game built with Three.js + TypeScript + Vite. Mobile-first for Pixel 8 and playable by keyboard and PS4-style controller. An original public title and original/license-cleared assets are required before wide release.

## Latest human review: v0.8.4 — New priority: a 10-minute procedural road trip

**Latest locally playable build** is v0.8.4, reported branch \`codex/v0.8.4-visual-captures\`, implementation \`edd7018\` and handoff \`4d2b6ad\` on the user's Windows \`C:\astra-dev\OutRun\`. Its build, 91 unit tests, 123 Playwright tests and 12 unique PNG capture audit passed. **Remote GitHub \`main\` is docs-first; do not checkout/reset/merge it over playable game code.** No game code was pushed/merged/deployed.

Human reports multiple screenshot files are now stored properly in \`C:\astra-dev\OutRun\captures\YYYY-MM-DD\`. UI refinement needed: a nonintrusive short success toast during play; single dated folder line + clickable \`Open Folder\` in pause menu; remove \`Recent Photos\`. Two new screenshots reveal hollow/floating distant road and too-regular skinny palms — **visual scenery improvement v0.8.4 NOT accepted** on these cases.

**Owner's overriding goal is ~10 minutes of increasingly varied, enjoyable, continuously streamed driving**, without building all 10min of scenery at boot or hitching when terrain/biome changes. Build a **small deterministic logical route recipe once, render only a bounded sliding window of road/scene chunks**. Prioritize real drive over perfecting scenery in the existing short stage.

### Approved planning documents (NOT an authorization to start Codex)

- [v0.8.4 owner review and real data](docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md)
- [10-minute road-trip architecture proposal](docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md)
- [Phased acceptance tests for streaming, long stage and scene art](docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md)
- [AGENTS](AGENTS.md) — source safety and explicit authorization requirement.

| Planned milestone | Scope | STOP at |
| --- | --- | --- |
| **v0.8.5** | 2-min exact Stage01 streaming parity, bounded lazy chunks & performance diagnostics, photo menu/open-folder UX | Real Pixel/PC human review of invisible smooth streaming |
| **v0.9** | New deterministic ~10-minute road trip from approved L1/L2 + L3 city/coast/canyon, varied beats and biomes, no prebuilt full geometry | Owner drives 2–3 route seeds and rates actual fun |
| **v0.9.1** | Actual scenery visual correction for thin distant suspended roads, canyon/coast ground and skinny regimented palms; preserve streaming/perf | Owner visually accepts side/forward screenshot comparisons |

Other systems to preserve: six gears/~300 km/h with grade-sensitive accelerations, nonphysically fun Arcade Lateral Balance steering, v0.8.3 gameplay stage coding retained in v0.8.4, deterministic seeds, 1.75× world pace, Pixel steering strip 144px, PS4 Touchpad photo/Share fullscreen, keyboard shortcuts, positive/issue feedback, archived historical reviews and per-0.1s private telemetry. No traffic, RPG/garage, new biomes, Stage02, photorealism, whole-world upfront mesh, cloud photo storage or unrelated project changes under this plan.

**No local development is initiated by this documentation commit.** When separately authorized, create new branch from actual LOCAL playable v0.8.4 HEAD and selectively import plans/specs from docs-only remote main. Do not push, merge or deploy unless separately approved.

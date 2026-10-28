# Project OutRun — Practical milestone backlog

**Latest playable local:** v0.8.4 \`codex/v0.8.4-visual-captures\` (reported \`edd7018\`, \`4d2b6ad\`). No pushed source. Human has archived multiple screenshots to \`captures/YYYY-MM-DD\` on PC, but scenery visual outcome is **NOT accepted**. See [current human review](V0.8.4_HUMAN_FOLLOWUP_10MIN.md).

## Now prioritizing 10-minute procedural driving over short-scene polish

| Order | Milestone | Content | Gate |
| --- | --- | --- | --- |
| **1** | **v0.8.5 — Bounded Road/Scene Streaming & tiny Photo UX fix** | Refactor same ~2-minute seeded Stage into deterministic lazy near/mid/far geometry chunks, prefetch and unload/pool, no baseline handling/Stage changes. Measure frame times, memory plateau on 10/20min synthetic tests; small camera success toast and pause menu folder opener; remove \`Recent Photos\`. | Real seeded drive stays equivalent and no visible stage-boundary hitch |
| **2** | **v0.9 — 10-Minute Road Trip** | Cheap entire L1/L2/L3 route recipe and new independent long Stage seed/version; dynamically materialize only nearby 3D chunks. Varied L2 challenge cores, L3 transitions, city/coast/canyon/width/hills; ~8–12min representative player experience, not 5 repeats of short Stage. | At least 3 browser full drives + 2 human long-seed reviews; no lag, memory bounded |
| **3** | **v0.9.1 — Grounded Scenery & Organic Palms** | Finally focus on screen-visible continuous terrain/bridges to support elevated roads, deeper backgrounds and fuller variation-rich trees. Extend chunk scene grammar; near/mid/far LOD. | Actual before/after shot for original two visual failures plus 5 seeds, no performance regression |
| LATER | Traffic, rivals, further environments, replay retention/RPG | Only after 10-min driving is genuinely fun and stable | Owner separately authorizes |

[Architecture](TEN_MINUTE_ROADTRIP_ARCHITECTURE.md) · [Exact acceptance gates](TEN_MINUTE_ROADTRIP_ACCEPTANCE.md).

## Working principles

- **L1** small parametric shapes: bend, elevation/grade, width, etc. L2 = tested combinations of independent layers (not single giant bends). L3 = trip rhythm and scenic region/transition metadata plus only useful connector straights.
- 10 minutes at latest real owner pace implies **~70k game-space units**; logical itinerary may be prepared up-front, but FULL Three.js geometry/scenery must be built lazily.
- Avoid overengineering and algorithmic AAA road feasibility. Let human praise/issue/difficulty and drive telemetry inform later iteration. Physical Pixel benchmark before claiming performance.
- Remote GitHub main is DOCS-ONLY, local playable code is separate. **Do not start Goal just because docs exist**. Await ordinary explicit authorization and new Codex Goal; stop after each milestone, no push/merge/deploy.

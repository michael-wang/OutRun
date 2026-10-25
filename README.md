# Project OutRun

An original 3D arcade-driving game inspired by the *fun and spirit* of classic Out Run / OutRun 2, not an authorized SEGA remake. `Project OutRun` is an internal codename; any public name still requires clearance. Use original/license-cleared art, music and vehicles.

## Product status

- **Latest reported playable version: v0.6 Scenic Journey** (LOCAL Windows checkout; implementation `6401a03`, handoff `cf83901`). The owner reports this version is fun and suitable for family playtesting.
- **Long-term design direction approved: curated procedural road trips**. We want a sustainable, replayable driving adventure made from **human-approved challenge bricks** and gameplay-first generated roads.
- **Next planned prototype: v0.7 Journey Lab — PLANNING ONLY**. Start by evaluating candidate bricks and a **Pacific Road Trip / Intermediate / 5 Minutes**, then validate same-seed replay/different-seed variety. Mystery Drive shares this generator but may be a follow-up feature.
- **Explicitly deferred:** Garage, currency, upgrades, new cars, adaptive director, traffic, physical hazards, forest/snow/volcano packs and a large 3D stage editor until generated trips prove genuinely fun.

GitHub `main` contains primarily planning/specification files; the **actual playable v0.6 is in the user's LOCAL `C:\astra-dev\OutRun` checkout**. Do not reset/merge main over the playable code. This product planning update does **not** authorize Codex to start another milestone.

## Planning documents — next direction

| Document | Purpose |
| --- | --- |
| [Procedural Journey Strategy](docs/PROCEDURAL_JOURNEY_STRATEGY.md) | Product principles, Guided/Mystery modes, shared pipeline, review workflow and later progression |
| [Initial Challenge Brick Candidates](docs/CHALLENGE_BRICK_CANDIDATES.md) | 8 deliberately distinct candidate driving moments, human KEEP/REWORK/REJECT process |
| [v0.7 Playable Prototype Plan](docs/V0.7_PLAYABLE_PROTOTYPE_PLAN.md) | Scope, acceptance and decision gate for the first seeded 5-minute Pacific Road Trip |
| [Arcade Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Priorities and deferred features |

## Existing delivered milestone context

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Historical/latest issued Codex working instructions; new v0.7 construction task NOT YET approved |
| [v0.6 spec](docs/V0.6_SPEC.md) | Three acts, wheel animation, road/character expectations |
| [v0.6 acceptance](docs/V0.6_ACCEPTANCE.md) | Scenic, mobile, wheel and drive verification |
| [Product vision](docs/PRODUCT_VISION.md) | Sunny original arcade-driving north star |

## Preserved technology and controls

Three.js + TypeScript + Vite, genuine 3D scenery/road/car, human-approved `Arcade Lateral Balance` and 1.75× world travel, responsive 4-soft-detent steering, brake-required and full-speed sweepers, visually expressive convertible/occupants, bounded off-road penalties. Pixel 8 landscape fullscreen/PWA uses a horizontal steering strip + separate gas/brake fingers and hand-swapping. PC uses A/D steer, Space gas, Enter brake. Analog needle speedometer sits left of player car.

## Workflow

**Specify small playable outcome → Codex independently implements/tests/records → owner actually drives and approves/rejects → next slice.** No passing automated test should be called proof of game fun. No public deployment, push, merge or changes to other projects without user authorization.

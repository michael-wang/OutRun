# Project OutRun

Independent original 3D arcade-driving project inspired by the *joy* of classic Out Run / OutRun 2, not an authorized SEGA remake. Only original/license-cleared assets. Internal project name is not a cleared public title.

## Human review milestone complete: v0.7A.1 — 8/8 KEEP

The owner played all eight v0.7A.1 updated Challenge Bricks, and **BRK-01 through BRK-08 revision 2 received KEEP**; autoQA PASS for all eight. This improves the initial v0.7A review (r1: 6 KEEP, 2 REWORK, zero reject), with BRK-03 and BRK-05 moving from REWORK to KEEP. See archived reviews:
- [R1 original human votes](docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json)
- [R2 second-round human votes](docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json)

The core arcade driving, existing three worlds and reviews remain in the user's **LOCAL** `C:\astra-dev\OutRun` checkout. GitHub `main` is primarily planning/specification documents and must **NOT** be reset/merged over the playable local app.

## Direction after the brick review

**Curated procedural journeys**, but first validate a smaller alternative to simply chaining existing BRK-01, BRK-03, etc. The proposed design uses:
- **L1 Primitive Profiles:** stack curvature, elevation and actual 2–8-lane width changes over the same distance interval.
- **L2 Experience Bricks:** playable, human-rated combinations of these profiles. The eight accepted r2 bricks are verified references, not blanket approval for altered combinations.
- **L3 Journey/World:** choose world rules, surfaces and environment families; synthesize terrain and near/mid/far scenery along the road. Do not mix fully unrestricted biome/snow materials into road-geometry primitives.

First proposed spike: try a handful of recombinations of **BRK-01, BRK-03 and BRK-06**, with easy human KEEP/REWORK/REJECT and subjective difficulty votes, and lightweight geometry/terrain/scenery checks. See [L1 Stacking Experiment Plan](docs/L1_STACKING_EXPERIMENT_PLAN.md).

The approximately 5-minute Pacific Road Trip (v0.7B), Mystery Drive, RPG economy, Stage Composer, new biomes and traffic/rivals remain later possibilities, **not currently authorized construction tasks**.

## Current documents

| Resource | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Current milestone status, source/review integrity |
| [L1 Stacking Experiment Plan](docs/L1_STACKING_EXPERIMENT_PLAN.md) | Proposed simple composable road, terrain and scenery experiment |
| [v0.7A.1 accepted reviews](docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json) | Exact eight r2 player votes |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Upcoming work and later procedural trip direction |
| [v0.7A.1 Spec](docs/V0.7A1_SPEC.md) | Last delivered road height/width refinement requirements |
| [Procedural Strategy](docs/PROCEDURAL_JOURNEY_STRATEGY.md) | Curated generated journeys long-term direction |

## Preserve the playable experience

Three.js/TypeScript/Vite; real 3D car/road/terrain, accepted Arcade Lateral Balance and 1.75× world pace, discrete soft steering detents and bounded off-road shoulders, animated original convertible/occupants/wheels, Azure Coast/Golden Canyon/Sunlit Coastal City, Pixel 8 20:9 landscape fullscreen/PWA with hand-swappable two-thumb controls and desktop A/D + Space/Enter. Do not start any new milestone without explicit owner authorization.

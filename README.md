# Project OutRun

An independent original 3D arcade driving game inspired by the *fun* of classic Out Run / OutRun 2, not an authorized SEGA remake. Use original or properly licensed art, cars and audio; title currently is an internal codename, not a cleared public brand.

## ACTIVE — v0.7C L1 Library & L2 Feedback Lab

**Human-approved reference:** The owner has played all eight `BRK-01..08` v0.7A.1 revision-2 candidates and gave each **KEEP**. That acceptance remains tied to the exact historic brick revisions, with original R1/R2 data preserved:
- [R1 reviews](docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json) — six KEEP, two REWORK
- [R2 reviews](docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json) — eight KEEP

The user now commissioned a **systematic L1→L2 creation and in-drive feedback loop**:

- **L1 technical vocabulary:** 18 parameterized primitive profile SHAPES; Curvature C01–C08, Elevation E01–E06, Width W01–W04. Implement/reuse from existing code and AUTO-VERIFY; no human time wasted trying each basic element separately.
- **L2 review batch:** systematically combine profiles into **16 distinct playable** roughly 30–60s roads (L2-001..016), in 4 batches of 4, inside `?lab=l2`. Current L3 supported environments remain Azure Coast / Golden Canyon / Sunlit Coastal City.
- **Real-time player feedback:** small top-edge buttons for praise and reporting an issue; capture exact current road position + geometry/controls, pause safely for quick feedback. Four original Chinese praise options: **超好玩!**, **超刺激!**, **超難! 但是過了超爽!**, **風景優美**. After each L2: KEEP/REWORK/REJECT, difficulty 1–5, optional note and highlights.
- **Review archive:** local persistence + portable JSON export; no user account, backend, automatic uploads or fabricated human KEEP votes. Original `?lab=bricks` remains separate and intact.
- **Deferred:** v0.7B Pacific Road Trip / 5 minutes, Mystery Drive, RPG economy/garage/upgrades, traffic/rival cars, larger Stage Composer or new snow/volcano packs. These need future explicit commissioning.

### Authoritative v0.7C documents

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Authorized Codex scope and local branch safety |
| [v0.7C Spec](docs/V0.7C_SPEC.md) | L1+L2 data model, real-time issue/praise and after-drive review |
| [v0.7C Acceptance](docs/V0.7C_ACCEPTANCE.md) | Technical 18-shape/16-L2 and phone feedback/browser QA |
| [L1 Primitive Catalog](docs/L1_PRIMITIVE_CATALOG.md) | Exactly eight curvature, six elevation, four width primitive shapes |
| [L2 Coverage Matrix](docs/V0.7C_L2_COVERAGE_MATRIX.md) | Systematic sixteen driving compositions |
| [Codex Kickoff](docs/CODEX_V0.7C_KICKOFF.md) | Explicit normal-chat authorization and autonomous Goal |
| [Product Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Next stages after human review |
| [Procedural Journey Strategy](docs/PROCEDURAL_JOURNEY_STRATEGY.md) | Long-range two-mode Infinite Road Trip concept |

### Important Git / source caveat

Actual working and playable v0.7A.1+ code is in **local Windows checkout `C:\astra-dev\OutRun`** (final SHA must be inspected locally). GitHub `main` is **primarily project docs, not the game source**. Never checkout/merge/reset docs-only main over the playable game. Codex must branch from latest local playable HEAD, selectively import only current v0.7C specs and implement in that branch.

In the **same existing OutRun Codex conversation**, send a normal message granting v0.7C authorization FIRST (to avoid old milestone stopping rules), then a separate `/goal` from the kickoff. No public deployment, push, merge or other-repo changes without approval.

### Preserve core game

Three.js + TypeScript + Vite; human-approved Arcade Lateral Balance, 1.75× coherent world pace, responsive four-soft-detent mobile thumb steering and PC A/D + Space accelerator + Enter brake, original convertible with animated wheels/occupants/hair, three scenic acts, 2–8 genuine lane widths, road altitude, fixed chase camera and car-left analog speedometer, bounded off-road recovery, Pixel 8 20:9 landscape fullscreen/PWA and hand swap.

# Product strategy — Infinite Road Trip

**Decision status:** Product direction approved. **ACTIVE user-authorized development is v0.7C L1 Library & L2 Feedback Lab.** Owner has approved all eight BRK-01..08 r2 experiences and explicitly wants all foundational L1 profiles prepared by AI, a systematic 16-candidate L2 combination batch, and **in-drive positive AND issue tagging plus an overall L2 rating**. See `docs/V0.7C_SPEC.md` and `docs/CODEX_V0.7C_KICKOFF.md`. v0.7B five-minute Pacific Road Trip, Mystery Drive and RPG remain NOT authorized.

## North star

Deliver repeatable driving adventure and scenic surprise using AI-engineered technical primitives and human-curated enjoyable experiences.

### Responsibilities

- **L1 geometry channels (only):** curvature/Required Steering; elevation/grade; width/lane count. 8+6+4 first parameterized families, verified automatically. Avoid treating L3 world/road surface/biome as unrestricted L1 slots.
- **L2 Experience Bricks:** three independent L1 channels STACK at the same distance to produce a driveable local challenge. Each combination has its own version/seed and is reviewed by a human for KEEP/REWORK/REJECT, subjective difficulty 1–5, instant positive highlights/issues and end-of-road opinion.
- **L3 World/Journey:** world-specific constraints determine supported surface, terrain, scenery (near/mid/far) and long-form composition by STRINGING accepted L2 together. Terrain and props conform to actual generated road height/curvature/width. Present coast, canyon and city only; future snow/volcano require real content packs.
- **Minimal geometry validity only:** finite continuous road, no unintended same-level asphalt self-overlap/road-object intersections; no speculative global difficulty/response-time optimization. Very hard moments may be valid and human-rated Godlike.

### Review loop, now informed by R1/R2 human feedback

1. Codex inventories existing geometry and fills the L1 primitive family gaps; automatic tests validate L1 shape and code integration.
2. A fixed, systematically covering 16-row C/E/W matrix produces first L2 candidate drives; some simple, some intense, some scenic.
3. While driving an L2, user can tap quick **positive** responses (**超好玩! / 超刺激! / 超難! 但是過了超爽! / 風景優美**) or log a problem with short text; the game records exact road/vehicle/profile context at the event.
4. At L2 end, player gives independent overall KEEP/REWORK/REJECT, subjective difficulty 1–5 and optional notes/tags.
5. Export local JSON and use comments/event location to refine offending combinations or preserve delight. Never fake player review.
6. Only approved versioned L2 variants later become inputs for full Journey Generator. Reusing a profile with changed geometry creates a NEW unreviewed content revision.

### Long-term player modes

**Guided Journey:** choose trip theme/comfort/duration, e.g. Pacific Road Trip / Intermediate / ~5 Minutes.  
**Mystery Drive:** press Surprise Me to discover a generated trip whose world/challenges emerge during travel. Both share eventual approved L2 library and seeded generation; no two incompatible driving engines.

### Beyond current task

Future environment packs, real hazards and opponents, earned currency/garage/vehicle upgrades, special surfaces/snow chains and progression systems only once generated roads are genuinely fun. A large visual Stage Composer should be built only if a demonstrated authoring problem warrants it.

**Implementation status:** v0.7C docs authorized; playable code remains LOCAL and Codex must implement/test via new v0.7C Goal from latest playable HEAD. No backend/cloud AI in game runtime and no online user feedback uploads.

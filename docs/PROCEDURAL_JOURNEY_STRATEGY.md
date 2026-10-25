# Product strategy — Infinite Road Trip

**Decision status:** Owner-approved long-term direction, **PLANNING ONLY**. This document is not a Codex implementation Goal and does not supersede the completed v0.6 local build or authorize a new code milestone.

## North star

Turn the currently enjoyable OutRun-inspired arcade handling into a **replayable driving-adventure platform**. A player can choose a planned trip or ask for a surprise; every trip is built from **human-approved gameplay bricks** and generates a new, memorable sequence of driving challenges, sights and emotional beats.

The user values *pleasure in driving and discovery* over competition/strict simulation. Do not optimize only for best lap times or build an RPG grind before diverse trips are genuinely replayable.

### Product rules

1. **Fun is curated; arrangement is procedural.** Procedural randomness selects and varies *approved* challenges; it does not make unreviewed hazards automatically good.
2. **Generate gameplay first.** Define Required Steering, reference speed, braking demand, width, duration, elevation, visibility and stage/landmark constraints; derive continuous Three.js geometry, roadside content and camera-readable warnings.
3. **Two entrances, one generator.** Guided Journey and Mystery Drive produce `JourneySpec` inputs to the same pipeline. Avoid building two incompatible race engines.
4. **The player owns the drive.** The existing v0.6 Arcade Lateral Balance, four soft steering detents, accepted 1.75× world pace, bounded off-road penalty, 3D camera, sound and Pixel 8 controls are the baseline.
5. **Fairness and reward.** An impossible-at-full-speed curve must be readable and passable by slowing; no invisible surprise force, no mid-corner adaptive manipulation. Favor discovering new experiences over a permanent difficulty ratchet.
6. **Seeded reproducibility.** Same seed + generator revision + chosen car/ruleset + mode/options should reconstruct the same trip, including its environment transitions and obstacles. Save/give a Journey Code for replay/debug/share.
7. **Simple before clever.** Start with small hand-authored templates and validation, not a 3D editor, giant content model or live generative AI runtime dependency.

## Two player-facing entrances

### Guided Journey: "I know what I want today"

- Example: **Pacific Road Trip / Intermediate / 5 Minutes**.
- User chooses theme/route label, approximate duration and a **comfort/challenge profile**, with seed optionally shown for replay.
- Generator makes a coherent journey with local twists, not an exact preauthored fixed track. The same theme can produce many valid roads.
- Use only current art and rules at first: **Azure Coast, Golden Canyon, Sunlit Coastal City**. Future snow/volcano/forest are content packs, NOT claimed v0.7 capability.

### Mystery Drive: "Surprise me"

- Start with a single big **Surprise Me** option; the game selects a theme order, challenge pacing and seed from supported content.
- Show the destination/world gradually; no need to announce all future acts. A new seed yields a meaningfully different journey, not a mere palette change.
- Preserve player comfort, visibility and a stable selectable difficulty ceiling. "Surprise" must not mean random unwinnable difficulty.
- Let the player replay a memorable surprise from its Journey Code later. Do not require a backend.

**Shared mechanics:** both modes use the same brick catalog, stitching, geometry construction, rendering, test drivers and saveable spec. Only the **intent and constraints** passed to the generator differ.

## Generation pipeline (initial architecture)

`JourneyIntent → Experience Beat Plan → Approved Brick Selection → Parameter Calibration → Road/Scenery Assembly → Validation → Local Play`

1. **Intent**: mode, requested minutes, driving comfort profile, scene restrictions, car config, seed, generator version.
2. **Beat Plan**: choose a deliberate rhythm — anticipation/acceleration → challenge → payoff/vista → challenge → relief, with variety and no fatigue-inducing endless maximum-load turns. Time targets convert to DISTANCE at reference progress; different drivers take different real seconds.
3. **Brick selection**: select APPROVED bricks with roles/tags and compatibility conditions. Use a seeded PRNG, selection diversity, repeat limits and cool-downs; avoid picking independently random corners.
4. **Calibration**: instantiate a brick against vehicle steering authority/speed and target Required Steering; infer real curvature from the SAME shared physics/gameplay calibration used in current v0.6. Reconcile width, safe speed, visibility, grade and entrance/exit.
5. **Stitching**: smooth signed curvature, heading, centerline, lateral edges and road grade between segments, and blend scenery palette/landmarks through real distance. Do not teleport the car or change its driving force just because a scene changes.
6. **Geometry/scenery**: generate contiguous real Three.js road and environment in bounded streaming/recycled chunks so 3–5 minute trips do not require an unbounded 3D world prebuilt in memory.
7. **Validation**: static checks (seams, intersections/terrain occlusion, curvature/grade/look-ahead, available road margin, stage assets) + deterministic driving simulation + actual browser render/playback. Reject bad seeds and retry with a bounded count, recording rejection reasons.
8. **Player review**: in early development, human approves brick candidates and samples of whole trips. Human-rated quality is NOT equal to automated PASS.

### Compatibility rules — examples

- A full-speed coastal sweeper should not cut immediately into a blind mandatory-brake hairpin without enough **preview and braking distance**.
- Two extreme/maximum-load sections should have a breather between them unless a specifically approved advanced brick authorizes the combination.
- A crest that hides the road needs minimum sightline/response time and cannot stack with an unannounced danger corner by accident.
- A narrow road with obstacles must have at least one viable safe path; do not enable collision hazards until collision/traffic rules themselves are reliable.
- Coastal landmark props never penetrate road surfaces or obscure signs; canyon cliffs and city buildings must not overhang the camera's critical road view.
- Environmental transitions require compatible entry/exit palette and terrain profiles; screen-space sky/lighting snapping is invalid.

## The brick review contract

A brick is **a playable challenge-with-context**, NOT just a spline snippet or 3D prefab.

Required minimal metadata:
- `id` + revision, `status` (CANDIDATE / AUTO_VERIFIED / HUMAN_APPROVED / NEEDS_REVISION / REJECTED / RETIRED);
- intended player action and emotion (e.g. "hold full throttle through huge scenic right sweeper");
- supported biomes/vehicle rule range, safe steering/difficulty range, speed and braking expectations;
- duration/road distance, curvature/width/grade/lookahead envelope, landmark/prop tags;
- smooth entry/exit compatibility and maximum repetition frequency;
- QA seed, pass/fail/fairness tests, human notes and acceptance revision.

**Who does what**:
- Julia + Codex design a short batch of candidate bricks and implement them as replayable isolated drives.
- Automated tests reject impossible/visually broken variants BEFORE involving the owner.
- Michael plays them in the existing PC/Pixel 8 browser and marks each **KEEP / REWORK / REJECT** (one click; optional short note).
- Only explicitly **HUMAN_APPROVED** versions enter default generated journeys. A meaningful change to physics, tuning, hazard timing or visual warnings invalidates affected approvals pending re-review.
- Do not generate thousands of candidate bricks for Michael to inspect. Start with **8 carefully differentiated candidates**, keep roughly **5–6 worthwhile bricks**, and use variants/constraints to explore breadth.

Save candidate ID/seed/approved revision so one successful corner can be replayed and reused, and rejected cases can be diagnosed.

## Player skill / difficulty now versus later

The user does **not** want a performance-only racing game. Start with **Comfort / Intermediate / Wild** as descriptive choice envelopes, not rigid esports ladder ranks; the existing Beginner / Intermediate / Advanced / Godlike concepts can be revisited later.

A good road may allow a gentle cruise OR a near-maximum-speed heroic line. Upgrades are a future pleasure layer, not needed to make basic driving feel fair.

Do **NOT** implement hidden adaptive force/road changes in the current corner. Later, any adaptive variation happens at future segment/stage generation or through a visibly signposted route fork, and should honor a chosen challenge ceiling.

## RPG economy intentionally deferred

Long-term loop: drive new trip → earn fair currency from completed segments and mastery → improve grip/brakes/acceleration or buy original cars → unlock thematic content and new challenge packs.

**Do not implement currency, store, upgrades, unlocks, snow-chain tires or balancing yet.** First prove generated roads are genuinely replayable without external incentives. An economy cannot rescue a dull generator.

## Validation questions for the product owner

- Did this journey have at least two **memorable** moments that differed from a previous trip?
- Did corners and scenery behave fairly, and did visible road shape communicate steering/brake demand?
- Does the next-segment surprise feel exciting, not random or punishing?
- Given nothing earned, would you choose to drive another generated seed right now?

A NO means improve the brick catalog/beat grammar, not add coins or daily-login rewards.

## Proposed rollout (not yet a construction order)

- **v0.7 Journey Lab:** build a small candidate-brick review surface, human-approve initial bricks, then produce a replayable **Pacific Road Trip / Intermediate / 5 Minutes** built exclusively from approved bricks and existing three scenes. Developer/test seeds and generation version should be visible.
- **v0.8 Mystery Drive:** reuse the generator to deliver unannounced-but-fair scene/beat combinations; improve distinctiveness, track streaming and replay/share by code. A minimal preview may fit v0.7 if quality holds, but not at cost of the five-minute guided trip.
- **v0.9+ Progression experiment:** only if repeated generated drives win genuine enthusiasm: tiny local Garage/reward loop with one meaningful upgrade, no large economy. Traffic, road hazards, route forks and snow/volcano packs follow only when approved as individual mechanics/asset packs.

**No Codex Goal has been authorized by this document.** Next user decision is which minimal v0.7 playtest experience and initial brick batch to commission.

# Project OutRun — Roadmap after v0.5

## v0.6 ACTIVE — Scenic Journey

**Owner feedback:** v0.5 is playable; wheels look static in large drift, occupants need life (especially windblown long hair), and the NEXT MAIN investment is richer roadside environments and more varied road sequences.

**P0:** fix visibly rolling/steering wheel geometry and high-speed alias issue; create one continuous three-act travel-distance-driven route: Azure Coast → Golden Canyon → Sunlit Coastal City. Distinct scene composition, near/mid/far props and unique landmarks, two smooth boundaries. Stage-specific demanding-but-driveable gameplay-first road sequences with grade, S, full-gas sweeper, brake-required Extreme. Preserve current fun 1.75× pace, pixel controls and collision rules.

**P1 after P0:** simple stylized driver/passenger leaning/head/arm response and speed-responsive exaggerated hair flutter for visible long-haired female occupant. No character-physics engine.

See `docs/V0.6_SPEC.md` and `docs/V0.6_ACCEPTANCE.md` for detailed acceptance.

## AFTER human accepts the scenic journey

- **Difficulty/emotion scripts:** Beginner, Intermediate, Advanced, Godlike through stage-level required steering, width, sightline, elevation and obstacles; use small hand-authored patterns before designing editors or elaborate auto-generators.
- **Branch selection:** visibly signposted easy/hard route choices; stage-boundary only. Player's choice overrides any adaptive recommendation, no invisible mid-corner cheating.
- **Traffic/rivals:** start with small deterministic passing-vehicle traffic and collision/avoidance, then rival racing AI; prove fun and phone performance.
- **Additional car choices:** differing top speed, lateral correction authority/grip, accelerations, visual identities and animations once current car is refined.
- **Extended scenic travel:** Forest/alpine/snow and desert/city transitions, coherent music/FX, new roadside landmarks and level progression.
- **Scoring and goals:** Time attack, stage checkpoints, medals/leaderboards only when basic journey has sustained fun.

## Product rule

Prioritize what the player sees and feels: authentic perceived world motion, predictable arcade control, readable corners, expressive visuals and scenery rewards. Use simple source/data structures and verifiable browser clips instead of expanding engineering complexity for its own sake. **No new feature can come at the cost of already-approved driving fun.**

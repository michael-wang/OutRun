# Project OutRun — product roadmap (after design paradigm shift)

## Current milestone: v0.4.2 Gameplay-First Driving Prototype

Owner has explicitly replaced the old turn-physics + arbitrary-track approach with:
- **Arcade Lateral Balance:** curvature imposes outward drift, steering applies limited opposing correction; reduce speed if curve demand exceeds available correction. Don't accumulate lateral/yaw inertia after exiting the bend.
- **Gameplay-first geometry:** author discrete challenge segments by Required Steering at a reference speed, width, duration/distance, then derive actual curvature/3D mesh.
- **Discrete effective control:** default neutral + four levels each direction, with continuously sliding touch/visual wheel and mobile/PC shared behavior.
- Playtest proof: low/mid/high/too-fast requiring braking/S-curve on ONE small route. 1.75× accepted pace, off-road bounded slowdown, Pixel 8+PC support remain.

This is a prototype, not permission to build a track editor or adaptive director.

## AFTER the core prototype passes the human test

### Experience Director, not just procedural roads
Difficulty/elevation/visibility/width/obstacle profiles arranged into a designed **emotional rhythm**, using a small authored script first. Gradually explore Beginner / Intermediate / Advanced / Godlike as distinct challenge distributions. Any intentionally >100%-at-reference corner must still have at least one practical slowed-down or alternative strategy.

### Player model and branch choice
Optional stage-boundary adaptive difficulty using average speed, off-road time, braking and correction accuracy, without secretly changing the active road mid-corner. Left/right road forks should communicate the choice and let player override any suggestion. Player skill must remain rewarded.

### More features after engine fun is proven
- Original open-top sports car and visible driver/passenger with expressive animations.
- Scenic changes approximately every 30–45s of normal fast driving (coast, desert, city, forest/snow) and thematic stage transitions.
- Different cars with differentiated turn authority/grip/top speed; bounded object hazards and traffic/rival cars.
- Scores/leaderboards, routes, game music and checkpoints. No scope expansion merely because Codex can generate it.

**Priority:** drive is fun first; generated challenges actually measurable second; adaptive/meta systems only when needed.

# Coastal Highway — directional heroine overtake reaction (proposal R0)

Date: 2026-11-14
Status: **owner-requested, technically feasible, NOT implemented.** Required art authoring affordances added to [rear-view hair pipeline](COAST_HEROINE_REAR_VIEW_PRODUCTION.md). Implement only **after** the blonde heroine's Blender hair prototype and optimized GLB/seat placement pass the respective visual and Pixel 8 gates.

## Experience goal

When the player sweeps past a rival, the blonde passenger briefly **turns toward the rival car and calls out playfully**. Both left and right sides are supported: the same identity/rig, mirrored motion direction, asymmetric hair trailing. This must look expressive from the actual **rear chase camera**, not just face close-ups. Keep her realistically inside the open-top Riviera, one arm/hand near the seat or optional small expressive gesture rather than dangerously clipping the driver, steering wheel or guardrails.

Suggested tiny choreography: anticipation ~0.15 s, glance/lean + mouth opens ~0.35–0.45 s, hair catches up with a small lag, return over ~0.4–0.6 s. Start in a side-by-side moment while passing; do not wait until the other car is several metres **behind**. Timing/angles are tunable after seeing footage, not required constants. For left/right, head turns toward the opponent (~25–45 degrees), shoulders turn less (~8–15 degrees), chin lifts just slightly, smile briefly opens. Preserve character identity and normal seat gestures. Sound may reuse an accepted short passenger cheer cue initially; recording/synthesizing voice is **not** an initial requirement and must cost NT$0.

## Existing verified code & key gap

- `src/rival-overtakes.ts`: `RivalOvertakes.update` returns only completed-pass **rival IDs** after ±5.5m longitudinal hysteresis. This is correct for scoring/applause but **too late for a sideways taunt**. Keep this tracker/score invariant unchanged.
- `src/main.ts`: consumes `rivalPasses`, calls `world.car.userData.motion.onRivalPass()` and optional passenger cue. At this point current event has no opponent side. Don't incorrectly map ID to the current lane after the target has moved far behind.
- `src/rival-race.ts`: `RivalState` holds `distance`, `lateral`, speed, identity and finish state. `state.distance`/`state.lateral` represent player road position. Vehicle-local direction needs coordinate sanity checks before assigning head rotation sign.
- `src/occupants.ts` already owns `head.rotation.y`, slight torso turns, `wind`, `sway`, `tipSway`, `flutterPhase`, existing applause/wave timing. Compose the new pose with these values rather than adding a conflicting controller.
- `src/passenger-cheer.ts` existing gestures and `src/sound.ts` existing audio can be reused if appropriate. Avoid per-frame geometry rebuilding, expensive cloth/physics and one new renderer.

## Proposed small event/animation contract

Separate two concepts **without** changing the race:
1. **Pass celebration/reward** (existing): `RivalOvertakes` still reports the rival's ID when a pass is fully cleared.
2. **Visual side-reaction opportunity** (new): a tiny state observer sees an eligible rival longitudinally near the player (e.g. a few metres in front to a little behind), with the player genuinely closing at a sensible relative speed. Classify `left | right` using target lateral offset relative to the player, confirmed against a real chase/road coordinate frame and player heading. Pick one nearest/most convincing car when many are alongside. On initiation, latch side and rival ID for the whole gesture; don't switch mid-motion when lanes shift or the road bends. One reaction per eligible encounter; rearm only after real separation/retake. Use time cooldown (e.g. 3–5 s) and do not interrupt another active gesture or start on a collision/impact.
3. API input to animation should be small: `trySideShout(side:'left'|'right')` (or a single signed side), not a large game-state object. The model remains independent of game rules; `occupants` owns easing and blending. Call while opponent is alongside; no ranking/rubber-banding effects. Decide whether/when existing `onRivalPass` applause should be suppressed/combined to avoid double cheer audio.
4. Restrict first pass to **race rivals**, not ordinary civilian traffic. If the animation works well and is not repetitive, later allow rare traffic reactions but preserve silence/cooldown during dense traffic. An overtaken rival's location is what sets LEFT or RIGHT: it is **not** permanently linked to the passenger's right-side seat.
5. Reset/checkpoint, pause/restart, finishing transitions and QA teleports must never generate a false new shout. Existing reset/hysteresis logic provides a starting point, but needs dedicated deterministic side-event tests.

## Art & rig prerequisites

Before any game hookup, have a rig with distinct `head/neck`, `upperTorso`, `crown/sideLocks/backLocks`, facial `shoutSmile` or mouth-open shape when practical. The mesh is currently a **single ~1.48M-triangle sculpt**; do not animate the high-poly mesh per frame. First isolate or approximate a low-poly head and 4–8 locks, verify forward/back and both side-turn silhouettes in Blender. The hairstyle must lag behind head/torso movement slightly, and it must not clip the blonde passenger through the driver on the left-side shout.

## Acceptance video/test checklist

1. Same approved heroine recognizable from rear at 0/120/280+ km/h before and after gesture.
2. Player overtakes rival on LEFT → passenger faces toward **player's left**, mouth opens, hair follows with delay; RIGHT → mirrors reliably without unnatural arm crossing.
3. Two rivals on both sides or dense passes → choose one reaction, don't twitch/flip or repeat every frame.
4. Rival passes the player (rather than player passing) → no false triumphant shout in this R0 implementation.
5. Collision or player reset/teleport/respawn → no inappropriate celebration.
6. Hair remains pleasing and seated at speed; maintain Pixel 8 acceptable frame-time, draw calls and memory.
7. No change to pass scoring, race AI, physics, collisions, game outcome or public main release.

## Roadmap

- **Current:** Issue #40 Blender hair-only prototype; add minimal neck/upper-body rotate-pose compatibility so its controls will not block future sided glances. No event runtime code yet.
- **After hair art approval:** optimize face/bust/hair, rig, produce GLB (separate narrow ticket).
- **After driving version is playable:** add side-pass observer + torso/head/mouth animation and test/record actual in-game L/R overtake. This should be a small gameplay-expression ticket, not a massive character animation system.

Budget: **NT$0 additional services** and conserve Codex quota. Julia art/experience direction; Codex local implementation and deterministic QA; owner accepts driving feel.

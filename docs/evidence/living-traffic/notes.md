# Living traffic (Goal B)

Traffic now has deterministic per-ID lane-change schedules: one second of amber
signaling, then a 3.5-second quintic move to an adjacent valid lane. Events are
24–44 seconds apart, with unsafe attempts postponed. A 4.5-second projected
clearance check includes the player, vehicles ahead/behind and reserved target
lanes. Approximately 10% of scheduled events omit the signal. Collisions keep
their independent displacement, momentum and recovery; reacting vehicles block
nearby maneuvers. Tapers cancel invalid targets without teleporting to a new lane.

The original 12-vehicle limit, cluster positions/IDs and open gaps are unchanged.
Signals add one instanced draw (maximum 24 lamps). Lane state is bounded by the
active actor pool and clears on replay/reset/disposal. Speed personalities now
include 50–80 km/h slow drivers, ordinary traffic, 180–240 km/h fast cars and rare
260–290 km/h cars/trucks. Buses and Sunshine Waffles mostly remain slower.

## Actual gameplay

`lane-changes.mp4`: normal chase camera, original two-channel game audio, three
trimmed scenes in order: car 0 signals left; truck 2 signals right; car 22 changes
right without signaling. The truck travels about 56 km/h. All moves completed with
zero impacts. `signal-0.png`, `signal-2.png`, `changed-22.png` show the same cases.
The footage and sampled frames were visually inspected at normal gameplay scale.

`fast.mp4`: a 283.4 km/h car remains at that speed throughout the recorded approach
and overtake; zero impacts. This canvas clip has no audio. The lane-change clip
contains game audio. The test controller follows a real vehicle from 48 m behind;
it does not force traffic maneuvers or disable collision.

A ten-minute deterministic window simulation encountered 136 vehicles within
100 m, including 24 below 70 km/h and 3 above 250 km/h at actual simulated speed.
It observed 22 lane-change starts, 4 unsignaled (the per-event probability is 10%,
not a guaranteed ratio in one journey).

## Verification

- Production build passed; existing bundle-size warning only.
- 19 focused unit tests passed (lane safety/reset/determinism, ten-minute bounded
  traffic, taper continuity, impact momentum, pass-by and shared skid feedback).
- Browser lane-change, extreme-speed overtake, all four vehicle collision/reset,
  and measured stereo/mute/pause/replay/New Route tests passed.
- Stereo tests use isolated seeded fixtures rather than assuming the changed
  first cluster can be driven through along its old test path. Assertions for
  channel dominance and collision exclusion remain unchanged.
- Edge 960×432, DPR2, 4× CPU throttling, desktop GPU: all three maneuver recordings
  maintained approximately 60 FPS after warm-up, with no streaming gaps.
- Existing collision response, pass-by/audio synthesis, handling, camera, shadows,
  tire effects, waffle model and cluster generation code are unchanged.

This is browser emulation, not physical Pixel 8 acceptance. Await Michael's PASS.
No main merge or deployment.

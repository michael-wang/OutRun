# Traffic continuity and observable lane changes

Baseline: e437d754a49a372d09e89a57c099cd903af5f340. Development only; no release/deployment.

## Reproduced cause

Headway slowed actual actors while the immutable recipe kept advancing at cruising speed. Once an actor left the active window, reconstruction forgot its actual progress and admitted the same ID at its nominal position. The old farthest-first pool selection also allowed closer actors to be discarded. This is a reproduced mechanism, not proof of the identity in Michael's unrecorded incident.

The deterministic Seed 1 ten-minute test recorded 13 impossible jumps before the fix and zero afterward (before.json / after.json). ID 7 moved from 8493.151 m at 74.6 s to nominal 8947.894 m at 74.8 s: 454.743 m in 0.2 s. The legitimate re-entry test now brings ID 7 back from behind at actual 8971.933 m rather than nominal 9929.845 m (reentry.json).

Actual position/speed history is retained per finite route ID; only 12 actors are active/rendered. Existing actors retain pool priority, entrants are selected by proximity, and first admission/visibility cannot occur in the immediate contact envelope. Swept collision checks use both actual endpoints and require prior visibility. Reset/dispose clear history. Collision impulse formulas are unchanged.

Lane state also survives window exit. Initial attempts have a deterministic 0.8–2 s delay, then a closing-speed-based observation window. Normal signals lead by 0.8 s and the quintic maneuver lasts 2.4 s. Safety prediction covers the whole maneuver; unsafe attempts postpone. Existing long cooldown and occasional unsignaled events remain.

## Actual gameplay

- normal.json: about 39 s at approximately 250 km/h, four blue cars passed, continued more than five seconds after overtaking, zero collisions, all sampled streaming-ready states true, minimum rolling FPS 59.99.
- scenic/normal.json: Seed 1 starting at 64547.15 m. Truck ID 199 signals around 1.94 s, moves from -5.25 m to -1.75 m, completes around 5.14 s, then is overtaken. No debug camera or slowdown to follow it. Zero collisions; minimum rolling FPS 59.
- lane-change.mp4: eight-second normal chase recording with original two-channel AAC audio. Signals are naturally smaller at initial distance; the truck's movement/completion and subsequent pass are visible. lane-change.png is a gameplay frame.

Browser emulation: Edge, 960 x 432, DPR 2, touch, 4x CPU slowdown, desktop GPU. These are not physical Pixel 8 measurements or human visual acceptance.

## Verification

Production build passed (existing bundle-size warning). Focused unit suite: 22 tests across continuity, traffic, speed variety, impact, lane changes, stereo pass-by and shared skid feedback. Browser checks cover normal driving, all four vehicle collision types/reset, impact rendering/recovery, stereo channel output, mute/pause, replay/New Route and historical data isolation. Recorded stereo dominance: left 7.91 dB; right 5.96 dB.

The older collision video fixture was updated from a crowded initial cluster to the existing isolated ID 62 fixture, with recovery steering away from the impacted vehicle rather than into it. Zero-contact and single-impact assertions remain intact.

Wait for Michael's physical Pixel 8 playtest and PASS.

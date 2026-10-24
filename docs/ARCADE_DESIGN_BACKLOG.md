# Project OutRun — Arcade product roadmap

**Last product decision:** The user accepted **1.75× arcade world pace** after v0.3.2 A/B playtesting. Focus can now move from raw speed to controllable arcade racing.

## In scope now — v0.4 Arcade Handling & Rhythm

**P0: steering, desktop keys and HUD**
- At 1.75×, held steering became too sensitive. Short A/D or thumb input should permit small precise corrections; sustained input remains powerful for real corners. Do not reintroduce lane assists.
- PC: `A/D` steer, `Space` accelerator, `Enter` brake, concurrent input and focus-safe controls. Pixel 8 touch stays as before.
- Prominent arcade speedometer; current small lower-left speed is inadequate.

**P1: expressive turning / intentional drift**
- Decouple turn input, path and visual body slip while keeping physics/road boundaries coherent. Candidate visually obvious yaw ~20–40° in intentional high-speed drift.
- Gentle steering should **not** squeal constantly; link tire audio to actual significant slip with stable triggering/hysteresis.
- Steering/braking/throttle afford controllable recovery, not 360° uncontrolled spin; preserve fixed camera and speed perception.

**P1: designed arcade road rhythm**
User target at representative full racing pace: **6–7s easy acceleration → 3–5s stimulating turn → 6–7s breather → 3–5s stimulating turn → 2–3s dangerous turn → 3–5s recovery**; repeat with variation. Track geometry must be distance-based rather than triggering bends on timers; challenge comes from road shape, not unpleasantly twitchy controls.

See `docs/V0.4_SPEC.md` for current scope and acceptance. The user decides if v0.4 handles right after playing.

## Deferred — v0.5: original open-top car and expressive occupants

- Replace closed-roof body with an attractive **unbranded convertible**, cockpit/seats/two stylized people visible from the chase view. No direct Ferrari, SEGA art or character likeness.
- Add animated passenger reactions in incremental steps once the car model and handling are stable: joyful body leaning, hair/scarf flutter, hands lifting on crests and bigger drifts.
- Keep performant on actual Pixel 8 with no huge art-asset system. Design the motion to reinforce speed but avoid distracting from the road.

## Later: scenic stage transitions

- Visually dramatic change every ~30–45s of representative driving (coast, desert, city, mountains/forest/snow), with seamless streaming and distinct color/materials/props.
- Stage variety is desirable, but shouldn't replace quality in pacing, steering, drift and speed.

## Work philosophy

Solve the actual game problem each iteration. No process overhead for its own sake, and no speculative feature expansion. **v0.4 is deliberately NOT a convertible/scenery milestone.**

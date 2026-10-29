# Traffic MVP

Ten-minute Road Trips now include sparse same-direction traffic: blue passenger cars (34 m/s), yellow buses (22 m/s), and box trucks (27 m/s). Seeded placement starts well ahead of the player. Vehicles follow the existing curved/elevated road and lane tapers; simple headway keeps them separated. Contact reduces player speed by 35%, with a 1.25-second cooldown and no steering impulse.

Traffic is capped at 12 vehicles, using three shared instanced geometries/material batches. Vehicles outside the nearby window are removed, and vehicles appear only on loaded road. Replay resets traffic; changing routes reloads its seed. No handling, road generation, Trip Codes, HUD, PWA or streaming scheduling changes.

## Gameplay evidence

- [Approach](evidence/traffic-mvp/approaching-car.png), [overtake](evidence/traffic-mvp/overtaking-car.png), [bus](evidence/traffic-mvp/bus-later.png), [truck](evidence/traffic-mvp/truck-later.png).
- [15-second actual gameplay recording](evidence/traffic-mvp/traffic.mp4): slower car approached and passed, then bus and truck on the canyon road.
- [Driving samples](evidence/traffic-mvp/driving.json), [wheel-contact ray audit](evidence/traffic-mvp/contacts.json), [performance](evidence/traffic-mvp/performance.json).

## Verification

Production build passed (existing bundle-size advisory). Unit suite: 105 tests. Browser suite: 16 tests covering traffic, public entry, mobile release, precision and streaming/performance; the traffic contact/replay check was repeated after the final lane-taper fix. Coverage includes seeded replay, bounded extended travel, collision cooldown, lane narrowing, all vehicle types, passing, road readiness and wheel placement across six route positions. Largest audited wheel-to-road gap was approximately 3.7 cm. Historical evidence remains intact; new regression captures are under this milestone's `regressions/` folder.

Edge browser emulation: 915 × 412 touch viewport, DPR 2.625, 4× main-thread CPU slowdown, desktop GPU. Three steady scene probes measured approximately 60 FPS, render submission CPU 2.50–3.46 ms, and 114/179/188 draw calls (previous baseline 112/176/185). Cold startup probe: 2.62 seconds. The 15-second driving capture averaged 58.75 FPS, with a 40.40 FPS minimum during screenshot capture; at most five traffic actors were present and road readiness remained true. These are browser measurements, not physical Pixel 8 results or a GPU benchmark.

Michael's physical-device playtest and Julia's visual acceptance remain pending. This MVP has no lane-changing AI or damage system.

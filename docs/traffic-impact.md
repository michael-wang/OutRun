# Arcade traffic impact

Baseline: `7e738763997ff45ddc02e246709c963bc6803790`; dev only.

Swept road-space contact returns actor, side/rear classification, contact position and severity. Both vehicles receive actual lateral impulses and brief yaw/roll; rear impacts additionally kick traffic forward and penalize player speed more strongly. Per-actor displacement survives traffic updates, smoothly returns toward its lane and is disposed with the active window. Contact latching prevents repeated hits while touching. Rotated vehicle envelopes and the shared canyon rail dimensions constrain separation.

Collision-induced lateral velocity feeds the existing sustained skid policy, independently of audio availability. Smoke, marks and squeal share that result; impacted traffic reuses the same policy and bounded tire renderer. Sparks and metallic audio reuse the existing impact systems. No camera, steering integrator, traffic models, route generation or PWA changes.

Validation: production build; 20 focused unit tests; two traffic browser tests plus two guardrail/dust browser regressions. Car, bus, truck and Sunshine Waffles impacts, separation, recovery, deterministic traffic, bounded resources and replay cleanup passed. Clean overtake produced zero impacts; side swipe and rear impact each produced one. Normal driving resumed after steering correction. Streaming stayed ready throughout the sampled scenarios.

Mobile emulation: Edge, 915×412 touch, DPR2, 4× CPU slowdown on a desktop GPU. Steady sampled FPS approximately 59–60, comparable to the previous surface-contact browser check. This is a short regression check, not physical Pixel 8 acceptance.

Evidence: `evidence/traffic-impact/side.png`, `rear.png`, `clean.png`, compact sampled results and `drive.mp4` (actual gameplay with captured game audio). Await Michael's physical-device review and Julia's visual acceptance; no merge or deployment.

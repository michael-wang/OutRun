# Surface feedback and canyon guardrail contact

Baseline: `a97d49b331b033f8f9c7a8a3de817284e42ef56c`.

Dust reuses the bounded tire particle renderer, with sand tint and emission from actual off-asphalt wheel contacts above 3 m/s. It does not use skid intensity. Existing smoke, marks and squeal retain their shared skid signal.

Seed 1's 600–900 m guardrail uses the same offset and thickness for rendering and collision. Swept road-space contact accounts for vehicle dimensions and yaw, clamps the car inward, applies a severity-dependent speed penalty and brief inward/yaw/roll response. One latched contact episode emits sparks and a metallic audio transient; sustained outward steering does not retrigger it. Replay clears effects and contact state.

Validation: production build; 14 focused unit tests across surface contact, tire effects, skid feedback, canyon identity, audio and powertrain; two browser tests. Rendered car vertices retained at least 0.0797 m clearance in tested gentle and high-speed impacts. Both produced one impact; inward steering recovered after the hard hit. Asphalt produced no dust or impacts. Streaming remained ready throughout.

Browser emulation: Edge, 915×412, touch, DPR 2, 4× CPU slowdown, desktop GPU. Initial FPS samples reached 49.35; dust/contact samples were 59–60 FPS. These short checks do not establish physical Pixel 8 performance or acceptance.

Evidence: `evidence/surface-contact/before/` and `after/`; `drive.mp4` is an 8.49-second actual-rendering recording with captured game audio (asphalt, shoulder dust, hard impact/recovery, gentle contact). Comparison screenshots use fixed camera poses; gentle contact's initial lateral position was adjusted from 6.8 to 6.4 m to start within the new boundary. Raw sampled diagnostics are retained beside the images.

Await Michael's physical Pixel 8 review and Julia's visual acceptance. No main merge or deployment.

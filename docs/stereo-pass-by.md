# Stereo traffic pass-by

Position-driven audio presentation only; handling, traffic movement, collision response and existing effects are unchanged. Measured relative travel includes arcade pace. Close lateral clearance and at least 9 m/s closing speed are required. The envelope starts ahead, peaks alongside, and fades behind, with a filter/rate sweep. Cars are lighter; larger vehicles use heavier filtering. StereoPannerNode follows the vehicle's actual side. Two reusable noise voices and a 300 ms onset spacing bound dense traffic audio. Collision cancels whooshes; pause, mute, replay and route navigation retain their existing safety behavior.

## Verification

- Production build passed (existing bundle-size advisory).
- 19 focused unit tests passed, including both relative passing directions, suppression, reset, bounded voices and collision/skid regressions.
- Two Edge browser tests passed: stereo passes/exclusions/lifecycle; car/bus/truck/waffle collision separation and reset.
- Actual recorded mixed game audio decoded into left/right PCM: left pass maximum left dominance 7.78 dB; right pass maximum right dominance 6.42 dB, measured over 100 ms windows. This measures the output signal, not panner settings.
- Distant vehicle and slow following: zero starts. Collision: one impact, zero whooshes. Both clean passes: one start/crossing each, no impact. Mute and pause silenced measured output; resume did not repeat the event. Replay and New Route cleared state.
- Edge 915x412, touch, DPR2, 4x CPU slowdown, desktop GPU: settled pass samples 58.99–60 FPS; streaming ready throughout. This is browser emulation, not physical Pixel 8 acceptance or a controlled before/after device benchmark.
- Reviewed gameplay screenshots and frames from the recording. `drive.mp4` contains the left-side car pass followed by the right-side bus pass, with two-channel AAC game audio (3.90 seconds). No narration or reference samples.

Reference video was analyzed, **not listened to**, under Michael's explicit waiver. Its stereo channel energy, frequency-band energy and envelope informed the short, pronounced spatial transient; game positioning determines direction. Sound quality still requires Michael's headphone listening test and PASS.

Evidence: [stereo gameplay](evidence/stereo-pass-by/drive.mp4), [left](evidence/stereo-pass-by/left.png), [right](evidence/stereo-pass-by/right.png), [measurements](evidence/stereo-pass-by/verification.json).

# Project OutRun — Product roadmap

## Active v0.4.3: Soft Steering & Honest Curves

v0.4.2 **validated the gameplay-first driving paradigm** in actual play. Current needs:
- **Soft Detents:** Keep four stable steering magnitudes per side plus neutral and deliberate hysteresis, but smooth jumps in applied corrective force quickly, with responsive zero-return.
- **Curve honesty:** Inverse-generate stronger and more visible actual bends for High and Too-Fast challenge levels by calibrating ONE shared curvature/pressure scale; difficulty should not come from hidden force on mild-looking geometry. Smooth track challenge transitions.
- **Visual arcade drama:** Gentle inputs nearly neutral car body; large demanded steering produces exaggerated dynamic rendered car yaw, up to ~25–45° candidate, without reinserting path inertia or causing constant tire squeal.
- Retain the low/medium/high/braking-required/S playable challenge course, accepted 1.75× world pace, Pixel 8 analog horizontal strip + two-thumb/pedals, car-left needle speedometer, bounded off-road return and browser test coverage.

Current formal specs: `docs/V0.4.3_SPEC.md` and `docs/V0.4.3_ACCEPTANCE.md`.

## After v0.4.3 is human-approved

1. **Experience Director / difficulty scripts:** Hand-authored sequences of effort, width, sightline, elevation and optional obstacles, with Beginner/Intermediate/Advanced/Godlike versions. No advanced generator/editor until simple script improves real fun.
2. **Player-aware branch choices:** End-of-stage visible easy/hard forks. Avoid cheating through mid-corner invisible DDA.
3. **Original convertible:** Roofless original sports car, driver/passenger reacting with playful lean/hair/scarf/raised hands, maintaining Pixel 8 performance; no copying SEGA/Ferrari assets.
4. **Distinct scenes:** ~30–45s themed coastal/desert/city/forest/snow transitions once driving cadence feels right.
5. **Future cars / rival traffic / score:** Different grip/turn authority, obstacles, traffic, times and progression only after core driving has human-approved feel.

## Development philosophy

The user wants an OUTRUN-LIKE FUN GAME, not impressive process machinery. Tune a small playable challenge and run actual browser/phone tests; do not confuse passing unit tests with a good driving feel.

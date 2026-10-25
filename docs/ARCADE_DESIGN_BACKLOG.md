# Project OutRun — Current arcade priorities and deferred roadmap

**Current playable game:** v0.4.1 (local implementation `4d4b05c`, handoff `34b6a3e`). **Current owner-approved next task:** v0.4.2 Corner Exit & Road Rhythm.

## Now: v0.4.2

- **P0:** Keep the newly enjoyable analog steering turn-in. Diagnose and reduce unwanted steering/yaw/slip continuation after a corner, enabling quick release and countersteer **without** automatically rotating car toward road tangent or magnetic lane centering.
- **P1:** Much greater frequency/strength of road bends and **actual road elevation**, not just distant landscape. Use distance-authored gameplay rhythm and at least two visible climb/crest/descents in a 60–90s drive. Easy sections can be sweeping curves; avoid long lifeless straight stretches.
- Preserve accepted **1.75× world pace**, car-left needle speedometer, bounded shoulder/off-road speed penalty, PC A/D + Space/Enter, Pixel 8 continuous touch strip/fullscreen/PWA/long-press protection, off-road recovery, original assets and working loop.

See `docs/V0.4.2_SPEC.md` and `docs/V0.4.2_ACCEPTANCE.md`.

## After arcade handling/rhythm is accepted

**Original convertible and expressive occupants:**
- Create an original unbranded open-top sports car with visible driver and passenger in chase view, with no imitation of a Ferrari model, SEGA logos or copyrighted character likeness.
- After proving an efficient basic model, add small readable animated reactions to curves/crests/speed (body leaning, hair/scarf flow, hands rising). Performance on actual Pixel 8 matters.

**Scenic stage transitions:**
- Distinct backgrounds and roadside themes every ~30–45s of representative fast driving, e.g. coast → arid roads → city → alpine/snow, with coherent handoffs, no loading stutter.
- Scene variety is a reward for continued racing; it must not cover up bad speed or road handling.

**Later game systems:** Rival cars/traffic, time attack, branching routes, score, detailed audio/music, more levels — only after a strong base driving loop.

## Product rule

The next enhancement must improve player fun, not only produce more source code. Don't add systems before the core turn/accelerate/recover/continue loop passes a human playtest.

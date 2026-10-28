# Project OutRun

Original stylized Three.js + TypeScript + Vite browser arcade road-trip game. Pixel 8 landscape PWA, PC keyboard and PS4 gamepad. Inspired by classic Out Run's excitement, not licensed SEGA; future public name/assets must be original or cleared.

## NOW ACTIVE: v0.9 — Actual Seeded 10-Minute Road Trip

**Human v0.8.5 gate PASSED subjectively:** owner played the existing two-minute streamed Stage and reported no noticed lag, scenery popping or discontinuity, and normal photo use. Codex reported v0.8.5 LOCAL `97cff65` implementation + `f160929` handoff on `codex/v0.8.5-scene-streaming`, clean. Tests 93 unit/134 Playwright passed with 3 desktop scripted drives P95/P99 ~16.8ms and worst 49.9ms. Physical Pixel 8 sustained performance remains UNVERIFIED.

**User's next explicit commission:** deliver genuinely new **~10-minute Road Trip**, not another invisible engine improvement. Use existing v0.8.5 lazy streaming and a SMALL seeded L1/L2/L3 logical itinerary, without loading all future 3D road/terrain/scenery on boot. Road Trip must be actually playable continuously with varied scenic beats and driving challenge, independent Trip Code and fresh seeds, preservation of existing short Stage.

| Deliverable | Actual outcome expected |
| --- | --- |
| **10-Minute Road Trip** | Standstill start, distance-based ~8–12min nominal full drive, proper finish, Replay Same/New Route, progress and user review; existing short Stage unaffected |
| **Real variety** | different seeds change curve/grade/width/L2 motif schedule and geography, not just palm positions or five repeats of previous 2-min stage |
| **L3 travel mood** | supported city/coast/canyon blend with elevation appropriate to biome, thrilling sixth-gear sweepers, canyon technical/brake sections, downhill/crest and meaningful release |
| **Scene Streaming** | initial GPU/CPU geometry only near player, bounded active chunks/memory, no visible road seams/popping/hitch at skyline/biome changes, sensible high-progress precision |
| **Live feedback** | local privacy-first telemetry and screenshot, retrospective quick praise/issue anchored to correct Trip Code and real previous s, KEEP/REWORK/REJECT + difficulty |
| **Evidence** | ≥5 seeded long itineraries, ≥3 full browser-driven long recordings, ≥20min streaming memory soak, frame p95/p99/max and GPU resources over trip, honest Pixel/DS4 status |

### Current authoritative documents

- [Codex v0.9 Kickoff / Goal](docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md) — same existing OutRun Codex conversation, normal authorization then separate Goal.
- [v0.9 Long Road Trip Specification](docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md)
- [v0.9 Acceptance & Performance Gate](docs/V0.9_TEN_MINUTE_ACCEPTANCE.md)
- [Long-trip streaming architecture](docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md) — reference model
- [Phased long-trip roadmap](docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md) — v0.8.5 streamed short course done; v0.9 active; v0.9.1 separate visual improvement
- [v0.8.5 Streaming Foundation](docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md) — previous technical base, not second Goal.

### Source warning and stop

The latest PLAYABLE game source exists only in user's LOCAL `C:\astra-dev\OutRun` checkout. GitHub `main` is **docs-first**, not a replacement for working game code. Never checkout/reset/merge it over local playable branch. Codex branches `codex/v0.9-ten-minute-roadtrip` from actual current playable v0.8.5 HEAD and selectively imports only relevant current docs. User must submit the explicit normal Codex authorization and Goal; this docs update does NOT automatically run local code.

**Deferred until human tests long route:** v0.9.1 substantial city depth, mountain/bridge undersides and richer natural palms, later longer Mystery Drive, traffic/rivals, new worlds, Stage Composer and RPG coin/garage. No push, merge, deploy or edits to other repos.

Existing driving invariants: original 1.75× arcade world pace, six gears/300flat/downhill overspeed, speed- and grade-sensitive Lateral Balance, 144px four-soft-notch mobile two-thumb steering, road width 2–8, current coast/city/canyon, warm engine/soft tire squeal, 1s resume, gamepad Touchpad photo/SHARE fullscreen/Options and praise/issues, local private driving reports, multiple screenshot archive to `captures/YYYY-MM-DD`, old BRK/L2Pilot/short-Stage reviews intact.

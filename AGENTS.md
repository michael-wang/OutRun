# Project OutRun — Codex operating agreement

## ACTIVE milestone: v0.5 — High-Speed Spectacle

**Owner decision:** v0.4.3 was the first version where the owner genuinely enjoyed **high-speed cornering**. That is the new regression baseline. This new milestone is authorized to advance the game, **NOT** to rework its fundamental handling.

**Read first:** `docs/CODEX_V0.5_KICKOFF.md`, `docs/V0.5_SPEC.md`, `docs/V0.5_ACCEPTANCE.md`, then `docs/PRODUCT_VISION.md` and earlier handoffs for regression context.

The previous stop-after-v0.4.3 instruction ended that milestone for human review; after this owner's approval it does not permanently prohibit a new v0.5 assignment.

## Repository and permissions

- Work ONLY in `C:\astra-dev\OutRun`; verify Git remote is `michael-wang/OutRun`. Never edit `C:\astra-dev\topwar`.
- Latest playable v0.4.3 lives in the user's **LOCAL repository**, with code commit `84b18b3` and handoff `d370ef6`. Remote GitHub `main` is primarily documentation, **not** the game's working source. Never merge/reset/checkout the documentation-only main over the playable app.
- Preserve the latest local playable HEAD and any uncommitted user edits. Create a new `codex/v0.5-high-speed-spectacle` branch **from that playable HEAD**. Fetch origin/main and selectively bring in current `AGENTS.md`, `docs/V0.5_SPEC.md`, `docs/V0.5_ACCEPTANCE.md` and `docs/CODEX_V0.5_KICKOFF.md` ONLY, after inspecting for conflicts.
- If automated approval declines because of an old stop instruction, ask once for explicit user authorization in a **normal chat**; don't repeatedly retry or bypass permissions.
- No push, merge, public deployment, outside-project edits, paid services, credentials, licensed SEGA/Ferrari marks or copied game assets.

## Scope and execution order

**P0, do FIRST:**
1. Preserve the existing v0.4.3 gameplay-first `Arcade Lateral Balance` and its difficulty-to-geometry inverse generator, soft 4-notch steering and accepted **1.75×** world pace.
2. **Earlier visual pose onset:** light-to-moderate *actual bend* creates subtle visible vehicle attitude sooner. Avoid constant large yaw from a small correction on a straight or constant squealing.
3. **Bolder peak drift:** demonstrable dramatic rendered body yaw (~50–60° candidate, occasional brief ~65° if readable) during genuine strong fast cornering. Visual animation must NOT add lateral/heading inertia to the authoritative driving model.
4. **At-speed large corners:** build at least one substantial left and one substantial right **high-speed sweeping corner** with clear visual direction change, drivable near maximum displayed speed by a skilled human/scripted input. Keep the separately existing **braking-required Extreme corner**; do not silently make all hard-looking curves brake-only.

**P1, ONLY after P0 passes:** replace old closed-roof placeholder with **one original roofless sports car** featuring clearly visible cockpit and two occupants, optimized for chase view and Pixel 8. Original style, no Ferrari copy. Modest expressive passenger/driver reaction is BONUS if time remains; do not invent huge character rigs, full animation pipelines or new tracks.

**Defer:** scenic biome transitions, traffic/rivals, four-level difficulty director, racing modes, scoreboards, complicated car physics or separate new game engine.

## Verification and handoff

- Independently inspect existing actual source and game → implement small changes → run real browser play/driving → capture and inspect motion + screenshots → tune → run build/unit/Playwright → fix → commit locally.
- Compare slight, medium and maximum bend poses with actual measured yaw (rendered) and underlying position (authoritative); confirm no change to vehicle dynamics from pose.
- Verify high-speed sweep + Extreme brake-only corner using same inverse-required-steer model and real 3D road, with visible road geometry and ≥120s continuity.
- Preserve pixel 8 fullscreen/landscape/PWA, touch steering strip+two thumb controls+swap+long-press protection, desktop A/D+Space/Enter, car-left analog needle speedometer, no auto-lane-follow, bounded offroad penalty and fast recovery, fixed camera FOV/dolly and performance.

Create `docs/V0.5_HANDOFF.md` with local branch/commit/URL, source changes, before/after pose-onset and max-yaw measurements, full-speed sweeper drive evidence, old Extreme braking-required evidence, car and cockpit screenshots if implemented, desktop/mobile images, tests and honest real-device limits.

**Stop after v0.5 for human playtesting.** This is a milestone boundary only, not an indefinite ban on future user-authorized work.

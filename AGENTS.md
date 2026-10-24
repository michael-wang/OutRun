# Project OutRun — Codex operating agreement

## Active milestone: v0.4 Arcade Handling & Rhythm

**User decision:** v0.3.2's coherent arcade world pace **1.75× is provisionally accepted**. This ends the former speed GO/NO-GO hold and authorizes work on a focused v0.4 milestone. Do not undo the accepted pace or return to v0.3.1 baseline.

**Read first, in order:** `docs/CODEX_V0.4_KICKOFF.md` → `docs/V0.4_SPEC.md` → `docs/V0.4_ACCEPTANCE.md` → `docs/ARCADE_DESIGN_BACKLOG.md`. Previous milestone documents remain background/regression information; do not rerun an old Goal.

## Repo safety and autonomous development

- Verify actual workspace `C:\astra-dev\OutRun` and remote `michael-wang/OutRun`. Never work in `C:\astra-dev\topwar`.
- The playable v0.3.2 source remains **LOCAL**, with implementation commit `43fba35` and handoff `cd36798`. The GitHub `main` branch is a **documentation base**, not a replacement for the live game. Do not checkout, merge, hard-reset, or clone documentation-only `main` over the v0.3.2 code.
- Work from the newest playable local HEAD, preserving uncommitted work, on `codex/v0.4-arcade-handling`. Selectively bring in `AGENTS.md` and v0.4 docs from `origin/main`. Don't delete application source or rewrite the game.
- User expects autonomous source work, Git branch preparation, testing, visual/auditory reasoning and local commit. Do not stop for trivial decisions. Respect actual sandbox permissions; for the earlier auto-review authorization issue, request a **direct normal-chat authorization** if necessary, not repeated retries or bypass.
- Keep Three.js + TypeScript + Vite, existing engineering patterns, and tests. No full physics simulation, architecture theater, unnecessary framework, paid service, copied SEGA/Ferrari content or public deployment.
- No pushing, merging to main, altering other repos, modifying secrets or creating a public website without permission.

## Product priorities

1. **P0:** Fixed default `1.75×` world pace. Re-tune high-speed steering to be controllable with held digital buttons on Pixel 8 and keyboard, **without** lane assist, automatic curve following or reducing perceived speed.
2. **P0:** PC input mapping: `A` left, `D` right, `Space` gas, `Enter` brake (mobile controls remain unchanged). Make browser key defaults safe and never hijack menus or text input.
3. **P0:** Prominent, polished, readable speed HUD on desktop and Pixel 8, rather than tiny low-left numbers; preserve clean forward road composition and two-thumb ergonomic layout.
4. **P1:** Distinct intentional arcade drift with visible larger car yaw and tire squeal triggered by actual significant slip; ordinary light steering is quiet.
5. **P1:** A deliberately composed road rhythm (acceleration/easy → fun bend → breather → fun bend → short danger bend → recovery), distance-authored using the 1.75× pace, with navigable look-ahead and predictable steering.
6. **DEFER:** Roofless original sports car, occupants/reaction animations, scenic biomes and opponent cars. See backlog; no unrelated art scope in v0.4.

## Quality and handoff

- Implement → run real browser game → play input sequences → inspect screenshot and moving video → fix → run build/unit/Playwright → commit locally.
- Preserve v0.3.2 phone landscape fullscreen/PWA/safe areas, independent multi-touch, Android long-press suppression, speed-pacing motion, fixed camera FOV/dolly, bounded off-road shoulder, speed penalty, drift recovery, no auto steering and pause/menu.
- Do not pass P0 based on unit tests alone. On device-like viewport and desktop at 1.75×, compare gentle versus held steering, ordinary turn versus deliberate drift, and real straight/curved track driving.
- Hand off `docs/V0.4_HANDOFF.md` with actual commit/branch/local URL, P0/P1 pass/fail/unverified, 1.75× speed/handling measurements, real screenshots and play clips, new keyboard tests, loudness/audio checks *only if actually heard*, real Pixel test limitations, and major issues.
- Stop at v0.4 for human playtest. This stops the current task only; it is not a permanent prohibition on user-authorized future versions.

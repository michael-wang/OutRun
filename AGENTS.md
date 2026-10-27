# Project OutRun — Codex operating agreement

## ACTIVE OWNER-AUTHORIZED: v0.7D — True Multi-Placement L2 Composer + Limited v0.7C.1 Refinements

**Owner has played v0.7C.1.** Engine sound PASS. Compact **144 CSS-px full-left↔full-right** mobile steering travel PASS. Those achievements are FROZEN REGRESSIONS. The owner requests believable upshift torque/acceleration interruption, a smaller/lower gauge that does not overlap top-left MENU, and a slimmer lower-left steering control PANEL without redundant instructions. Proceed to the next L2 Composer fix **in the same sequential milestone**, not another independent conflicting Goal.

Read in order: `docs/CODEX_V0.7D_COMPOSER_KICKOFF.md`, `docs/V0.7D_TRUE_L2_COMPOSER_SPEC.md`, `docs/V0.7D_ACCEPTANCE.md`, `docs/REFERENCE_37S_DRIVE_BEATS.md`, `docs/V0.7C_L2_DESIGN_POSTMORTEM.md`, `docs/L1_PRIMITIVE_CATALOG.md`.

## Safe working copy / permissions
- Work ONLY in `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`; never touch `C:\astra-dev\topwar`.
- Current PLAYABLE v0.7C.1 lives in user's LOCAL code commits `f0ec3f7` + handoff `d1fea62` (Codex report; inspect current HEAD/status). Remote GitHub `main` is docs-first, not the game. **Never merge/reset/check out documentation-only main over source**.
- Create `codex/v0.7d-multi-placement-l2` FROM latest playable local HEAD, preserving uncommitted source and user review localStorage; fetch origin/main, selectively import ONLY new v0.7D specs/kickoff, reference-beats doc and this AGENTS.md. Protect other local docs/README and app.
- Prior stop-after-v0.7C.1 was to gather human playtest feedback; this was received. If auto-review still denies Git, obtain explicit ordinary-chat owner permission, don't repeatedly retry rejected action or bypass actual sandbox approvals.
- No pushes, merges, public deployments, payment, secrets, third-party engine/audio models, licensed SEGA/Ferrari assets or unrelated project edits.

## Product work, in order
1. **Mobile HUD/panel P0:** Oversized gauge at top-left covers MENU. Shrink dial to about 20–26% mobile landscape screen height (tune for legibility), LOWER toward car-left, keep needle/numeric speed 0–300 and gear readable, avoid road apex/pedals/controls and menu hitbox. Shorten steering panel's VERTICAL height to about 10–14% viewport, remove instructions "STEER · NEUTRAL" / "4 LEVELS · RELEASE TO NEUTRAL". Preserve actual **144px HORIZONTAL steering travel**, soft nine effective detents and comfortable touch hitbox, hand swap and two-thumb held-gas operation.
2. **Upshift feel P0:** Genuine automatic shift torque reduction/engagement ~100–300ms causing an actual short pause/dip in longitudinal acceleration. Vehicle speed remains physically continuous and may dip slightly due to real drag, NOT a hardcoded speed subtraction. Five shift telemetry events, coherent RPM/audio already rated PASS, real 300 cap and acceptable acceleration preserved.
3. **L2 Composer core:** The prior v0.7C 16 generated L2 were PRODUCT NO-GO because each was one C+E+W whole-route overlay, not multi-event gameplay. Implement local **placements[]** with distance start/end and multiple sequential C (and overlapping E/W). Build **exactly THREE** ~25–40s genuinely varied L2 pilots, NOT another massive 16-route batch; no arbitrary hard count like "3–5 L1". Reference ~37s screenshot beats, but image frames cannot reveal exact underlying event count or audio.
4. **Keep L2 Lab feedback:** immediate praise/issue with spatial snapshot, end KEEP/REWORK/REJECT and difficulty, local JSON export, historical BRK r2 8 KEEP and previous v0.7C first four REJECT/twelve UNREVIEWED records preserved. New L2 pilot IDs start UNREVIEWED.
5. **QA:** actual rendered/browser drive of three pilots, mobile 844×390 and 960×432 HUD/touch and menu tests with screenshot comparisons, longitudinal torque/RPM/speed telemetry around shifts, full build/unit/Playwright, reproducible geometry/road terrain, plus actual frame/audio behavior.

Write `docs/V0.7D_HANDOFF.md` with objective evidence, screenshots/videos, local commit(s), updated phone URL and PASS/FAIL/UNVERIFIED. STOP for human vehicle/UI and three-L2 PLAYTEST. No v0.7B, traffic, RPG, new biomes, full editor or separate parallel Goal.

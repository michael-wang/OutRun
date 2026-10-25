# Codex autonomous kickoff — v0.5 High-Speed Spectacle

**This follows the human's explicit approval of v0.4.3's FUN high-speed cornering. Preserve that result.** The new tasks are earlier visible turn attitude, greater maximum dramatic yaw and spectacular but **full-gas navigable** fast sweepers. The next appropriate product feature (P1 after P0) is the original open-top sports car with two visible occupants. Scenery-theme transitions are for a later milestone.

## Safe local source setup

- Existing playable v0.4.3 is on user's Windows machine `C:\astra-dev\OutRun`, code commit `84b18b3` and handoff `d370ef6` (verify latest local HEAD and worktree).
- Remote GitHub `main` is primarily docs, not the playable source. Never replace or hard reset game code with main.
- Codex should branch `codex/v0.5-high-speed-spectacle` **from the local playable v0.4.3 HEAD**, fetch origin/main and selectively import ONLY latest `AGENTS.md`, `docs/V0.5_SPEC.md`, `docs/V0.5_ACCEPTANCE.md`, `docs/CODEX_V0.5_KICKOFF.md`. Preserve local README, code and changes. Do not blindly cherry-pick all documentation history if it could overwrite source.

## Authorization if Goal blocks on a previous stop-after instruction

Only if asked, the owner can send in a **normal Codex chat**:
`I authorize Project OutRun v0.5 High-Speed Spectacle, superseding the previous stop-after-v0.4.3 milestone instruction. You may preserve my playable local code, create a v0.5 feature branch, selectively import the v0.5 docs, develop, test and commit locally. Do not push, merge, deploy or touch other repos.`

## Ready-to-paste Goal

```text
/goal Continue the EXISTING playable LOCAL Project OutRun v0.4.3 into v0.5 High-Speed Spectacle. Preserve its HUMAN-APPROVED fun Arcade Lateral Balance model, 1.75x world pace, four-step soft-detent steering and all Pixel 8/PC controls. Verify git remote/status, preserve work, create codex/v0.5-high-speed-spectacle from the latest playable v0.4.3 HEAD (84b18b3/d370ef6 or later), fetch origin/main, and selectively import ONLY AGENTS.md, docs/V0.5_SPEC.md, docs/V0.5_ACCEPTANCE.md and docs/CODEX_V0.5_KICKOFF.md; never merge documentation-only main over app code. Read specs. P0 body pose: lower the threshold for subtle visible car reaction on a REAL gentle curved road (approx 3-8 degrees for ~0.25 steering), keep near-straight micro-steering calm, progressively amplify real hard drift pose (50-60 degree candidate peak), fast visual settling, no added physical yaw/lateral inertia or constant mild squeal. P0 road: create or expand a major LEFT and RIGHT high-speed sweeping bend with striking 70-110 degree cumulative heading change that a skilled player can navigate at ~220-234 displayed km/h at 1.75x while holding gas, using required-steering inverse track generation and no invisible per-segment grip boosts. Keep a separate visibly tighter EXTREME corner requiring early braking to pass at reference speed, and preserve Low/Medium/High/S sections. Verify filmed full-speed sweeper success vs Extreme brake-only comparison, 120s real rendered road continuity, fixed camera and readable high-speed phone framing. P1 only AFTER P0 passes: create an original unbranded roofless sports car with a readable cockpit, driver and passenger in chase view; modest expressive lean/head reaction is a BONUS. No Ferrari/SEGA assets, no visual regression/phone performance loss. Independently implement, drive in actual browser, inspect screenshots and motion clips, record measured body yaw and curve calibration, run build/unit/Playwright/regressions, correct defects, commit locally and create docs/V0.5_HANDOFF.md with honest PASS/FAIL/UNVERIFIED, exact launch URL, car art status and remaining Pixel hardware checks. No push/merge/deploy, TopWar changes, biomes, rival AI, adaptive director or v0.6. Stop for human playtesting.
```

## Acceptance standard

The owner should immediately recognize that slight corners now show an appropriate small attitude, aggressive corners have bold sideways car poses, and a visually exciting full-speed sweeping coastal turn can be conquered without braking. The extreme technical corner stays visibly different and brake-required. If P0 loses fun, **STOP and fix P0 instead of building a pretty new car**. Do not claim subjective acceptance merely because a unit suite is green.

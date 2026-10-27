# Project OutRun — current Codex work agreement

## ACTIVE OWNER-AUTHORIZED TASK: v0.7D.1 Driving & Input Quality

The owner played **all three v0.7D multi-placement L2 pilots and gave KEEP** with human difficulty 2/3/2. Their exact exported review is archived under `docs/reviews/V0.7D_PILOT_R1_HUMAN_FEEDBACK.json`. The exported autoQA remains PENDING (separate from Codex build/test reports); old human votes/anchors are immutable.

### User-requested corrections

1. On REAL upward grade, throttle gives lower acceleration and coasting decelerates faster than flat. Actual road height must be the force source.
2. At SAME bend, 300 km/h is noticeably more demanding/slippery than 150, while ~230 reference calibration and fun Arcade Lateral Balance remain.
3. Sometimes LEFT skid/squeal audio is absent although it later works on other maps. Investigate signed slip and audio lifecycle, no arbitrary all-the-time screech. Preserve already accepted warm engine sound.
4. PC keyboard-only menu: P=Play Again when finished, Tab navigation, focused Enter activates a button, but Enter=brake while actually driving; focused controls and text entry must not accidentally gas/brake.
5. Prefer native PS4/DualShock4 Gamepad API support, gracefully handle standard/nonstandard mapping and disconnect. Real hardware compatibility marked UNVERIFIED if absent.

Read `docs/CODEX_V0.7D1_KICKOFF.md`, `docs/V0.7D1_DRIVING_INPUT_SPEC.md`, `docs/V0.7D1_ACCEPTANCE.md` and `docs/V0.7D_PILOT_HUMAN_REVIEW.md`. Work from actual LOCAL playable v0.7D HEAD (`367fe15` / `4a9ec77` reported), not docs-only remote `main`.

## NEXT PREPARED BUT DEPENDENT: v0.8 First Procedural Stage

The owner sets the north star: generate an actually FUN, replayable FIRST LEVEL. `docs/V0.8_STAGE_ONE_SPEC.md`, `docs/V0.8_STAGE_ONE_ACCEPTANCE.md`, and `docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md` are prepared, **NOT authority to start automatically**. Need v0.7D.1 completed, local commit, owner actual driving review and then new authorization. No concurrent Goals on the same checkout. Stage One reuses existing three approved L2P recipes/18 L1 as motifs, with seeded physically different Stage Codes.

## Source safety & QA rules

- Authorized work only within `C:\astra-dev\OutRun`, expected GitHub remote `michael-wang/OutRun`. Existing working source is LOCAL, remote `main` chiefly docs. Never reset/merge/check out docs-only main onto app code.
- Branch `codex/v0.7d1-driving-input` from latest playable LOCAL HEAD, fetch origin and selectively import ONLY current v0.7D.1 docs/`AGENTS.md` and archived r1 pilot review file. Preserve current code/reviews/localStorage and any uncommitted edits.
- If Codex automatic approval rejects an older stop instruction, request explicit normal-chat authorization in the SAME OutRun conversation and respect sandbox refusal.
- Preserve real six-speed 300 km/h, 1.75× pace, 144px mobile thumb travel, compact HUD, original warm audio, 4 soft steering detents, offroad recovery, three scenic packs, animated original car, genuine 2–8 lanes and hilly road, original 8 BRK r2 and earlier v0.7C review history.
- Actually drive tested curves/grades, inspect real sound/keyboard/optional gamepad, run build/unit/Playwright, write `docs/V0.7D1_HANDOFF.md` with PASS/FAIL/UNVERIFIED. No push, merge, public deploy, TopWar edits, user-data upload, RPG/game-economy/editor/traffic or automatic v0.8.

**STOP after v0.7D.1 for human test.** Subsequent user-approved work can continue under new authorization.

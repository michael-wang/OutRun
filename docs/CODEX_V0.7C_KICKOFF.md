# Codex kickoff — v0.7C L1 Library & L2 Feedback Lab

**Status:** USER EXPLICITLY COMMISSIONED this next development work on 27 Oct 2026 after approving four kinds of positive real-time feedback. This replaces the earlier smaller *proposed-only* L1 stacking experiment. The formerly completed v0.7A.1 stop was for human brick rating; the human finished that review with **8/8 KEEP**, then authorized this follow-up. Scope is v0.7C, **NOT** v0.7B Pacific five-minute journey.

## Before starting — source protection

- Codex LOCAL workspace `C:\astra-dev\OutRun`, remote expected `michael-wang/OutRun`; verify actual HEAD/branch/status. Latest v0.7A.1 commit SHA is not in the remote docs; infer it from current playable local repo, do NOT assume an old `e6e80f0` is current.
- GitHub `origin/main` has largely documentation but NOT playable source. **Do NOT merge, reset, or check out docs-only origin/main over the game.**
- Create `codex/v0.7c-l1-l2-feedback` from latest playable local HEAD, preserving unexpected edits/uncommitted files. `git fetch origin` and selectively import ONLY current `AGENTS.md`, `docs/V0.7C_SPEC.md`, `docs/V0.7C_ACCEPTANCE.md`, `docs/V0.7C_L2_COVERAGE_MATRIX.md`, `docs/L1_PRIMITIVE_CATALOG.md`, `docs/CODEX_V0.7C_KICKOFF.md` and `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json` if needed. Preserve old R1 review file, local code/README and original Brick Lab state.
- Earlier Road Profile Inspector addon was a separate optional task and NOT a prerequisite. If implemented locally, preserve it; if absent, don't build it first. If another Goal is genuinely active/has uncommitted work, do not run conflicting Goals on the same checkout; preserve state and ask owner as appropriate.
- If automated permission denies Git operations due to old “stop after v0.7A.1” context, ask for explicit owner authorization in the SAME Codex conversation as a plain, **non-/goal** message, respect sandbox approval; no loops attempting to bypass an actual denial.
- No push, merge, public deploy, paid services, other repos such as `C:\astra-dev\topwar`, network telemetry or licensed SEGA/Ferrari assets.

## Normal-message authorization (send in SAME OutRun Codex conversation BEFORE a new Goal if prior permission stops were problematic)

`I explicitly authorize Project OutRun v0.7C — L1 Library & L2 Feedback Lab, superseding the prior stop-after-v0.7A.1 instruction. You may create a new local branch from my latest playable OutRun checkout, selectively import the approved v0.7C docs from origin/main without overwriting source code, implement and automatically verify the full first L1 library (8 Curvature + 6 Elevation + 4 Width), create the systematic 16 playable L2 combinations, and build an in-drive positive/issue feedback UI with final L2 reviews, local persistence and JSON export. Run browser tests, fix errors and commit LOCALLY. Preserve all original 8 accepted r2 bricks and my historical R1/R2 reviews. Do not push, merge, deploy, touch another project, start v0.7B, or build RPG economy. I will start the development Goal separately.`

## READY TO PASTE NEW GOAL

```text
/goal Implement Project OutRun v0.7C — L1 LIBRARY & L2 FEEDBACK LAB on the EXISTING PLAYABLE LOCAL v0.7A.1 codebase. Verify C:\astra-dev\OutRun remote, HEAD and clean working state; preserve latest playable game and reviews. Create codex/v0.7c-l1-l2-feedback from playable local HEAD; fetch origin/main and selectively import ONLY current AGENTS.md, docs/V0.7C_SPEC.md, docs/V0.7C_ACCEPTANCE.md, docs/V0.7C_L2_COVERAGE_MATRIX.md, docs/L1_PRIMITIVE_CATALOG.md, docs/CODEX_V0.7C_KICKOFF.md and docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json. Never merge/reset docs-only main over playable source. Previous optional Road Profile Inspector is NOT a dependency. Read these documents.

P0 build/audit reusable L1 PROFILE LIBRARY: 8 Curvature shapes C01-C08, 6 Elevation shapes E01-E06, 4 Width shapes W01-W04; prefer adapters/refactors of existing v0.7A.1 code over rewrites. Auto/unit verify L1 shape/continuity/real road/width, do NOT ask human to separately play L1.

P0 compose 16 DISTINCT, deterministic, roughly 30-60 second playable L2-001..016 from EXACT systematic 16-row C/E/W coverage matrix with current Azure Coast/Golden Canyon/Sunlit City worlds. Curvature/elevation/width overlap in the same real 3D road, one resolved value per channel, terrain/scenery conform to road and L3 theme. Expose tiny opt-in ?lab=l2 interface in FOUR batches of four with Play/Replay/Next/Previous and route code/seed; preserve normal free play and original ?lab=bricks with unchanged R1/R2 reviews. All new L2 start HUMAN UNREVIEWED/UNRATED, regardless of autoQA.

P0 REAL-TIME FEEDBACK: show small touch-safe positive praise and issue buttons DURING an L2 drive. Snapshot exact L2 ID/revision/seed, current s/time/speed/steer/x/height/grade/real width+lane count/world/C/E/W BEFORE pausing and releasing controls. Four exact Traditional Chinese praise tags: 超好玩!, 超刺激!, 超難! 但是過了超爽!, 風景優美. Positive tag should take one tap without typing; issue button allows immediate short text. Pause safely for input then resume with no sticky gas/steer/keyboard; allow multiple events. The 'hard but so rewarding' tag must be selectable AFTER the corner/L2 ends and attributed to the JUST-COMPLETED challenge. On L2 completion capture independent KEEP/REWORK/REJECT, perceived difficulty 1-5, optional note and the same praise tags. Persist locally, Export Feedback JSON including exact anchors/parameters and original human ratings kept separate. No automatic telemetry/upload/backend.

Keep human-APPROVED arcade handling at 1.75x, Pixel 8 landscape/fullscreen/PWA/two-thumb hand-swap, PC A/D+Space/Enter, animated car/characters, scenic biomes, 2-8 true lanes, graded mountain/valley and bounded off-road penalty. No L1 manual review, no v0.7B five-minute Pacific road, Mystery Drive, Stage Composer, coins/garage, rival traffic, new snow/volcano, speculative AAA planner, other-repo edits, push, merge or deployment.

Autonomously implement; actually DRIVE all 16 L2 in a real browser and inspect desktop/Pixel-like screenshots/video for roads, terrain, width and flow. Unit test all 18 shapes, deterministic replay, new positive/issue review event anchors and local export, mobile touch/keyboard input, old BRK history and gameplay; run npm run build, npm run test, npm run test:e2e, fix defects. Commit locally and write docs/V0.7C_HANDOFF.md with 18-family implementation mapping, 16 L2 coverage, actual browser evidence, working ?lab=l2 LAN URL, local export instructions and honest PASS/FAIL/UNVERIFIED. All 16 L2 human votes MUST remain UNREVIEWED. STOP for owner's human L2 evaluation.
```

## Definition of handoff

Eight original v0.7A.1 approved Brick Lab drives still work; owner can open a new L2 Lab and play 16 deliberately varied C/E/W stacked roads in four batches, report positive or negative observations instantly with exact reproducible position, finish each and submit a standalone difficulty/fun vote, and export one file to discuss with Julia. Actual gameplay & review UX matter more than elaborate infrastructure.

Do not call green unit tests proof of fun. Stop for human review after local commit.

# Codex autonomous kickoff — v0.6 Scenic Journey

**New authorized milestone:** The user received playable v0.5 and asks Julia/Codex to own subsequent development. v0.6 priorities are **more varied roads and significantly more varied roadside scenery**; fix visually static wheels; create simple wind-responsive occupants/hair only after main delivery works.

## Before Goal: safe local checkout

- Work at `C:\astra-dev\OutRun`, git remote `michael-wang/OutRun`. Verify `git status --short`, current branch and actual latest playable game. v0.5 implementation `645b7ed`, handoff `9a05fc3` (or later local commits).
- GitHub origin/main holds documentation but not full game source. Preserve all existing playable code: create `codex/v0.6-scenic-journey` FROM current local playable v0.5 HEAD, fetch origin/main and selectively import ONLY `AGENTS.md`, `docs/V0.6_SPEC.md`, `docs/V0.6_ACCEPTANCE.md` and `docs/CODEX_V0.6_KICKOFF.md`. Do not merge/reset/checkout docs-only main over the game; preserve local README & source.
- Prior stop-after-v0.5 applied to that version. If Codex's automatic approval rejects the new Goal, have user explicitly authorize in a **normal chat**, then resume; never bypass actual permission rejection or retry indefinitely.
- No push, merge or publicly hosted deployment. No touching TopWar, services/accounts or unlicensed assets.

## Suggested explicit normal-chat authorization BEFORE launching Goal

`I authorize Project OutRun v0.6 Scenic Journey development, superseding the previous stop-after-v0.5 instruction. You may safely branch from my local playable v0.5 code, fetch and selectively import v0.6 specs, implement the requested wheel, scenery, track and occupant improvements, run tests and commit locally. Do not push, merge, deploy publicly or modify any other project.`

## Ready-to-paste Codex Goal

```text
/goal Develop Project OutRun v0.6 SCENIC JOURNEY on my EXISTING PLAYABLE LOCAL v0.5 codebase. Verify C:\astra-dev\OutRun git remote/status, preserve v0.5 HEAD (645b7ed/9a05fc3 or later), create codex/v0.6-scenic-journey from playable HEAD, fetch origin/main and selectively bring over ONLY AGENTS.md, docs/V0.6_SPEC.md, docs/V0.6_ACCEPTANCE.md, docs/CODEX_V0.6_KICKOFF.md; NEVER overwrite application code by merging documentation-only main. Read specs. P0 first FIX animated wheels: all rolling wheels visibly spin at real 1.75x travel, front wheels also steer with control, strong ~50-60-degree body yaw no longer exposes frozen/disconnected wheels; account for high-speed frame aliasing and verify with real low/fast/drift video. P0 MAIN PRODUCT WORK: build one continuous playable scenic journey with three clearly differentiated acts AZURE COAST -> GOLDEN CANYON -> SUNLIT COASTAL CITY, each with unique close roadside props, midground and landmark silhouettes and distant landscape, approximately 30-45 seconds per act at nominal 1.75x high-speed travel by DISTANCE (not timers), with two smooth visible scene transitions and no pop/reload. P0 TRACK VARIETY: within the same gameplay-first inverse-required-steer track generator, stage distinct driving rhythms: coast fast left/right sweepers+crest, canyon S bends/grade and an early-braking technical turn, city wide boulevard/downhill sweeper/breather, preserving the existing low/mid/high/Extreme/S requirements, human-approved handling and optical flow. Use lean original art, reusable geometry/instancing/LOD where useful; avoid uniform cloned objects, empty scenery, sudden palette swaps, road occlusion, and mobile frame stalls. After all P0 is demonstrably solid, P1 add inexpensive occupant animation: driver arms/head/body react to steering, visible long-haired female occupant hair blows clearly backwards at speed with gust/turn asymmetry, both readable on Pixel 8 chase view; no complex character rig or physics changes. Autonomously launch and actually drive game, inspect real desktop/landscape mobile screenshots for EACH act, capture footage of BOTH scene transitions and wheel motion in strong drift, run >=180s long drive with road/mesh continuity and performance samples, run build/unit/Playwright regressions and fix failures. Commit locally and deliver docs/V0.6_HANDOFF.md with stage-time/distance map, clips/screenshots, wheel and occupant proof, asset provenance, PASS/FAIL/UNVERIFIED and actual local/Pixel URLs. Do not push, merge, deploy, touch TopWar, start v0.7, add rival cars/scoring/difficulty director, or damage the driving feel. Stop for human playtest.
```

## Human delivery criterion

A player can launch existing Pixel 8 / desktop game, drive along the same route through THREE strikingly different environments with distinct road challenges and NO visible pop/broken road, see wheels obviously work in extreme corners, and (if P1 is implemented) see characters and hair move naturally at speed. Existing fun handling remains intact. Test screenshots and green unit suites are NOT substitutes for an actual full-journey video.

If new landscape work threatens performance or steering, downgrade scenery asset density, not the accepted 1.75x game movement or critical controls.

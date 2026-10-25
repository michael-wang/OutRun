# Codex kickoff — v0.4.1 Analog Arcade Steering & Rescue

**IMPORTANT: Revised product decision BEFORE any v0.4.1 handoff.** Ignore prior v0.4.1 sensitivity-only Goal drafts. The user now wants a **continuous virtual analog steering wheel** with a horizontal absolute-position strip on Pixel 8, plus a PC-controlled virtual position, combined with simple near-zero-inertia arcade response.

## Source preservation and user authorization

- Existing playable v0.4 is LOCAL at `C:\astra-dev\OutRun`, code commit `04a1f2b`, handoff commit `ba76b22` (inspect current HEAD and preserve any later changes).
- Remote GitHub `main` contains **specifications** and is NOT the playable game branch. Do not merge/checkout/reset the playable checkout to main or re-scaffold.
- Codex should create `codex/v0.4.1-analog-steering` from the latest playable local HEAD. Fetch origin/main; **selectively restore** `AGENTS.md`, `docs/V0.4.1_SPEC.md`, `docs/V0.4.1_ACCEPTANCE.md`, `docs/CODEX_V0.4.1_KICKOFF.md` from latest origin/main, and continue on playable code. Preserve uncommitted data, inspect for collisions.
- Earlier "stop after v0.4" means stop that milestone pending review. If auto-approval needs a new explicit authorization, ask the user to send a **NORMAL chat** message:
  `I explicitly authorize Project OutRun v0.4.1 Analog Arcade Steering & Rescue, superseding the earlier stop-after-v0.4 instruction and any older v0.4.1 drafts. You may create a local feature branch, import only the revised v0.4.1 specifications, implement/test within OutRun and commit locally. Do not push, merge, deploy or modify any other project.`

## Ready-to-paste Goal (after authorization if required)

```text
/goal Develop the EXISTING local Project OutRun v0.4 game into v0.4.1 Analog Arcade Steering & Rescue. This REPLACES the older v0.4.1 steering-sensitivity-only plan. Verify correct C:\astra-dev\OutRun checkout, preserve playable local v0.4 HEAD 04a1f2b/ba76b22 or later, create codex/v0.4.1-analog-steering from playable HEAD, fetch origin/main and import ONLY the current AGENTS.md and docs/V0.4.1_SPEC.md, docs/V0.4.1_ACCEPTANCE.md, docs/CODEX_V0.4.1_KICKOFF.md; never merge the docs-only main or erase game code. Read the documents. First inspect/diff v0.3.2→v0.4 steering inertia/regression. Implement ONE shared normalized steering position -1..+1: on Pixel 8 landscape replace left/right buttons with a horizontal absolute-position touch strip on steering-hand side, touch x maps immediately to steering magnitude/direction, dragging continuously moves it, releasing returns rapidly to neutral, and Settings swapped-hand layout moves strip to opposite side while preserving simultaneous gas/brake. On PC, A/D move the SAME virtual steering position along the continuum while held and it quickly springs to center on release; Space gas, Enter brake. Make driving DIRECT and ARCADE: minimal residual yaw inertia, prompt press/release/countersteer; never recenter the CAR to road, never auto-follow bends, preserve accepted 1.75x world pace and bounded offroad penalty. P0 also diagnose and FIX or honestly label UNVERIFIED the reported track ending/discontinuity: inspect spline/mesh/loop and render at >=120s simulated high-speed across seams. P0 finally replace upper-right numeric-only speed HUD with a distinctive ORIGINAL left-of-car analog speedometer with working needle and digital km/h, clear of the steering strip/pedals on desktop and Pixel 8 in both hand layouts. Preserve long-press suppression, phone fullscreen/PWA, controls, brake, drift/audio, fixed FOV and game performance. Autonomously run actual browser, record touch/keyboard/video tests, verify hand input target versus vehicle yaw, investigate road visual continuity and collect desktop/Pixel screenshots, run build/unit/Playwright, fix failures, locally commit and produce docs/V0.4.1_HANDOFF.md with real PASS/FAIL/UNVERIFIED. Do not push, merge, publicly deploy, touch TopWar or begin v0.5. Stop for human playtest.
```

## Delivery expectation

- Pixel 8: horizontal steer strip works with one finger, AND other thumb can accelerate/brake. User's finger position has direct, understandable steering effect.
- PC: A/D moves the same virtual wheel from center, release quickly returns to neutral. Car does **not** magically center itself on the road.
- Road remains present through prolonged fast driving; no hidden continuity defect claimed fixed without proof.
- Needle speedometer is physically **left of the player car on screen**, distinct from an upper-right speed card and clear of fingers.
- Source, tests and **actual motion evidence** handed back for the owner to judge. No user micro-management.

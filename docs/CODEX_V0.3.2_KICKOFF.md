# Codex v0.3.2 — autonomous Arcade Pace experiment

The user has reviewed v0.3.1 and is **not satisfied with its sense of speed**. User explicitly authorizes this follow-up experiment; old "stop after v0.3.1" applied to that specific milestone. A previous Goal was blocked by automated approval despite clear task direction; if needed, request one explicit **normal-chat** authorization. Do not retry a denied action repeatedly.

## Local source preservation

- Local repo: `C:\astra-dev\OutRun`, remote `michael-wang/OutRun`.
- Latest playable implementation was committed at `ef93e41` with handoff `df0782f`; inspect the actual local HEAD and preserve any later work.
- Remote GitHub `main` is still primarily **specifications**. Do not reset, merge or clone over your playable v0.3.1 source.
- Autonomously create feature branch `codex/v0.3.2-arcade-pace` from the latest playable v0.3.1 HEAD, fetch `origin/main`, and selectively import `AGENTS.md` plus `docs/V0.3.2_PACE_EXPERIMENT.md`, `docs/V0.3.2_ACCEPTANCE.md` and `docs/CODEX_V0.3.2_KICKOFF.md` (not the full main tree). Preserve all game code.
- No push, merge, deployment, external repo edits or changing TopWar.

## Optional explicit authorization (ordinary chat, if required)

`I authorize Project OutRun v0.3.2 Arcade Pace development, superseding the previous stop-after-v0.3.1 instruction. You may preserve the current playable checkout, create a local feature branch, fetch and integrate only the v0.3.2 specification files, implement and test the experiment, and commit locally. Do not push, merge or deploy.`

## Paste this into a **new Codex Goal** on the playable local OutRun project

```text
/goal Run Project OutRun v0.3.2 Arcade Pace A/B development on the EXISTING playable v0.3.1 local codebase. First verify git remote/status, preserve work, create codex/v0.3.2-arcade-pace from playable HEAD, fetch origin/main and selectively bring in AGENTS.md plus docs/V0.3.2_PACE_EXPERIMENT.md, docs/V0.3.2_ACCEPTANCE.md and docs/CODEX_V0.3.2_KICKOFF.md without overwriting game source or merging main. Read the new docs. Product priority: user still feels 234 km/h is slow even after v0.3.1, and this is a GO/NO-GO gate. Implement a developer-only Arcade World Pace A/B with target high-speed multipliers 1.0, 1.5, 1.75 (default), 2.0, using smooth speed-dependent amplification on ACTUAL vehicle/world motion (not separate background-only scrolling or HUD lies). Preserve coherent heading/road/collision/shoulder/camera behavior and responsiveness; inspect and adjust high-speed steering if needed but never auto-steer. Use fixed FOV/chase distance, preserve ~24% vehicle frame width, Pixel 8 fullscreen/touch/PWA, bounded off-road slowdown and existing controls. Quantitatively record low/mid/high true world distance/sec and near-object pass cadence for all variants. Record and personally inspect REAL browser motion at matched track position/camera and provide playable phone URLs for direct A/B. Check 30/60 FPS consistency, build/unit/Playwright, browser errors and Pixel landscape screenshots; report actual device performance UNVERIFIED without hardware. If 2.0 still looks weak, explain probable projection/world-scale reasons; do not invent success or add unrelated features. Write docs/V0.3.2_HANDOFF.md and commit locally without push/merge/deploy. Stop after v0.3.2 for Michael's subjective speed GO/NO-GO.
```

## Expected human handoff

Codex delivers links to four variants **on the Pixel 8**, motion clips, a table showing real movement, preserved regression checks and any failures. The player decides the best speed factor. **Do not begin the road-rhythm/drift/convertible milestones** before the user approves velocity.

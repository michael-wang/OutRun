# Codex kickoff — v0.3.1 Velocity Gate

The user expressly wants a **focused speed go/no-go experiment** after v0.3. The v0.3 stop-for-playtest instruction applied to its milestone and is superseded by this new user-approved handoff. If the Codex approval mechanism rejects a Goal-only request, ask for an explicit **normal chat** authorization rather than retrying the same rejected action in a loop.

## Preserve the actual working game

- Repository `michael-wang/OutRun` at `C:\astra-dev\OutRun`. Verify Git status/remotes, inspect code.
- The latest playable local v0.3 was reported at implementation `97de506` and handoff `40169f8`, worktree clean. The GitHub remote `main` holds documentation only, not the game.
- Create `codex/v0.3.1-velocity-gate` **from the playable local v0.3 HEAD**, preserving later changes, never reset/checkout the documentation-only main as your new game base.
- Fetch `origin/main` and selectively import `AGENTS.md`, `docs/V0.3.1_VELOCITY_GATE.md`, `docs/V0.3.1_ACCEPTANCE.md`, `docs/ARCADE_DESIGN_BACKLOG.md` and `docs/CODEX_V0.3.1_KICKOFF.md` only. If branch or file edits conflict, preserve user work; no force or destructive Git commands.

## New Codex Goal

Open a **new** Goal in the local playable OutRun project. A brief user authorization in a **normal chat** can be sent first if needed:

`I authorize Project OutRun v0.3.1 Velocity Gate development, superseding the prior stop-after-v0.3 instruction. You may create a feature branch and integrate only the new specifications, implement/tests/commit locally in the OutRun workspace. No push, merge or deployment.`

Paste the following in the real Goal composer after making sure active spec files are local. If you prefer one handoff, the Goal itself may safely perform the Git/spec preparation first.

```text
/goal Continue the EXISTING local Project OutRun v0.3 gameplay build with a focused v0.3.1 Velocity Gate. Verify the playable v0.3 branch and clean worktree, preserve code, create codex/v0.3.1-velocity-gate from playable HEAD, fetch origin/main and selectively bring over AGENTS.md, docs/V0.3.1_VELOCITY_GATE.md, docs/V0.3.1_ACCEPTANCE.md, docs/ARCADE_DESIGN_BACKLOG.md and docs/CODEX_V0.3.1_KICKOFF.md without merging the documentation-only main or overwriting game source. Read the new specs. The P0 mission is to prove and radically improve perceived high-speed motion; v0.3 showed 234km/h after ~6s but low optical flow. AUDIT actual HUD/game speed mapping, world distance traveled per wall-clock second, road-width scale, spline progress/delta-time/frame pacing, camera transform and near-road marker passing cadence. Instrument Speed Audit for low/mid/high settled speed. Fix real movement/scale bottlenecks before adding near-road lines/props for optical flow and responsive engine feedback. Use a fixed chase-camera FOV and distance; no speed zoom, camera shake gimmicks or fake HUD-only speed. Capture and inspect actual browser low/high same-segment motion comparison and one acceleration-through-high-speed video, with measured near marker pass cadence. Iterate until clearly faster on screen; do not claim subjective success merely from green tests. Preserve v0.3 framing, Pixel 8 fullscreen/PWA/two-thumb/long-press, off-road bounded penalty, steering/drift, and existing tests. Run build/unit/Playwright and inspect video/screenshots, then commit locally, write docs/V0.3.1_HANDOFF.md with root cause(s), Speed Audit before/after, evidence files, PASS/FAIL/UNVERIFIED and outstanding device checks. Do NOT implement drift overhaul, road-rhythm system, convertible/passengers or biome themes yet; these are in backlog pending HUMAN GO. No push, merge, public deployment or TopWar changes. Stop and deliver a playable local speed demo for human go/no-go review.
```

## Definition of success

Codex has done its part when:
- real road/world movement and displayed speed have an explainable measured relationship;
- low-vs-high clips clearly differ in road and nearby scenery flow, **without zoom tricks**;
- high-speed drive stays responsive, safe from off-road corridor regressions and playable on Pixel 8;
- the user receives a build and evidence to decide **GO / NO-GO** for the entire game.

If no actual phone attached, label hardware FPS and audio quality UNVERIFIED rather than inventing proof.

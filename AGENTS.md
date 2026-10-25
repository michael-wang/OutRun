# Project OutRun — Codex working agreement

## Active milestone: v0.4.1 — Arcade Rescue

The owner rejected v0.4 gameplay feel despite green build/tests. **v0.4.1 is a regression repair**, not permission to ship extra features. The user's explicit v0.4.1 request supersedes the prior **stop-after-v0.4** condition for this new milestone only.

Read these current documents before development:
1. `docs/CODEX_V0.4.1_KICKOFF.md`
2. `docs/V0.4.1_SPEC.md`
3. `docs/V0.4.1_ACCEPTANCE.md`
4. `docs/ARCADE_DESIGN_BACKLOG.md` for deferred items only.

Prior documents are background and regression constraints, not instructions to restart old milestones.

## Source and workspace safety

- Local working project: `C:\astra-dev\OutRun`, expected git remote `michael-wang/OutRun`. Never touch `C:\astra-dev\topwar`.
- The playable v0.4 source is on the user's LOCAL branch, with implementation `04a1f2b` and handoff `ba76b22`. The GitHub remote `main` is primarily documentation; **do not reset, check out or merge remote main over the playable app**.
- From the latest playable LOCAL HEAD, safely create `codex/v0.4.1-arcade-rescue` (unless already on a safe feature branch). Preserve uncommitted work. Fetch `origin/main`, selectively import this `AGENTS.md` and `docs/V0.4.1_*` + `docs/CODEX_V0.4.1_KICKOFF.md` without overwriting game code. Inspect diff before committing.
- Do not push, merge to main, public-deploy, buy services, overwrite other projects, or incorporate SEGA/Ferrari protected assets.
- If policy asks for a new user authorization to supersede "stop after v0.4", ask once in a NORMAL chat. Respect system approval gates; don't evade them or retry endlessly.

## Product priorities / constraints

1. **P0 gameplay:** fix v0.4's sluggish initial steering, continuing unwanted turn/overshoot after bend release, and low predictability. Diff/measure v0.3.2 → v0.4 handling to identify root cause. Preserve the owner's accepted **1.75× arcade world pace** and direct player control. Avoid both v0.3.2's twitchiness and v0.4's delayed, simulation-like inertia.
2. **P0 correctness:** user reports road visibly breaking/ending. Reproduce and fix track topology/progress/loop/streaming/render continuity at speed. If unverified, report exactly that; never label "fixed" based only on a passing unit test.
3. **P0 presentation:** put a distinctive **analog needle speedometer + numeric speed** visually to the **left of the car**, inspired by classic arcade gauge composition but with original artwork. Avoid Pixel 8 left steering thumb buttons and safe areas. Keep km/h and honest speed.
4. **Preserve:** PC A/D steer, Space accelerator, Enter brake; Pixel 8 two-thumb + swap, fullscreen/landscape/PWA, no Android long-press selection, responsive pause/menu, off-road slowdown/bounded shoulders/no auto-road-follow, drift sound tied to slip, fixed FOV/chase distance.
5. **Defer:** new dangerous road sequences, more drift/physics complexity, new vehicle/convertible/passengers, scenic themes, traffic/rivals and all new modes. Fix regression before adding content.

## Autonomy / evidence / handoff

Work autonomously: inspect source and historical diff → instrument steering and track continuity → modify minimally → run actual browser and drive → capture video/screenshots → tune/repair → run unit/build/Playwright. Use actual evidence, not just test counts.

Create `docs/V0.4.1_HANDOFF.md` documenting source root causes, before/after steering response, track break reproduction/repair evidence, high-speed ≥2min continuous road test, analog HUD layout on desktop/Pixel-like landscape, PASS/FAIL/UNVERIFIED, actual local URL, commit, and physical Pixel/audio limitations.

STOP after the v0.4.1 local commit and handoff for human playtest. This milestone stop does not revoke future user-authorized work.

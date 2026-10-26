# Codex small follow-up — Road Profile Inspector (v0.7A.1 QA add-on)

**Status:** small user-requested Codex work item to use remaining quota; **not a new product milestone**. Do NOT start v0.7B or compose a five-minute trip. The previous v0.7A.1 elevation/road-width milestone takes precedence.

## Starting-state gate — no conflicting work

1. Open LOCAL `C:\astra-dev\OutRun`. Verify remote `michael-wang/OutRun`, branch, HEAD, uncommitted changes and whether the earlier v0.7A.1 Goal has completed.
2. If v0.7A.1 is still in progress / its actual 2-,4-,6-,8-lane road-width code is not yet playable, **do not fork or build an inspector on incomplete/missing geometry**. Continue/finish the existing approved v0.7A.1 work if authorized and possible; report any blocker. Do not run two Codex Goals concurrently on one working tree.
3. When v0.7A.1 is clean, complete and playable, branch `codex/v0.7a1-road-inspector` from the latest LOCAL playable HEAD, or use an explicitly agreed new local branch. Fetch `origin/main` only to selectively copy **this one document**, never merge/reset/docs-only checkout over application source. Respect sandbox approvals.
4. Preserve all earlier gameplay and real user review records. R1 archive has KEEP BRK-01/02/04/06/07/08 and REWORK BRK-03/05; R2 statuses are **not** auto-approved by this add-on.

## One compact feature: opt-in playable Road Profile Inspector

Add a lightweight, opt-in overlay available via `?lab=bricks&inspect=1` for Brick Lab only.

**Minimum P0 deliverable (small and useful):**

- Show while driving: Brick ID/revision; track progress `s`; car road-relative `x`; current road elevation `height(s)` and elevation delta from start; local grade percent; actual paved road **width** and **TOTAL lane count**; off-road/shoulder state. Optional displayed speed / current Required Steering if readily available.
- Values MUST come from the same geometry/profile and authoritative road-edge checks the real car uses. Do not invent a duplicate road-width/altitude formula for the overlay. For smooth width tapers, show current *effective* lane-equivalent width as well as nearest designated lane-count anchor, rather than rounding intermediate sections to a fake lane count.
- A very small dynamic height-over-distance and width-over-distance sparkline (with current progress cursor) is **P1 only if P0 is stable and quota permits**. Use SVG/Canvas directly, no chart library, no new settings system, no significant per-frame allocations.
- Inspector must remain entirely absent in ordinary `/` play and default `?lab=bricks`; on a Pixel 8 landscape screen it must not obstruct the road apex, steering strip, gas/brake or review buttons. A small collapse control is okay. No telemetry service, account, external network, camera rewrite, or gameplay changes.
- Provide a simple one-click `Copy Profile Summary` (or JSON download if clipboard unavailable) containing ID/revision, source generator version and sampled min/max height, net climb/descent, max up/down grade, min/max width/lane count and observed lane transitions. This is developer review evidence, not a player reward.

## Minimum QA

- BRK-03: reported elevation range and slope agree with actual sampled Three.js road geometry and visibly dramatic ridge.
- BRK-05: similarly verify a real sustained descent and its net drop, not only a scenic prop falling away.
- BRK-06: inspector visibly records width 4→2→4 and real change in off-road classification at an appropriate x, if that is the implemented width profile.
- BRK-07: inspect 6→8→6 lane equivalents and a real broad boulevard with proper road edges.
- Check inspector on desktop + Pixel-like landscape, with and without opt-in; no touch/keyboard interference. Manual normal gameplay and human KEEP/REWORK/REJECT localStorage remain intact.
- Run focused unit/E2E and production build; inspect screenshots. Don't sacrifice the existing v0.7A.1 tests. Create a small local commit and `docs/V0.7A1_ROAD_INSPECTOR_HANDOFF.md` with screenshots, actual test results, and any deviations.

## Strict non-goals

NO new brick designs, NO physics tuning, NO road-width/grade design changes hidden inside this QA task, NO v0.7B, Mystery Drive, RPG coins, Garage, traffic, larger editor, public deployment, pushing or merging. If a serious road-profile bug is detected, log it as an explicit defect and fix only if limited and clearly within approved v0.7A.1 scope; otherwise stop and report it.

**Stop for human inspection** with the working game and reviews untouched. The inspector is a diagnostic aid, not proof of fun.

## Ready-to-paste short Goal

```text
/goal Small OutRun v0.7A.1 follow-up: ROAD PROFILE INSPECTOR. At C:\astra-dev\OutRun first verify git/worktree and whether v0.7A.1 Verticality & Variable Width is complete. Do not run in parallel with an active Goal or build on missing variable-width geometry. Preserve latest playable LOCAL branch and R1/R2 votes. If the v0.7A.1 build is complete, branch safely from local playable HEAD, fetch origin/main and selectively import only docs/CODEX_V0.7A1_ROAD_PROFILE_INSPECTOR.md; never merge docs-only main over game. Read that file and implement ONLY an opt-in ?lab=bricks&inspect=1 overlay with real current track progress, actual road elevation/grade, actual total paved width/lane count, road-relative offset and offroad state; sourced from authoritative geometry and collision, not invented display values. Include compact Copy Profile Summary of height/grade/width extremes; tiny charts are OPTIONAL. No normal game UI impact or controls interference. Test BRK-03/05 height and BRK-06/07 lane transitions in real browser, desktop/Pixel-like layouts, focused unit/E2E and build; preserve existing reviews. Commit locally, write docs/V0.7A1_ROAD_INSPECTOR_HANDOFF.md with actual screenshots and tests. No push, merge, deploy, physics changes, new bricks, v0.7B or other projects. Stop for human review. If v0.7A.1 is incomplete, do not start this add-on: report state and prioritize finishing existing authorized milestone.
```

# Project OutRun — Codex operating rules

## Active milestone

**v0.3.1 — Velocity Gate** is the active milestone. Before working, read:
1. `docs/CODEX_V0.3.1_KICKOFF.md`
2. `docs/V0.3.1_VELOCITY_GATE.md`
3. `docs/V0.3.1_ACCEPTANCE.md`
4. `docs/ARCADE_DESIGN_BACKLOG.md` (future work only)

Older v0.1–v0.3 instructions/handoffs are history and regression constraints. An earlier request to **stop after v0.3** meant stop that milestone for review; it is superseded when the user expressly authorizes v0.3.1. Do not launch old Goals.

## Checkout safety and autonomy

- Verify remote `michael-wang/OutRun` and working directory `C:\astra-dev\OutRun` before edits. Never modify `C:\astra-dev\topwar`.
- The playable v0.3 is **local**, completed at implementation `97de506` and handoff `40169f8`. GitHub `main` is documentation-only. **Do not checkout/reset to main over game files or create a fresh scaffold**.
- Safely preserve any uncommitted work and create `codex/v0.3.1-velocity-gate` based on the **latest playable local HEAD**. Bring over only active v0.3.1 docs plus this `AGENTS.md` from `origin/main`. Inspect conflicts before overwriting anything. Do not merge the documentation-only main branch wholesale.
- Within this authorized repo, independently inspect → implement → run real game → quantitatively measure → record visual evidence → fix → rerun tests. Avoid repeated requests for routine file-edit approvals; actual sandbox/permission constraints still apply.
- Maintain Three.js + TypeScript + Vite; no engine rewrite, new physics engine, traffic, scores, vehicle redesign, scenic biome system or unrelated changes.
- No push, merge to main, public deployment, payment, secrets or modifications to other repos. Use only original/license-cleared resources.

## The product gate is more important than a passing test count

The user has explicitly made **convincing speed sensation a go/no-go requirement**. A HUD reading of 234 km/h plus low optical flow is a failure. Measure actual distance traveled per second relative to the track's world scale, speed interpolation/clamps, camera transforms, near-road landmark pass cadence and frame pacing. Compare actual low-speed/high-speed **moving** evidence from the browser. Don't use speed-based zoom/FOV/dolly, artificial HUD speed or motion blur to fake this.

Retain v0.3 mobile/PWA/fullscreen, two-thumb controls and long-press fix, off-road penalty/bounded shoulders/no automatic road-follow, camera composition, braking, drift and existing tests.

## Handoff

Run build, unit and Playwright. Write `docs/V0.3.1_HANDOFF.md` with measured world-speed values, known unit conversion, roadway width and landmark cadence, actual comparison clips, screenshots, test results, device FPS status, unresolved issues and a human decision gate: **"Does this now feel like a fast arcade racer on Pixel 8?"**

Stop after v0.3.1 **without implementing v0.4/backlog items**. Human playtesting controls the next step.

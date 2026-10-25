# Project OutRun — Codex working agreement

## ACTIVE milestone: v0.4.1 — Analog Arcade Steering & Rescue

The product owner has NOT launched v0.4.1. They revised the steering design **before handing work to Codex**. The new, binding decision is a **continuous virtual steering-wheel position**, not two binary steering buttons or a lengthy simulated steering-inertia fix.

Read first:
1. `docs/CODEX_V0.4.1_KICKOFF.md`
2. `docs/V0.4.1_SPEC.md`
3. `docs/V0.4.1_ACCEPTANCE.md`
4. Earlier v0.4 and v0.3.2 handoffs for diff/regression context.

These new documents supersede the previous v0.4.1 draft's steering approach. Do not run an old Goal or simply reduce sensitivity.

## Local checkout safety

- Repo `michael-wang/OutRun`; authorized Windows directory `C:\astra-dev\OutRun`. NEVER modify `C:\astra-dev\topwar`.
- Playable v0.4 exists on a LOCAL branch, with implementation commit `04a1f2b` and handoff `ba76b22`. Remote GitHub `main` is primarily product documentation; **never reset/checkout/merge its whole tree over playable source**.
- Preserve uncommitted work. Branch from the latest playable local v0.4 HEAD as `codex/v0.4.1-analog-steering` (or a safe equivalent). Fetch `origin/main` and import **only current AGENTS.md + v0.4.1 documents**, protecting source code.
- A prior stop-after-v0.4 limited that milestone. Explicit authorization for a new v0.4.1 in a normal chat supersedes it. Respect actual sandbox approvals; do not bypass a denial or repeatedly retry.

## Product contract

**P0-A: continuous steering input and direct arcade response**
- Use a single normalized steering target [-1, 1] shared by touch/keyboard, where 0 is neutral, negative left, positive right. No fake multi-revolution steering-wheel simulation.
- On landscape Pixel 8, replace two touch steering buttons with a **horizontal absolute-position strip** on the steering-hand side. Touch at any x gives an immediate target; dragging adjusts it continuously; lifting returns to 0. Left/right control-group swap moves the entire strip. Gas/brake on the other side still works simultaneously.
- On PC, `A/D` (optionally arrows) move a visible/inspectable virtual steering position along the same [-1, 1] axis. On key release, the virtual wheel quickly springs to 0. `Space` accelerates, `Enter` brakes.
- Steering-wheel self-centering is **not** vehicle lane-centering. Zero steer must mean no new commanded turn, never automatically following road curvature or returning to asphalt. Minimal/damped yaw inertia: press responds promptly, release settles promptly, reversing responds promptly.
- Preserve accepted **1.75× coherent world pace**; no speed reduction, HUD-only tricks, independent background scroll or camera speed zoom.

**P0-B: road never ends or has holes.** Investigate the reported missing/broken road. Prove rendered/geometry continuity across loops at 1.75× for >=120 simulated high-speed seconds. If the defect cannot be reproduced/verified, report that honestly rather than claiming fixed.

**P0-C: analog needle speedometer LEFT of the car.** Real needle/dial plus digital km/h. On Pixel 8 landscape avoid the horizontal steering strip and gas/brake for both handedness layouts. Fixed camera framing stays legible.

**P1:** Preserve recoverable drift, bounded shoulders/off-road slowdown, non-constant tire squeal; no new aggressive drift simulation before steering quality is stable.

**DEFER:** new road designs, convertible/passengers, scenery transitions, traffic, racing modes and unrelated UI. Don't add process or framework complexity; remain on Three.js + TypeScript + Vite.

## Delivery

Develop autonomously: inspect old code/diff → build shared analog input/vehicle response → run real game with short/long/reversal controls → repair track gap → design dial → capture actual motion/screenshots → run build/unit/Playwright → fix → local commit.

Write `docs/V0.4.1_HANDOFF.md` with branch/commit, input-mapping proof, previous/after steering traces, video evidence, road/loop tests, desktop/Pixel screenshots (both hands layouts), analog needle operation, actual test results, known issues and local URL. Do NOT push, merge or public deploy.

**Stop after v0.4.1 and await human playtest.** This stop limits this milestone, not future user-authorized work.

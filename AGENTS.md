# Project OutRun — Codex working agreement

## ACTIVE milestone: v0.4.3 — Soft Steering & Honest Curves

Human v0.4.2 playtest result: **GO for the new Gameplay-First / Arcade Lateral Balance architecture.** Problems to fix: abrupt four-level steering feel, car visual yaw too restrained, too much yaw on small corrections, and serious curve pressure despite mild-looking 3D geometry. This is a **calibration and presentation milestone**, NOT a reversion to realistic vehicle inertia.

Read `docs/CODEX_V0.4.3_KICKOFF.md`, `docs/V0.4.3_SPEC.md`, `docs/V0.4.3_ACCEPTANCE.md` before implementing. Older specs are regression context only. Stop-after-v0.4.2 was a previous milestone stop, not a prohibition on new user-authorized work.

## Repo/workspace safety
- Confirm git remote `michael-wang/OutRun` at `C:\astra-dev\OutRun`. Never touch `C:\astra-dev\topwar`.
- The **playable v0.4.2 implementation is LOCAL** (`d44c8e5` implementation, `f7ed029` handoff); remote GitHub `main` contains documentation. DO NOT check out/reset/merge docs-only `main` over the playable game.
- Preserve latest playable local HEAD and user changes; branch safely to `codex/v0.4.3-soft-steering`. Fetch `origin/main` and selectively restore **only** current `AGENTS.md` and the three v0.4.3 documents. Do not overwrite app source or handoff.
- If goal approval rejects an older stop instruction, request direct **normal chat** authorization instead of looping rejected actions. Respect approvals and sandboxes.
- No pushes, merges, public deployments, payments, unlicensed assets or other-repo edits.

## Design non-negotiables
1. Keep coherent **1.75×** world pace, 3D road/car, dynamic-looking but fixed FOV/dolly camera, original stylized visuals, left-of-car analog needle gauge, Pixel 8 landscape fullscreen/PWA/two-thumb/hand-swap/long-press and PC `A/D` steering / `Space` gas / `Enter` brake.
2. Keep v0.4.2 **Arcade Lateral Balance** with road-relative (s,x), curvature causing outward pressure, player steering opposing it, **no persistent physical yaw/lateral inertia** and no automatic lane centering.
3. **Soft detents**: retain nine stable steer choices (neutral, four notches on each side) but transition effective correction rapidly and smoothly. Deadzone/hysteresis prevent jitter. Don't create a slow sluggish input ramp or reintroduce post-bend residual movement.
4. **Visual truth**: difficulty should be obvious from approaching road's visible bend. Calibrate shared pressure-vs-curvature scaling and **regenerate geometry by inverting challenge demand**; no independent invisible per-segment difficulty multipliers that make mild-looking bends impossible.
5. **Arcade body pose**: tiny steering shouldn't visibly yaw or shriek; strong deliberate bends can produce exaggerated ~25–45° short-lived rendered body yaw and convincing skid feedback **without affecting the path**.
6. Smooth challenge segment joins in distance/curvature/elevation while preserving measurable core Low/Medium/High/Extreme/S curve sections; no road seams or mountains blocking asphalt.
7. Defer rivals, obstacles, adaptive difficulty, new cars/convertibles/biomes, physics rewrites, new UX systems and generic editors.

## QA and handoff
Run real browser at PC/Pixel-like layouts, inspect moving low/high/Extreme/S driving clips, measure quantizer hysteresis and force transition, car yaw and projected road severity. Retain full build/unit/E2E including 120s loop continuity, hands-off outside drift and brake-required hard curve. Don't call subjective fun PASS solely from green tests.

Create `docs/V0.4.3_HANDOFF.md` with actual local branch+commit/URL, before/after measured inputs and road/pressure geometry, moving clips + desktop/mobile screenshots, PASS/FAIL/UNVERIFIED and physical device limitations. Stop at v0.4.3 for human acceptance, not further features.

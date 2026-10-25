# Project OutRun — Codex operating agreement

## ACTIVE milestone — v0.6 Scenic Journey

The user's v0.5 playtest requests: (1) obvious wheel animation failure during hard cornering/drift, (2) expressive visible occupant motion, especially long hair whipping in the wind, and (3) **the main next investment: varied roadside scenery and more varied road sequences**. Treat v0.5's existing exhilarating Arcade Lateral Balance driving as the product baseline. **Do not change core handling just to add visuals.**

Read in this order:
1. `docs/CODEX_V0.6_KICKOFF.md`
2. `docs/V0.6_SPEC.md`
3. `docs/V0.6_ACCEPTANCE.md`
4. `docs/PRODUCT_VISION.md`
5. Previous v0.5 handoff, where available (regressions only).

Earlier stop-after-v0.5 applied to that milestone. The new user-approved v0.6 milestone supersedes it; if actual Codex permission checks need clarification, get explicit approval in a NORMAL user chat instead of retrying a blocked action.

## Local repo and permissions

- Authorized repo `michael-wang/OutRun` at `C:\astra-dev\OutRun`. Never modify `C:\astra-dev\topwar` or any other repo.
- Existing playable **v0.5 is LOCAL**, reported at implementation `645b7ed` and handoff `9a05fc3`. GitHub origin/main is mostly documentation and MUST NOT replace local playable game code.
- Verify remote/status, preserve uncommitted files and start `codex/v0.6-scenic-journey` from newest **playable local HEAD**. Fetch origin/main and selectively restore ONLY `AGENTS.md`, `docs/V0.6_SPEC.md`, `docs/V0.6_ACCEPTANCE.md` and `docs/CODEX_V0.6_KICKOFF.md` into the new branch, checking conflicts. Don't overwrite the local app or local README. Never reset/checkout/merge origin/main wholesale over the playable branch.
- Respect sandbox approval boundaries. No public deployment, pushing/merging to remote, paid services, secret use, copying SEGA/Ferrari cars/models/music/logos or unrelated changes.

## What gets built and in what order

**P0-1 — Fix wheel animation:** the car's rolling wheels are visibly frozen, especially when visual body yaw is large. Make each visible wheel roll correctly with real travel and front wheels steer correctly with input. Don't allow aliasing at speed to make wheels LOOK stationary. Validate during sharp left and right drift, standing still, acceleration and braking.

**P0-2 — Scenic stage variety:** at least THREE unmistakably different stages on one continuous route: Azure Coast, Golden Canyon / arid highlands, Sunlit Coastal City. Stage visual identity must change in near, mid and distant layers; multiple distinctive landmarks and variation WITHIN each stage, not just a palette swap or hundreds of cloned palms/cubes. Two visible stage transitions during normal play, distance-based and without obvious pop/freeze. Preserve a clean, bright, inviting original art style.

**P0-3 — Road composition:** stage-specific authored challenge rhythms and elevation within the existing Gameplay-First required-steer/inverse-curvature system: fast coastline sweepers + crest, canyon S bends and technical braking, city boulevard/downhill speed reward. More interesting road scenery and perspective while preserving approachable playable skill. No invisible force, impossible road, missing mesh or mountain blocking the asphalt.

**P1 — Occupant animation:** BOTH occupants show small intentional body/head lean with cornering, and a visibly long-haired female occupant gets exaggerated speed-sensitive hair motion (or adapt to established occupant designs). Wind continues even on straight roads when going fast; bends add asymmetry. Keep it inexpensive and readable on Pixel 8. No elaborate skeleton/rig unless already present.

**Deferred:** opponents, traffic, hazards, gameplay director/DDA, left/right route forks, scores, multiple selectable cars, new engine, full cinematic cutscenes and character customization. No unrequested change to input mapping, game rules, or camera zoom.

## Preserve gameplay invariants

Keep default **1.75× coherent world pace**, v0.5 4-soft-notch steering, low/mid/high/extreme/S challenges, fast left/right sweepers and braking-required Extreme, Arcade Lateral Balance without physical residual yaw, bounded off-road slowdown/recovery, expressive body drift, fixed-FOV chase view and car-left needle HUD. Maintain desktop A/D + Space gas + Enter brake, Pixel 8 20:9 landscape fullscreen/PWA, two-thumb analog strip & gas/brake handedness swap, long-press suppression, pause/mute. No scene-driven physics changes hidden on transition.

## QA and evidence

Work autonomously: inspect source → fix wheel issue → implement scenic stages & route → launch and drive actual browser → examine screenshots/video → optimize → if P0 passes add simple occupant reactions → run build/unit/Playwright, fix → local commit/handoff.

Use Three.js efficient instancing or LOD for repeated scenery only where helpful; procedural textures and original low-cost local assets are fine. Don't create a speculative world editor, enormous asset pipeline or generic rendering engine.

Deliver `docs/V0.6_HANDOFF.md` with actual branch/commit, reproducible local and Pixel URL, rendered wheel and occupant clips, labeled stage screenshots at desktop and Pixel-like landscape, actual two transitions recorded without pauses, stage-duration/distance map, road challenge table, ≥180s long-run geometry/console checks, before/after performance samples and PASS/FAIL/UNVERIFIED hardware status.

**Stop after v0.6 for human playtest**, not because development is permanently forbidden.

# Codex working agreement — Project OutRun

## Current milestone and requirements
- The active task is **v0.2 Driving Is a Game**. Read `docs/CODEX_V0.2_KICKOFF.md`, `docs/V0.2_SPEC.md`, `docs/V0.2_ACCEPTANCE.md`, `docs/PIXEL8_PLAYTEST.md`, then `docs/PRODUCT_VISION.md`.
- These v0.2 documents override conflicting v0.1 milestone instructions. Keep v0.1 files as historical records; **do not restart the v0.1 kickoff**.
- Verify the checkout is `michael-wang/OutRun` before editing. **Never touch `C:\astra-dev\topwar`.** v0.1 game code may exist **only on the local `codex/first-drive` branch**; remote `main` is specifications-only. Do not overwrite local game code with an empty scaffold.

## Autonomy and scope
- Implement → launch the actual browser game → play/test → inspect screenshots → fix → retest. Make routine design/engineering decisions independently, and do not ask the human for permission to edit ordinary files inside the authorized project. Respect actual sandbox permissions and escalate true blockers rather than bypassing them.
- Preserve existing v0.1 work, working controls, audio and tests unless the new spec requires changing them. Use an existing implementation branch or a new branch **based on the playable implementation**.
- Stack stays **Three.js + TypeScript + Vite** with minimal dependencies. No engine rewrite, full physics simulator, traffic AI, race modes, scoring, leaderboard, user accounts or heavy process overhead.
- The driver must independently steer on winding roads: **no free auto-follow of the track curve**. At-speed hands-off driving in a bend must leave the road and incur an off-road speed penalty.
- Pixel 8 **landscape fullscreen** is a primary target in v0.2, not an optional post-launch feature. Implement browser fullscreen/orientation and PWA pathways, safe areas and real two-thumb controls, with graceful fallbacks.
- Do not publicly deploy, push/merge to `main`, buy services, inject secrets, change other repos, or copy SEGA/Ferrari art, code, music or trademarks. Use original/license-cleared bundled assets.

## Quality gates
- Maintain `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e`.
- Add deterministic paired replay tests on left/right bends: neutral steering exits the road; realistic steering stays on-road. Check off-road slowdown and recoverability.
- Check fixed FOV / no speed-driven camera zoom, road profile, speed cues and visible car drift. Inspect actual screenshot content, not just test output.
- Test browser mobile layout and simultaneous two-pointer actions; mocked orientation/fullscreen success and failure; inspect phone-sized landscape screenshots. **Emulation does not prove actual Pixel 8 fullscreen, hardware FPS, PWA install or ergonomics.**
- Report **PASS / FAIL / UNVERIFIED**, without fabricating device tests or listening results. Fix obvious defects before handoff.

## Handoff
Create `docs/V0.2_HANDOFF.md` with branch/commit, exact local launch, real build/unit/E2E results, P0 checklist, left/right replay traces, screenshot paths and visual review, hardware verification status, and known issues. Stop after v0.2 for human driving and Pixel 8 testing. No automatic v0.3 work.

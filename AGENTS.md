# Project OutRun — Codex operating agreement

## Which milestone?
- **Active milestone: v0.3 Arcade Velocity.** First read `docs/CODEX_V0.3_KICKOFF.md`, `docs/V0.3_SPEC.md`, `docs/V0.3_ACCEPTANCE.md`, then `docs/PRODUCT_VISION.md` and relevant old milestone docs.
- v0.1/v0.2/v0.2.1 specs and handoffs are **history and regression constraints**, not new tasks to repeat. If old text conflicts with v0.3, follow v0.3. Don't accidentally run a previous `/goal`.
- Confirm git remote is `michael-wang/OutRun`. **Never change `C:\astra-dev\topwar`.** The playable v0.2.1 code was completed and committed **locally** as `9bdc6d8`. As of this design handoff, GitHub remote `main` contained documentation, not the full playable source. **Do not replace your playable local branch with remote `main`.**

## Autonomous development
1. Work on a new feature branch **based on the local playable v0.2.1 HEAD**, preserving uncommitted work. Integrate the v0.3 docs without overriding game code. Never force reset, discard the app, or merge to remote `main`.
2. Investigate actual code/scene metrics before changing camera/physics. Implement → run actual browser game → play/automate at several speeds → inspect screenshots AND motion recordings → fix → retest. Do not stop for routine code/style decisions; escalate genuine safety/permission blockers.
3. Use the existing Three.js, TypeScript, Vite architecture. Optimize player experience, not simulation complexity. No engine rewrite, mandatory external assets, full physics engine, opponent traffic, races/scoreboards, new modes, multiplayer or large procedural world.
4. v0.3 has two **release-blocking goals**: (a) **dominant car-and-road framing** on desktop and Pixel 8 landscape, (b) an unmistakable **high-speed visual experience** produced by world/roadside motion, NOT FOV/dolly zoom or misleading HUD numbers. More challenging curves are P1; scenic-theme transitions are **bonus only**.
5. Preserve v0.2.1 functionality: steering must matter, off-road speed penalty, bounded shoulders with no auto-centering, responsive recovery, drift, brake, audio mute, no Android long-press context menu, multi-pointer independent controls, layout swap, fullscreen/landscape/PWA behavior, safe areas.
6. Use a controlled fixed chase-camera composition; never reintroduce speed-based camera FOV/distance changes. Camera may smoothly follow road elevation and yaw without varying zoom with speed.
7. Do not push, merge, public-deploy, incur paid services, touch secrets, or copy protected SEGA/Ferrari game images, music, meshes or trademarks. All new assets must be original or clearly license-cleared and bundled locally.
8. Keep `npm run build`, `npm run test`, `npm run test:e2e` passing. Extend genuine behavior tests and add real motion evidence. A static screenshot and a displayed high speed number cannot by themselves prove speed sensation. Pixel 8 emulation is not physical hardware proof.

## Completion report
Create `docs/V0.3_HANDOFF.md` with exact local launch URL, branch/commit, actual build/unit/E2E results, P0/P1 PASS/FAIL/UNVERIFIED, camera/car-width measurements on desktop and landscape mobile, low/mid/high-speed motion captures, curvature/off-road regressions, screenshots, visual critique, and known issues. If no physical Pixel 8 was connected, label device FPS/fullscreen/touch/audio checks UNVERIFIED for this version.
Stop at v0.3 for human playtesting; do not begin v0.4.

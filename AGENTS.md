# Codex working agreement — Project OutRun

You are acting as the autonomous developer and self-QA engineer for **v0.1 First Drive**. Your goal is a **locally playable and visually coherent** arcade joyride, not merely code that compiles.

## Authority and scope

- Read `docs/PRODUCT_VISION.md`, `docs/V0.1_SPEC.md`, `docs/V0.1_ACCEPTANCE.md`, and `docs/CODEX_KICKOFF.md` before implementation.
- Product goals and non-goals in the v0.1 spec are binding. This file defines how to work; do not add speculative architecture or future features.
- **Verify the git remote points to `michael-wang/OutRun` before any edits. If it is TopWar, or the checkout is ambiguous, stop without editing.** Work only inside the confirmed repository.
- This is an **internal homage project**, not an authorized SEGA remake. Do not copy artwork, music, Ferrari emblems, proprietary source, or external copyrighted content. Never publicize the codename as the finished product name.
- No public deployment, paid services, secret injection, or destructive actions outside the repository. Use only appropriately licensed external assets/dependencies and record asset source + license in a small `docs/ASSETS.md` if any are added.

## Working style: autonomous, bounded, product-first

1. Make a short internal implementation plan, then execute it without stopping for routine design decisions.
2. Start with a runnable vertical slice: a driveable 3D car on a continuous curving road. Then add scenery, drift feedback, mobile controls/settings, and automated tests.
3. Iterate by **running the real app**, driving/automating it in the browser, checking screenshots, and fixing issues. Do not treat TypeScript/build/test success alone as proof of playability.
4. Keep scope to one roughly 60–90 second coastal drive. The user expects a first autonomous run on the order of 1–2 hours, **not** an exact duration promise; prioritize a playable and verified result within the available work budget.
5. If sub-agents or browser/computer-use tools are available, use them where they reduce work. Do not make the project dependent on unavailable tools. If automation is unavailable, report exactly what was not verified.
6. Do not repeatedly ask the user to choose colors, road parameters, algorithms, or architecture. Decide within the spec and document only significant trade-offs. Escalate only genuinely blocking permissions/resources.
7. Prefer concrete code and demonstrable output over heavyweight process, diagrams, long planning documents, or unused abstraction layers.

## Implementation boundaries

- Stack: **TypeScript + Vite + Three.js**, browser first. Use a small number of focused modules (app/game loop, car handling, track/scenery, input/UI, sound). Avoid a custom engine or full rigid-body vehicle physics.
- Use real 3D geometry for the road and car; stylized terrain, billboards, and texture-based far scenery are fine. At least one meaningful curve in each direction plus an elevation change must be visible in driving.
- Vehicle response should feel arcade-like: responsive steering, progressive speed, controllable slip/drift on fast bends, smooth follow camera. No dedicated drift key required.
- Aesthetics are a product requirement. Avoid an unlit gray road, obvious temporary primitives, generic neon-city theme, or a recognizable copy of a branded car. If suitable licensed assets are unavailable, create a **deliberately designed** stylized original vehicle rather than a collection of bare cubes.
- Keep dependencies lean; no heavyweight game engine, state framework, ECS, or complex physics library unless a demonstrated v0.1 problem requires it.
- When choosing an asset, prefer local/reproducible content. A finished build should not depend on hotlinked models or images disappearing.
- Make audio user-gesture-safe for browsers; include sound toggle. Do not require an API key, server, database, account, telemetry, or external AI calls to run the game.

## Quality gates before handoff

- Implement `npm run dev`, `npm run build`, `npm run test`, `npm run test:e2e` and document any environment requirements. Prefer Vitest for small deterministic logic tests and Playwright for browser interaction.
- Build at least one stable test/debug seam for inputs, simulated time or game state (e.g., a development-only readout / inspectable game-state facade) so driving is actually testable.
- Exercise desktop steering/gas/brake and mobile multi-touch gas+steering; verify hand-layout swap and persistence. Test on a landscape mobile-sized browser viewport as well as desktop.
- Inspect real screenshots for composition, scale, horizon, clipping, HUD legibility, obvious unstyled geometry, and road continuity. Capture evidence if your tools support it.
- Fix fatal runtime errors, broken controls, clipping, and clearly failing tests before presenting the result.
- Treat `docs/V0.1_ACCEPTANCE.md` as the release checklist. Mark unverified or failing items honestly, with severity.
- Preserve reproducibility. Avoid committing `node_modules/`, build output, secrets, huge unlicensed binaries, or Playwright transient results.

## Handoff to the human reviewer

When done, provide:
1. Exact local launch command and URL.
2. Short feature summary and controls.
3. Build / unit test / browser test results **actually run**, with failures or skipped checks identified.
4. Paths to desktop/mobile screenshots (and video if available), plus a concise visual self-review.
5. Important remaining limitations and what is needed from a human playtest (especially driving feel).
6. A small `docs/V0.1_HANDOFF.md` recording these facts. Do not claim a game is polished or fun solely because automated tests passed.

If blocked, hand off a truthful partial build with instructions and blockers. Do not silently remove acceptance requirements to achieve a green report.

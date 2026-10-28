# Codex kickoff — implement v0.1 First Drive

## Preferred launch: Codex Goal Mode (local project)

**Goal Mode is the intended autonomous workflow for this milestone.** The short command below is the **only thing the user needs to paste into the Codex Goal composer**; detailed requirements are already in this repo. Do not paste the rest of this document into a separate ordinary prompt and assume Goal Mode is active.

1. Check that `C:\astra-dev\OutRun` is an actual checkout of `michael-wang/OutRun` and has pulled the latest specification files. If the directory is empty, clone the repo *into* it first. Never repurpose `C:\astra-dev\topwar`.
2. In the desktop Codex app, select the OutRun project in **Local** mode (not Cloud), start a new chat on that checkout, and choose a sandboxed approval policy that allows normal work inside the project.
3. In the composer, type `/` and choose `/goal` from the supported commands. Paste the single-line Goal below and submit it. The app should show the Goal/progress controls. Merely typing the text `/goal` as an unsupported ordinary message does **not** enable Goal Mode.
4. Leave the machine/environment available for local execution. Goal continuation is scoped to this chat and can pause for permissions, interruption, or usage/budget limits. It does not guarantee completion within a particular wall-clock duration.
5. Review the final local build and `docs/V0.1_HANDOFF.md` yourself. Only after human acceptance should a new v0.2 goal be created.

### Copy into the Goal composer

```text
/goal Deliver a locally playable Project OutRun v0.1 First Drive in the confirmed michael-wang/OutRun checkout. Read AGENTS.md, docs/PRODUCT_VISION.md, docs/V0.1_SPEC.md, docs/V0.1_ACCEPTANCE.md, and docs/CODEX_KICKOFF.md. Implement the specified Three.js/TypeScript 3D coastal arcade drive. Independently iterate: implement, run the actual browser game, test keyboard and simultaneous two-thumb mobile controls, inspect desktop/mobile screenshots, fix defects, and rerun build/unit/Playwright tests. Finish only when the verifiable P0 acceptance criteria pass and docs/V0.1_HANDOFF.md records evidence, exact local start commands, and any remaining limits. If blocked by tools, permission or budget, stop with honest PASS/FAIL/UNVERIFIED results rather than claiming success. Keep all edits inside this repo; do not merge to main or deploy publicly. Stop after v0.1 and await human playtesting.
```

If `/goal` is missing, update Codex and check whether Goals are enabled in the Codex CLI/config (e.g. `codex features enable goals`, or `[features] goals = true` under `%USERPROFILE%\.codex\config.toml`); restart the app. Some Windows builds have had a missing slash-command UI despite enabled feature flags. Use the CLI Goal command if available; otherwise use the detailed brief below as a normal development task, understanding that it is **not guaranteed to continue autonomously across turns**.

## Detailed implementation brief (reference for Codex)

You are taking ownership of **Project OutRun v0.1: First Drive**.

**Workspace safety first:** inspect git remotes. Confirm the working tree is `michael-wang/OutRun`. Do not modify the separate **TopWar** project. If you cannot confirm the correct repo, stop and explain the mismatch.

Read `AGENTS.md`, `docs/PRODUCT_VISION.md`, `docs/V0.1_SPEC.md`, and `docs/V0.1_ACCEPTANCE.md`. These documents are your requirements and definition of done.

**Implement a complete, locally playable vertical slice**, not just a design or scaffold:
- Three.js + TypeScript + Vite.
- Bright, beautiful sunny coastal scene.
- Actual 3D stylized sports car and road; continuous left/right curves and a crest/dip.
- Chase camera and satisfying speed cues.
- Steering, accelerator, and brake; responsive arcade handling, recoverable drifting, engine sound and tire squeal.
- Desktop keyboard input and mobile two-thumb controls. Default left steering/right stacked gas-over-brake; settings to swap sides with persistence.
- Start/pause/reset, speed readout, sound mute.

**Autonomy:** make normal product, art, and technical decisions yourself. Work in short internal loops of implementation → start real app → play/automate → screenshot review → fix → retest. Do not ask the user for approvals on routine details. Prioritize a polished, driving-ready slice and keep dependencies/abstractions small. Do not implement opponents, multiple tracks, scores, leaderboards, or a car customization system.

**Testing:** write real unit and browser interaction tests, including **simultaneous mobile accelerator + steering touch** and swapped-handedness persistence. Run tests. Launch in a browser if a browser tool is available; capture desktop/mobile evidence and inspect the screenshots. If your tools do not support screenshots, audio playback, or touch simulation, say what you could and could not verify; do not invent results.

**Assets:** use only original or clearly redistributable licensed content. You may build intentionally stylized geometry and procedural/locally bundled textures; do not use SEGA/Ferrari branding or copyrighted game music. Document third-party asset provenance if used. No hotlinked runtime assets.

**Deliver:** a runnable local app with `npm run dev`, a passing production build, a test report, actual screenshots wherever possible, and `docs/V0.1_HANDOFF.md`. Handoff must list passed/failed/unverified P0 checks, remaining issues, and how to launch on the user's Windows machine.

Do not claim the human has accepted the game's feel or visuals. Once your self-QA is done, stop and deliver the playable version for human review instead of autonomously starting v0.2.

---

## Human setup (outside Codex)

- Intended GitHub repository: `https://github.com/michael-wang/OutRun`.
- Suggested local checkout: `C:\astra-dev\OutRun`.
- **Important:** `C:\astra-dev\topwar` belongs to a different-named project; verify the folder before launching Codex. A repo checkout should be located in its own directory.
- Codex should work on a feature branch if practical and should **not merge to main or deploy publicly without human approval**.

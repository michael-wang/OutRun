# Codex kickoff — implement v0.1 First Drive

Copy the task below into a **Codex Goal** (where supported) or a normal long-running Codex development task while the correct repository checkout is open. This is an implementation instruction, not a request for another plan.

---

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
- Suggested local checkout: `C:\\astra-dev\\OutRun`.
- **Important:** `C:\\astra-dev\\topwar` belongs to a different-named project; verify the folder before launching Codex. A repo checkout should be located in its own directory.
- Codex should work on a feature branch if practical and should **not merge to main or deploy publicly without human approval**.

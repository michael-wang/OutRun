# Project OutRun — current Codex instructions

## ACTIVE OWNER-COMMISSIONED: v0.8 Procedural Stage 01 + Minor Input/Scene Hints

**v0.7D.2 completed locally** (reported implementation `71476fb`, clean worktree), and owner actually played all THREE Pilots on this build: KEEP L2P-A/B/C, difficulty 1/2/2. Owner permits the small menu/scene preferences to be incorporated with **v0.8 Stage One**; the Stage work is now the active instruction. The original complete export is archived in `docs/reviews/V0.7D2_PILOT_R1_HUMAN_FEEDBACK.json`; short human summary in `docs/V0.7D2_HUMAN_PLAYTEST.md`. Preserve both older pilot history and previous BRK R1/R2 human approvals. The owner did NOT give an explicit blanket PASS to every sound/UX subfeature, so preserve regression coverage.

**Read in order:** `docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md`, `docs/V0.8_STAGE_ONE_SPEC.md`, `docs/V0.8_STAGE_ONE_ACCEPTANCE.md`, `docs/V0.8_BIOME_VERTICALITY_METADATA.md`, `docs/V0.7D2_HUMAN_PLAYTEST.md`.

### Exact additional user feedback to implement in Stage One

- Dramatic verticality belongs **more often to canyon/mountain**; city/coast generally mild/rolling, BUT real dramatic city viaduct/coastal cliff exceptions ARE ALLOWED. Use a tiny **L3 metadata weighting** and generate actual road grade/terrain matching biome. Mountain biome art is NOT yet implemented. Do not retroactively change user-KEEP Pilot geometry.
- Visible PC shortcut hints embed key **inside** action word (`[P]lay`, `[R]eplay same`, `[N]ext`), not a clunky space prefix `[P] Play`. Input-aware render: keyboard keys when keyboard active, PS4 mapped glyphs when supported controller last used; touch mode compact/no PC key spam. Do not allow controller polling/noise to flicker modes.
- During driving, keyboard sees `[G]讚 · [I]問題`, gamepad sees `L1 讚 · □ 問題`. L1 triggers praise (R1 remains working optional), **Square** triggers issue flag for later short text, D-pad select four positive labels + Cross confirms, Circle cancels. Show controller button prompts clearly. Existing retrospective ring buffer records real historical `eventAt` and distinct `reactionAt`, no made-up location.
- Preserve exact already HUMAN-accepted 144px thumb reach, six-speed 300 km/h, 1.75× Arcade Lateral Balance, hill grade, high-speed drift, warm engine and v0.7D.2 softened tire sound; original 18 L1 types and three biome packs.

### Actual Stage 01 output

One genuine **procedurally generated** `Pacific Getaway` alpha, roughly 100–150s nominal, Stage Code seed/version, Replay Same and New Route, starts/finishes, staged/cross-stacked L1 profiles and L2 beats with meaningful differences across seeds: steering/braking path, grade, width and scenic reveal. DO NOT just concatenate three predefined pilot routes or randomize only decoration. Small deterministic geometric/scenic constraints; no giant AAA optimization framework. Test ≥5 seed codes deterministically; fully DRIVE/record ≥3 diverse seeds. Keep small/playable; stop after for human seed reviews.

### Local repo safety / task scope

- Actual playable app is LOCAL `C:\astra-dev\OutRun`, latest reported v0.7D.2 commit `71476fb` or later; expected remote `michael-wang/OutRun`. GitHub `main` is DOCUMENTATION-FIRST — NEVER merge/reset/check it out over local code. Branch `codex/v0.8-stage-one` from latest PLAYABLE LOCAL HEAD, selectively import only the current v0.8 specs, this AGENTS.md and v0.7D.2 summary when necessary.
- If old stop-after-v0.7D.2 blocks Codex auto approvals, require user's explicit ordinary message in SAME existing Codex OutRun conversation; do not retry denied operations or bypass sandbox.
- No push/merge/public deployment, edits to other repos `C:\astra-dev\topwar`, paid services, runtime AI/backend, online analytics, unlicensed SEGA/Ferrari art or sound.
- Reuse current Three.js+TypeScript Vite 3D scene, mobile two-thumb/PWA/handedness, keyboard & PS4 controls and local praise/review persistence. No extra RPG/garage/traffic, new snow/volcano, giant Stage Editor, general Mystery Drive or v0.7B five-minute route.
- Commit LOCALLY, hand off `docs/V0.8_STAGE_ONE_HANDOFF.md` with real source/QA and seed evidence, Pixel/PC URL, STOP for human replay/feedback.

**Do not start Stage 02 or long-game progression automatically.**

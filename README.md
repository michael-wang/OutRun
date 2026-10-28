# Project OutRun

An original browser-based Three.js+TypeScript arcade driving game inspired by the joy of classic Out Run, NOT a licensed SEGA recreation. Title is internal only; use original/license-cleared assets for public release.

## ACTIVE: v0.8.3 — PS4 Screenshot & More Engaging Procedural Stage 01

**Latest PLAYABLE local code:** v0.8.2 on Windows `C:\astra-dev\OutRun`, reported implementation `661c571`, handoff `dfa6b0f`. GitHub `main` is DOCUMENTATION-first, **never checkout/reset/merge it over the working game**. Start a local v0.8.3 branch from current playable HEAD.

### Human v0.8.2 results

One real Stage Code `S01-v0.8.2-r1-EVMPD9-ALB1` was completed in **117.3sec**. [Telemetry evidence summary](docs/V0.8.2_DRIVER_R1_ANALYSIS.md). Human says the first Stage is now more fun and a bit harder, but still needs **MORE distinct challenges**. They did NOT supply formal KEEP/REWORK/REJECT for this specific Stage Code. The 673KB local JSON file is acceptable; compression can wait.

- Gas held **93.2%**, brake only **2.7%** (9 presses), **0 offroad**, ≥270km/h 38.4%, ≥285km/h 23.3%, ≥300km/h 7.2%. Four of eight Stage beats have NO brake press (01/02/04/08), while beat 07 has 5/9. Preserve thrilling fast sweeping arcs while adding several visibly readable speed-management technical challenges.
- Actual PS4 `L1+L2` screenshot CHORD **FAIL**: opens praise. Existing on-screen mouse screenshot **PASS**, so fix the input route, not reimplement screenshot rendering.
- Owner points to PS4 **SHARE** small select button and **Touchpad** as better single-button candidates.
- Need controller one-button shortcuts for **Play** and **Fullscreen**, without a mouse or D-pad focus navigation every time.

### Requested v0.8.3 deliverable

| Work | Product expectation |
| --- | --- |
| **Single-button Share screenshot** | DS4 SHARE → local PNG, not praise/menu. Chromium standard-mapped back/select slot often `buttons[8]`; actual physical device mapping must be verified. `F8` / mobile camera/mouse stay working. |
| **One-button Play/Pause** | OPTIONS (`buttons[9]` standard) starts game from Stage menu; pauses while playing; resumes with 1.0s frozen countdown. |
| **One-button Fullscreen** | DS4 Touchpad CLICK when exposed (`buttons[17]` extension on some Chrome DS4), otherwise R3 (`buttons[11]`) fallback. Verify browser requestFullscreen promise/actual result and display usable hints; never pretend rejected request succeeded. |
| **Stage 01 more engaging** | Keep genuinely fast high-speed sweepers, add several different brake-required/speed-planning events using existing L2 challenge core + optional L3 buffers. Don't blanket narrow or globally nerf steering. |
| **Human-style QA** | Five repeatable seeds with paired no-brake/braked scripted drivers and measurements; three full rendered Stage recordings, actual controller diagnostic/PNG, build/unit/E2E, local handoff. |

Authoritative docs:
- [AGENTS.md](AGENTS.md) — current scoped task / safe local checkout
- [v0.8.3 Specification](docs/V0.8.3_CONTROLLER_CHALLENGE_SPEC.md) — detailed DS4 map, Fullscreen fallbacks and stage challenges
- [v0.8.3 Acceptance](docs/V0.8.3_ACCEPTANCE.md) — hardware caveats, no-brake vs braked, prior-review regressions
- [Codex v0.8.3 Kickoff](docs/CODEX_V0.8.3_KICKOFF.md) — ordinary authorization + autonomous Goal
- [v0.8.2 Real Driver Analysis](docs/V0.8.2_DRIVER_R1_ANALYSIS.md) — measured player data, no fabricated review

**Preserve:** Original 3D car/occupants/wheels/hair, Arcade Lateral Balance, 1.75× world pace, 6 real gears, 300 flat/downhill overrun, warm engine & gentle skid, grade and speed-dependent cornering, actual 2–8 lanes, three original city/coast/canyon scenery packs and L3 biome verticality bias, Pixel 8 two-thumb landscape/PWA (144px horizontal steering reach), user-PASS PS4 steering/trigger/praise controls, keyboard and visible contextual hints, retrospective in-drive praise/issues, local Stage code/telemetry/export and all original human review archives.

Use SAME existing OutRun Codex conversation: send ordinary authorization then separate `/goal` from kickoff; Codex branches only from latest playable local HEAD and imports new docs selectively. No push, merge, public deploy, other project changes or Stage 02. STOP for human Stage screenshot and difficulty testing.

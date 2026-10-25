# Codex kickoff — v0.4.2 Corner Exit & Road Rhythm

This is a **new owner-requested milestone** following the completed local v0.4.1. The player likes turn-in but cannot easily stabilize after a bend; the route has too many long straights and too few hills.

## Local source preservation

- Local playable Windows repo: `C:\astra-dev\OutRun`, verified remote `michael-wang/OutRun`.
- Latest v0.4.1 implementation `4d4b05c`, handoff `34b6a3e` (inspect actual playable local HEAD). Remote `main` contains documentation, **not a replacement playable game**.
- Codex should safely create `codex/v0.4.2-corner-exit` from playable local HEAD. Preserve uncommitted work; fetch `origin/main` and selectively restore `AGENTS.md`, `docs/V0.4.2_SPEC.md`, `docs/V0.4.2_ACCEPTANCE.md`, `docs/CODEX_V0.4.2_KICKOFF.md` from latest remote main. **No blind merge, checkout/reset or overwriting game source.**
- If normal user authorization is required due to the earlier stop-after-v0.4.1 instruction, request this in a normal chat (NOT another Goal):
  `I authorize Project OutRun v0.4.2 Corner Exit & Road Rhythm, superseding the prior stop-after-v0.4.1 instruction. You may create a local feature branch, selectively import current v0.4.2 specifications, implement and test within OutRun, and commit locally. Do not push, merge, deploy or modify other projects.`

## Paste into a NEW real Codex Goal (or use equivalent supported Goal composer)

```text
/goal Implement Project OutRun v0.4.2 Corner Exit & Road Rhythm on the EXISTING playable local v0.4.1 game, NOT the documentation-only remote main. First verify C:\astra-dev\OutRun status/remote, preserve playable HEAD 4d4b05c/34b6a3e or later, create codex/v0.4.2-corner-exit based on it, fetch origin/main and selectively import ONLY AGENTS.md, docs/V0.4.2_SPEC.md, docs/V0.4.2_ACCEPTANCE.md, docs/CODEX_V0.4.2_KICKOFF.md, never overwrite source. Read specs. P0: preserve v0.4.1's enjoyable analog corner ENTRY while FIXING hard corner EXIT and opposite-shoulder overshoot. Diagnose actual steeringTarget→yawRate→heading→velocity/slip→road-offset with traces, distinguish player misalignment from unwanted residual inertia, and implement DIRECT predictable arcade response: steering release quickly stops commanded turn/unwanted yaw tail, countersteer responds promptly, transient sideways slip dampens, but no road-tangent snap, lane magnet or automatic curve following. Keep accepted 1.75x pace, phone touch strip/swappable two-thumb, PC A/D+Space/Enter, car-left needle HUD and off-road bounds. P1: redesign overly straight course into a deliberate racing rhythm with frequent readable turns, S-curves, short dangerous bend, fast sweeping breathers, and at least two actual drivable climbs/crests/descents in 60–90s, one bending over a crest. Author bends as distance-based track geometry at 1.75x, not elapsed-time triggers, and tune to corrected steering rather than making input more twitchy. Preserve road continuity/mesh/terrain/camera, including 120s high-speed loop regression. Independently run actual browser game, inspect videos of corner enter→neutral/countersteer→exit and full bumpy/turning track, verify deterministic yaw/slip/road traces, mobile touch and HUD/screenshots, run build/unit/Playwright, fix failures, local commit and write docs/V0.4.2_HANDOFF.md with real evidence and PASS/FAIL/UNVERIFIED. No push/merge/public deployment, no TopWar edits, no new convertible/biomes/traffic or v0.5. Stop for human playtesting.
```

## Definition of done

1. Turn-in remains fun; release and countersteer are **predictable**, without seconds of residual slide dragging the car toward the opposite shoulder.
2. Visible track now has frequent, varied, navigable bends and true elevation crests/descents, not only distant mountain decoration.
3. Pixel 8 and PC controls, needle HUD and accepted fast world speed are preserved.
4. Full build/unit/Playwright plus actual driving evidence and truthful `docs/V0.4.2_HANDOFF.md`.
5. Human decides final corner exit feel; **do not assert subjective acceptance** from the green test count.

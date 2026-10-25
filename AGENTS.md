# Project OutRun — Codex operating agreement

## Active milestone: v0.4.2 — Corner Exit & Road Rhythm

The player finished v0.4.1 playtesting and reports **corner entry is now enjoyable**, but **exiting a bend is hard: the vehicle often continues toward the opposite shoulder**. The road also has **too many long straights and not enough noticeable hills**. This is a product tuning + track-design task, **not a new steering-control rewrite**.

**Read first:** `docs/CODEX_V0.4.2_KICKOFF.md` → `docs/V0.4.2_SPEC.md` → `docs/V0.4.2_ACCEPTANCE.md`. Older specs/handoffs are historical context and regression constraints.

## Repo safety / autonomy

- Verify `C:\astra-dev\OutRun` points to `michael-wang/OutRun`. Never touch `C:\astra-dev\topwar`.
- The **playable v0.4.1 is committed locally**, implementation `4d4b05c` + handoff `34b6a3e`. Remote `main` is primarily documentation and **must not replace** the playable game. Start a v0.4.2 feature branch from the most recent playable local HEAD, preserving uncommitted changes.
- Fetch `origin/main` and **selectively restore only current v0.4.2 docs plus this AGENTS.md**, after inspecting conflicts. No blind merge, hard reset or fresh scaffold.
- Independently inspect v0.4.1 source and test evidence, implement minimal changes, run actual game and record driving, inspect motion, fix, run build/unit/Playwright, commit locally. Routine Git/coding decisions belong to Codex. Respect sandbox approval rules; request normal-chat authorization if the older stop instruction blocks the current user-authorized milestone.
- No pushing, merging, public deployment, paid services, unlicensed SEGA/Ferrari assets or unrelated repo changes.

## Product hierarchy

1. **P0: Corner exit control** — KEEP the continuous analog touch steering strip and shared PC A/D virtual-steering mapping. Preserve good turn-in response. Diagnose whether unwanted post-turn motion comes from commanded yaw-rate, yaw-rate smoothing, car-vs-velocity heading divergence, residual lateral slip, or track curvature. Remove unintended delay/inertia but **never align the vehicle to the road or center its lane automatically**. Countersteering must be prompt and proportionate; steering-neutral means **no new commanded turn**, not automatic course correction.
2. **P1: Arcade track composition** — at accepted **1.75×** coherent world pace, substantially increase meaningful curve frequency and add visible climbs/crests/descents; easy sections can be fast sweeping curves instead of dead-straight roads. Track challenge must be navigable with the finalized handling, with no broken seams or unreadable impossible turns.
3. **Regression:** Preserve analog input's absolute-touch mapping and multi-pointer controls, PC `A/D` direction + `Space` gas + `Enter` brake, 1.75× speed feeling, car-left working needle speedometer, Pixel 8 landscape/fullscreen/PWA, long-press suppression, bounded off-road penalty and quick return, nonconstant squeal, fixed camera, zero automatic road-follow, road continuity.

**Not in scope:** convertible/passengers, scenic biomes, rivals/traffic, scoring, new art themes, extra modes, physics engine rewrite or HUD redesign.

## Handoff

Create `docs/V0.4.2_HANDOFF.md` with:
- exact local branch/commit, commands and playable LAN URL;
- source root cause(s) or honest unresolved hypotheses; before/after **steering target, vehicle heading, yaw rate, velocity heading/slip angle, lateral road position, track curvature** traces;
- actual entry → neutral/countersteer → exit browser driving clips, plus a tight road segment and hill/crest clip;
- track rhythm map authored by distance with estimated durations at 1.75×, and actual measured curvature/elevation distribution;
- build/unit/E2E output, desktop/Pixel-like screenshots, known issues, physical-device status and human playtest questions.

Stop after v0.4.2 for human review. This stop ends this work assignment only, not future user-approved milestones.

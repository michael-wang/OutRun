# Project OutRun — Roadmap: Curated Procedural Journeys

## Last delivered: v0.6 Scenic Journey (local)

Three visually distinct environments (Azure Coast, Golden Canyon, Sunlit Coastal City), expressive car and occupants, improved wheels and varied calibrated driving sections. The user considers it **FUN**, appropriate for family playtesting.

## Long-term product direction: Infinite Road Trip

The owner wants **two player motivations**, backed by ONE generator:
- **Guided Journey:** choose a themed trip, such as `Pacific Road Trip — Intermediate — 5 Minutes`.
- **Mystery Drive:** choose to be surprised by supported environments and carefully constrained challenge combinations.

Use a **HUMAN-APPROVED brick library**. Codex can generate candidate geometry/visibility/speed/grade/road-width combinations, run deterministic checks, and hand the owner a small playable review batch. Approved bricks, with compatible entry/exit rules, become the only inputs to generated trips. Avoid pure uncurated random road pieces.

Read `docs/PROCEDURAL_JOURNEY_STRATEGY.md` and `docs/CHALLENGE_BRICK_CANDIDATES.md`.

## NEXT PLAYABLE PROTOTYPE PROPOSED: v0.7 Journey Lab

**Now authorized:** build eight actual candidate previews + KEEP / REWORK / REJECT and local JSON export; wait for Michael's votes before any full journey composition.

1. Brick Lab: show 8 carefully chosen candidate driving moments in a fast replayable browser view; owner uses KEEP / REWORK / REJECT. Aim for ~5–6 approved bricks, not approving arbitrary content to satisfy counts.
2. **v0.7B ONLY AFTER HUMAN APPROVAL:** generate one **5-minute Pacific Road Trip — Intermediate** using approved bricks, current three scenic packs and existing Gameplay-First inverse-curvature engine. Save deterministic Seed + Generator Version.
3. Test 10 different seeds for continuity, controllability, varied challenge sequences and actual scenery variation, not just new random number IDs. Show at least three noticeably different trips in recordings for the human playtest.
4. Mystery Drive may be introduced with the same generator if v0.7 guided proof stays good, otherwise scope separately to v0.8. No snow/volcano claims without new asset pack.
5. Human decision: would someone voluntarily drive a second generated seed WITHOUT coins/upgrades? If no, improve the brick library and beat grammar first.

Current executable definition: `docs/V0.7A_SPEC.md`, `docs/V0.7A_ACCEPTANCE.md` and `docs/CODEX_V0.7A_KICKOFF.md`. The broader trip plan remains `docs/V0.7_PLAYABLE_PROTOTYPE_PLAN.md`.

## Later — ONLY after journey replayability wins human GO

- **Mystery journey expansion:** more approved environmental sets, surprising yet fair beat sequences, share/replay by code.
- **RPG progression:** completion-based currency, a small Garage, vehicle performance upgrades/new original cars and unlockable roads; no fake daily-login retention or penalty for casual play.
- **More challenge vocabulary:** marked lane closures, predictable traffic, true collision avoidance, rivals, grip differences/rain/snow chains, volcanic/alpine environments — each with its own human-approved mechanics and fair warnings.
- **Difficulty & emotion:** authored Beginner/Intermediate/Advanced/Godlike stage script envelopes, signposted easy/hard route forks, optional player-aware future-stage generation (never secret mid-corner manipulation).
- **Stage Composer:** only build a visual editor if we repeatedly need it to curate/author approved bricks or meaningful journey rhythms. Do not lead with an elaborate editor.

## Non-negotiable

**We are not building a procedural road screenshot generator or a grinding machine.** We are building a driving game worth playing again. Existing responsive arcade steering, 1.75× speed, Pixel controls and original visual appeal stay protected throughout.

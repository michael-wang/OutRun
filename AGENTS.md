# Project OutRun — Codex operating agreement

## CURRENT USER-AUTHORIZED milestone: v0.7C — L1 Library & L2 Feedback Lab

The owner commissioned development after reviewing v0.7A.1: all eight original `BRK-01..08` revision 2 received KEEP and machine QA PASS. User explicitly wants **AI to create/test all basic L1 shapes without personal L1 playtests**, systematically generate varied L2 combinations, and let the human provide **instant POSITIVE and NEGATIVE feedback** during driving plus end-of-L2 KEEP/REWORK/REJECT and difficulty ratings.

Read `docs/CODEX_V0.7C_KICKOFF.md`, `docs/V0.7C_SPEC.md`, `docs/V0.7C_ACCEPTANCE.md`, `docs/L1_PRIMITIVE_CATALOG.md`, `docs/V0.7C_L2_COVERAGE_MATRIX.md`, and r2 ratings `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json`. Older specs are historical context, not authorization for v0.7B or giant world-generation work.

### Local source protection

- Work only in `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. GitHub `main` primarily holds specifications, **not** the playable game's source. Never merge/reset/check out remote `main` over local working gameplay.
- Inspect current local branch, HEAD and worktree before changes. Playable v0.7A.1 has been human reviewed; the exact final code commit is not visible in remote docs. Start `codex/v0.7c-l1-l2-feedback` from latest playable LOCAL HEAD, preserve unexpected local edits, and selectively import only v0.7C docs+`AGENTS.md` after `git fetch origin`. Do not overwrite local README or historical reviews. The optional Road Profile Inspector task is NOT a precondition.
- If another Goal actively edits the checkout, don't race it; protect work and request the owner's decision where genuinely needed.
- No unapproved push, merge, public deployment, paid services, other project edits (never touch `C:\astra-dev\topwar`), external runtime telemetry or copyrighted SEGA/Ferrari assets.
- If permission review is blocked by an old stop-after-v0.7A.1 instruction, ask for a clear ordinary non-/goal authorization in the existing **single OutRun Codex conversation**, and respect actual approvals. Do not repeatedly attempt denied actions.

### Deliverable (P0)

1. **L1 profile library:** 8 Curvature C01–C08, 6 Elevation E01–E06, 4 Width W01–W04. Audit existing code and reuse features; technical AUTO QA only. L1=local geometry profiles; L3=world surface/scenery constraint; don't blend world/snow/biome into L1.
2. **16 systematic real playable L2:** `L2-001..016` use the fixed coverage matrix, stacked same-distance C+E+W profiles with current coast/canyon/city worlds, deterministic seeds and a simple `?lab=l2` four-batch player review UI.
3. **Instant feedback, not only issue reports:** top-corner `✨ 讚` / `⚑ 問題`, precise snapshot BEFORE pausing, four original exact tags **超好玩! / 超刺激! / 超難! 但是過了超爽! / 風景優美**, optional notes and issue text; safely pause/resume with phone keyboard. Post-completion 'hard but rewarding' must attach to the completed L2. End-of-L2 KEEP/REWORK/REJECT + difficulty 1–5 + tags/notes. localStorage + Export Feedback JSON; no backend and no auto-KEEP.
4. **Regression:** original BRK r2 votes and all 8 playable examples untouched; accepted Arcade Lateral Balance, 1.75× world pace, four soft steering levels each direction, 2–8 real lanes, altitude, car/drift/wheel/hair, original scenery, Pixel 8 two-thumb landscape fullscreen/PWA and PC A/D + Space/Enter.

### Acceptance and handoff

- Run real rendered/browser driving inspection of all 16 L2, deterministic geometry and controls, precise praise/issue anchoring, negative/positive event storage/export, end-of-L2 rating and normal play regressions.
- Run build/unit/Playwright and honest actual outputs. Make limited, maintainable changes; no full Stage Composer, reactive AI level designer, feasibility optimizer, snow/volcano assets, traffic, RPG, or five-minute Pacific Road Trip.
- Commit locally and write `docs/V0.7C_HANDOFF.md` with actual URL, coverage tables, ratings initially UNREVIEWED, screenshots/videos, test commands/results and limitations.

**Stop after v0.7C deliverable for new L2 human ratings.** A later NEW explicitly authorized milestone may proceed; do not implement v0.7B without that authorization.

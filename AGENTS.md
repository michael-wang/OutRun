# Project OutRun — Codex working agreement

## ACTIVE: v0.7A Challenge Brick Lab — explicitly authorized

The product owner has just authorized **v0.7A ONLY**. Build eight REAL playable challenge-brick previews and a tiny human review interface. **DO NOT implement v0.7B's Pacific Road Trip, Mystery Drive, dynamic difficulty, full Stage Composer, RPG rewards, new obstacle collision/traffic, garage or economy.** Prior “stop after v0.6” ended v0.6 pending human review; this new owner request authorizes v0.7A.

Read in this order:
1. `docs/CODEX_V0.7A_KICKOFF.md`
2. `docs/V0.7A_SPEC.md`
3. `docs/V0.7A_ACCEPTANCE.md`
4. `docs/CHALLENGE_BRICK_CANDIDATES.md`
5. `docs/PROCEDURAL_JOURNEY_STRATEGY.md` (future integration context only).

## Local repo safety and authorization
- Work ONLY in `C:\astra-dev\OutRun` and verify git remote `michael-wang/OutRun`; NEVER change `C:\astra-dev\topwar`.
- The playable v0.6 app is on the user's **LOCAL** checkout (reported code commit `6401a03`, handoff `cf83901`). GitHub `main` is largely specifications, not the playable code. **Do not merge/reset/checkout docs-only main over the playable branch.**
- Inspect status/current HEAD; preserve user edits. Create `codex/v0.7a-brick-lab` from the most recent playable LOCAL HEAD. Fetch `origin/main` and selectively import **only** `AGENTS.md`, `docs/V0.7A_SPEC.md`, `docs/V0.7A_ACCEPTANCE.md`, `docs/CODEX_V0.7A_KICKOFF.md`, `docs/CHALLENGE_BRICK_CANDIDATES.md` as needed; do not overwrite local source, handoff, README or unrelated files.
- Respect real sandbox approvals. If automated review refuses based on the earlier milestone stop, request a one-time **normal-chat** user authorization rather than retrying or bypassing the denial.
- No push/merge/public deployment, paid services, secrets, other repo edits or copyrighted SEGA/Ferrari assets.

## Implementation principle
- This is a **playable product experiment**. Eight actual drives, not eight written cards or eight variants of the same corner. User is the final judge of fun.
- Keep the actual human-approved v0.6 arcade feel: Gameplay-First track/inverse-Required-Steering generation, Arcade Lateral Balance, default 1.75× world pace, soft four-detent analog strip, visual drifting, convertible/occupants, three scenic packs, off-road penalty/bounded recovery, 3D road, left-of-car needle gauge. Preserve Pixel 8 fullscreen/PWA/two-thumb/handedness/long-press and desktop A/D+Space/Enter.
- Model a `ChallengeBrick` as a small **data-driven gameplay moment with compatible lead-in and exit**, not a mesh asset. Prefer focused typed data/adapter onto existing track generator. No general editing framework/DSL or endless procedural content pipeline.
- Make QA reproducible with unique IDs, versions and deterministic seeds. Inspect actual rendered play, especially first-time readability, on desktop and Pixel-like landscape.
- **AUTO_VERIFIED != HUMAN_APPROVED.** Automated tests can verify passability/geometry but must never create the owner's KEEP votes. Initially all 8 human votes are unset. Do not create a generated public journey using unapproved candidates.
- Build `?lab=bricks` (or similarly explicit route) accessible on the actual phone, with replay/next, three decisions KEEP/REWORK/REJECT, optional short notes, local persistence and portable export. Keep ordinary v0.6 play and menu working.

## Delivery and stop
- Run build/unit/Playwright, deterministic replay/geometry checks, and real browser drives for all eight candidates; inspect screenshots and representative motion clips. Exercise phone thumb input and both handedness layouts. Fix broken or unfair candidates rather than falsely certifying them.
- Commit locally to the v0.7A branch; write `docs/V0.7A_HANDOFF.md` with exact local + Pixel URLs, branch/commit, eight candidate status table (AUTO vs actual HUMAN votes), test results, representative screenshots/videos, limitations, and the minimal review/export workflow.
- Leave the eight candidate votes **unreviewed until the owner reviews them**. Deliver and STOP for human KEEP/REWORK/REJECT; **do not start v0.7B**.

# Codex autonomous kickoff — v0.3 Arcade Velocity

## Important: start from v0.2.1 local game code

User's latest Codex delivery: v0.2.1 committed locally as `9bdc6d8` and clean; it contains long-press browser protection and the bounded off-road corridor. The remote GitHub `main` contained documentation only when this v0.3 brief was committed. **Never replace, reset or re-clone over the playable v0.2.1 checkout.**

Workflow for Codex (do these engineering chores autonomously):
1. At `C:\astra-dev\OutRun`, inspect `git remote -v`, `git status --short`, branch and recent log. Check the game source and `9bdc6d8` are present. Preserve any later work; never force-discard.
2. From the current playable HEAD, create `codex/v0.3-arcade-velocity` (or use a safe existing matching feature branch).
3. Fetch `origin/main`, then integrate the v0.3 requirements **without merging or replacing the playable game**: either cherry-pick docs commit `71f979e740f7087ce6d371601579760de4914ae8` if compatible, or selectively restore `AGENTS.md`, `docs/V0.3_SPEC.md`, `docs/V0.3_ACCEPTANCE.md` and `docs/CODEX_V0.3_KICKOFF.md` from `origin/main` after checking local edits. This selective-restore path includes subsequent documentation-only corrections. Resolve any conflicts while preserving game code. **Do not merge remote main onto the local game blindly.**
4. Confirm `docs/V0.3_SPEC.md` and `docs/V0.3_ACCEPTANCE.md` now exist locally. Start the Goal below; do not revert to v0.2 kickoff.

## Paste into an actual Codex Goal in the OutRun Local project

```text
/goal Develop Project OutRun v0.3 Arcade Velocity from my EXISTING playable local v0.2.1 build, not from the documentation-only remote main. First verify repository/working tree and preserve changes, create codex/v0.3-arcade-velocity from the playable HEAD, fetch origin/main, and bring over only AGENTS.md and docs/V0.3_SPEC.md, docs/V0.3_ACCEPTANCE.md, docs/CODEX_V0.3_KICKOFF.md from the latest origin/main (or safely cherry-pick its v0.3 docs commits). Do not discard or overwrite game source. Then read those v0.3 specs and implement autonomously. P0: reframe the fixed chase camera so the car is approximately 20–25% of landscape viewport width, lower in frame, with readable near road; reduce oversized top UI to compact Pause/Menu while preserving Pixel 8 two-thumb controls. P0: make acceleration and high-speed driving VISUALLY exhilarating through coherent world distance, road marking movement, passing nearby scenery, parallax and engine audio, NOT by HUD numbers, speed-dependent zoom/FOV or heavy shake; capture actual low/high-speed motion clips and inspect them. P1: denser, stronger but readable S-bends and crest corners, requiring skill and occasional braking to preserve speed. P2 BONUS only if P0/P1 pass: one themed scenery transition. Preserve v0.2.1 bounded shoulder/off-road slowdown/no auto-road-follow, no long-press selection, Pixel fullscreen/PWA and existing tests. Run the game and build/unit/Playwright tests, visually review screenshots and video, fix failures, commit locally and write docs/V0.3_HANDOFF.md with measured car framing, speed evidence, test results and remaining Pixel hardware checks. No pushing, merging, public deployment, TopWar edits or v0.4. Stop for human playtest.
```

## User handoff

The milestone is NOT done when speed text says a larger number, nor when the car image gets bigger while the road becomes unusable. Codex must demonstrate both composition and **moving speed** in a running browser, show evidence, protect Pixel 8 input and off-road behavior, and leave the program locally playable for Michael's review.

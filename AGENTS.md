# Project OutRun — Codex working agreement (29 October 2026)

## ACTIVE OWNER-AUTHORIZED MILESTONE: v0.9 Ten-Minute Road Trip

The owner **actually played v0.8.5** via existing ~2min Stage and reported NO perceptible pop-in, stutter or abrupt interruption, and photo capture NORMAL. This is a human usability GO for proceeding to a **NEW TEN-MINUTE ROAD TRIP**, not verified real Pixel 8 hardware FPS nor a claim that all seeds and memory are perfect. Codex reported v0.8.5 LOCAL implementation `97cff65` and handoff `f160929` on `codex/v0.8.5-scene-streaming`, with clean working tree. Check actual Windows HEAD/status before branching; owner may have new local edits.

**Read in order:**
1. `docs/CODEX_V0.9_TEN_MINUTE_KICKOFF.md` (ordinary authorization and ready current Goal).
2. `docs/V0.9_TEN_MINUTE_ROADTRIP_SPEC.md` (NEW actual ten-minute road-trip content).
3. `docs/V0.9_TEN_MINUTE_ACCEPTANCE.md` (3 full long browser drives, 5 seeded routes, streamer/CPU/GPU/memory gates).
4. `docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md`, `docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md` (phased reference only: v0.8.5 done, v0.9 active, v0.9.1 future).
5. `docs/V0.8_BIOME_VERTICALITY_METADATA.md` (L3 world elevation preference).

### Actual v0.9 deliverable

- Add one new selectable **`10-Minute Road Trip`** with original title/label, dedicated distinct Trip Code + seed, start/replay same/new route/progress/finish and final player KEEP/REWORK/REJECT + difficulty; target ~8–12min actual representative driving, not wall clock freeze/timer trick. Preserve old short Stage and historic BRK/L2 Pilot/Stage codes/reviews.
- Generate a CHEAP deterministic logical 10-minute RoutePlan of L1 curvature/grade/width, authentic multi-placement L2 challenging cores and L3 biome/scenic rhythm; do **NOT** create all the corresponding 3D geometry at launch.
- REUSE the existing bounded v0.8.5 SceneStreamer for short rolling road/terrain/props chunks, ready ahead and dispose/pool behind, no missing road, wrong seam or observable input hitch. GPU resource count/heap bounded on 10/20min virtual progress. Preserve stable absolute s/position/eventAt with any high-coordinate rebasing.
- The long trip must be **varied**: interesting high-speed wide bends + brake-worthy technical turns + canyon big grade/crest + city/coast changing vista + recovery, seed-varying C/E/W, L2 order/biome duration, deliberate optional L3 buffers (NOT five copies of old 2-min Stage). Four lanes generally dominate, six/eight secondary, rare true narrow.
- Stage 01 code, v0.8.5 streamer/perf, current car and gamepad/touch/keyboard/audio/telemetry/photo flow unchanged. Human feedback still logs both absolute road L2 instance and retrospective eventAt versus reactionAt. No auto-submitted ratings.
- Run ≥5 deterministic long codes, ≥3 FULL rendered long drives with performance and biomechanics traces, 20-min memory soak, 30/60fps/PWA viewport tests and original short-stage regression. Codex tests cannot substitute actual physical Pixel long-play. Deliver `docs/V0.9_HANDOFF.md` and stop for two+ actual user Trip Code reviews.

### Local source & authorizations

- **Working game lives ONLY on user Windows `C:\astra-dev\OutRun`**. GitHub `michael-wang/OutRun` `main` is **primarily DOCS**, NOT current game source. **NEVER checkout/reset/rebase/merge docs-only main over live app**. Branch `codex/v0.9-ten-minute-roadtrip` from current playable LOCAL HEAD, fetch origin then selectively import approved v0.9 docs (not README/source wholesale).
- Old stop-after-v0.8.5 was a human GO gate; owner satisfied it. If Codex permission reviewer still denies branch/fetch, request explicit plain normal (non-/goal) chat authorization in SAME unique OutRun Codex conversation, and respect denied actions.
- Preserve existing 1.75× arcade pace, six-speed/300 flat, downhill >300, grade/velocity lateral-balance, 144px Pixel thumb bar, full scene streaming with existing original art limitations, PS4 Touchpad photo/SHARE fullscreen/OPTIONS Play-Pause, L1 praise/Square issue, 1s resume, local photo archive and review exports. Preserve saved photos and all old votes.
- NO Stage02, v0.9.1 big scenic art pass, traffic/rivals, new snow/mountain/volcano packs, coin/RPG/garage, backend telemetry, paid services, full editor, other repos including TopWar. No push, merge, public deployment.
- Commit LOCALLY and write real performance+human handoff. **STOP after v0.9**; next work needs new separate user approval.

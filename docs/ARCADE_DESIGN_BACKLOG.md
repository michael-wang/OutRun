# Project OutRun roadmap — ready for one REAL procedural stage

## RECENT HUMAN RESULTS

- v0.7D original 3 pilots: KEEP all, difficulty 2/3/2.
- v0.7D.1 pilot update: KEEP all, difficulty 1/2/2; physical PS4 controller PASS.
- **v0.7D.2 current playtest:** all 3 L2P-A/B/C KEEP again, difficulty 1/2/2, positive feedback has verified *different* eventAt and reactionAt on actual Gamepad/mouse use. Source raw `docs/reviews/V0.7D2_PILOT_R1_HUMAN_FEEDBACK.json` and digest `docs/V0.7D2_HUMAN_PLAYTEST.md`. The UI/audio subfeatures were not explicitly all declared PASS; new corrections are incorporated into Stage One.

## ACTIVE OWNER-COMMISSIONED: v0.8 Stage 01 Pacific Getaway

**ONE sequential Goal** from latest playable LOCAL v0.7D.2 code. First small UX/L3 corrections, then Stage:

1. **L3 world/biome metadata**: canyon very dramatic verticality weighted higher; city and coast mostly mild/rolling but occasional extreme plausible coastal headland/urban ramp allowed. Applies to real grade/height instance parameters, NOT hard bans or whole-E-shape name filters. Existing 3 scenes only; no new Alpine art pack. Terrain/props respect generated road/biome.
2. **Keyboard/menu shortcuts**: compact embedded letter `[P]lay`, `[R]eplay same`, `[N]ext`; no spaced prefix `[P] Play`. The help labels change between meaningful keyboard use, connected active standard gamepad and mobile touch. UI must reflect real bindings and not hide control capabilities.
3. **In-drive input legend**: gamepad `L1 讚 · □ 問題`, keyboard `[G]讚 · [I]問題`; Square button creates anchored issue flag for later note if needed. Retrospective praise and issue default to genuine earlier event snapshot, exported eventAt + reactionAt, PS4 D-pad tag / Cross confirm.
4. **Procedural Stage One**: nominal ~100–150 second start→finish; deterministic `Stage Code`, Replay Same, New Route; actually sample several unique combinations of multi-placement L1/L2 curve+grade+width+scenery motifs and a coherent driving arc. This must NOT be the 3 static liked Pilots in a row or merely moving palm trees. No runtime model.
5. **Verification**: ≥5 deterministic stage seeds; 3 fully recorded real-browser full Stage drives, at least 2 materially different steering/brake demands, no same-altitude impossible overlaps or props intruding the roadway, working Pixel/gamepad/keyboard input and feedback; stop for human “would I drive a NEW seed again?” assessment.

Authoritative docs: `docs/V0.8_STAGE_ONE_SPEC.md`, `docs/V0.8_STAGE_ONE_ACCEPTANCE.md`, `docs/V0.8_BIOME_VERTICALITY_METADATA.md`, `docs/CODEX_V0.8_STAGE_ONE_KICKOFF.md`.

## HUMAN REVIEW AFTER v0.8

User drives multiple actual Stage Codes, rates overall KEEP/REWORK/REJECT and pleasant/surprising moments via location-aware praise/issue. Only after meaningful replayable Stage One enjoyment consider larger 3–5 minute trips, Mystery Drive discovery, more terrain/traffic/surface vocabularies and later progression/garage.

## NOT NOW

No 3A optimizer, stage/world GUI editor, cold-start new engine, physical traffic/rival cars, new snow/volcano assets, full RPG economy, push/merge/public deploy or other-repo operations. Keep original approved BRK, L2P and failed v0.7C review archives immutable.

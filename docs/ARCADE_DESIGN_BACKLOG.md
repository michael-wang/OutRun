# OutRun roadmap after v0.7D.1 human test — toward the first procedural stage

## Human acceptance / facts

- v0.7D original multi-placement L2 Pilot A/B/C: 3 KEEP, difficulty 2/3/2.
- v0.7D.1 revised grade/speed handling and PS4 Gamepad: user PASS for controller; all 3 pilots still KEEP, difficulty now **1/2/2**. The exported machine autoQA remains PENDING, independent of Codex reported green build/test.
- Preserve raw [v0.7D.1 reviews](reviews/V0.7D1_PILOT_R1_HUMAN_FEEDBACK.json), original v0.7D pilot reviews, earlier 8 BRK-r2 KEEP and earlier L2 negatives. No fabricated events/relabels.

## CURRENT owner-authorized: v0.7D.2 Retrospective Praise & Squeal Quality

1. Fix false-positive low-speed squeals; simple lateral position correction ≠ sliding tire.
2. Make squeal sound softer than now, clearly less perceptually dominant than USER-PASSED engine, consistent left/right at genuine hard corners.
3. Display PC shortcuts on the actual menu actions, not only in a help modal: `[R]eplay same`, `[N]ext`, `[P]lay again` etc.
4. Gamepad: either L1 or R1 to quick praise, 4 Dpad directions map to 4 exact Chinese praise tags, Cross X commits/resumes and Circle cancels, clearly visible hints. Keyboard G/I, arrows/1–4 and Enter.
5. **Real retro-position markers**: snapshot a small last ~12–15s of simulated driving, default praise position ~2–3s BEFORE press, optional recent-time adjustment, export true eventAt and reactionAt with prior world/L1/vehicle. At completion keep buffer briefly. Preserve existing issue and review export functionality.

Authoritative spec `docs/V0.7D2_FEEDBACK_AUDIO_SPEC.md`, acceptance `docs/V0.7D2_ACCEPTANCE.md` and kickoff `docs/CODEX_V0.7D2_KICKOFF.md`. **Stop for player SFX and controller praise playtest**.

## NEXT PREPARED, NOT AUTOMATIC: v0.8 First Procedural Stage

Once v0.7D.2 gets human GO, create Stage 01 **Pacific Getaway** (roughly 100–150s) with a reproducible seed and actual procedural variations of C/E/W and Stage beat orders using the 3 existing visual biomes. Don't merely concatenate the 3 fixed L2P pilots; generate a new continuous road and scenery with real variation in steering/braking/grades/landmarks. Keep instant positive/negative retrospective feedback throughout the longer drive. Test 5 seeds, actually play/record 3, final replay/new-route controls, honest human stage rating. See `docs/V0.8_STAGE_ONE_SPEC.md` and future kickoff.

## LATER (not yet)

Expand to full 5-min Pacific Road Trip, then Mystery Drive, broader approved obstacle/traffic vocabulary, snow/volcano, optional minimal editor, reward coins/Garage only after procedural rides are replay-fun WITHOUT currency. Avoid speculative AAA solver, overgrown engineering process, generic editors, or one-pass 16-L2 mass work.

**Principle:** joyful high-speed driving plus player-identified positive moments; no machine-generated pretend fun.

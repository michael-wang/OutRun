# Project OutRun — Codex operating agreement

## ACTIVE OWNER-AUTHORIZED: v0.7D.2 — Retrospective Praise & Tire Skid Audio Polish

**Latest human playtest of v0.7D.1:** real PS4 gamepad **PASS**; all three local L2P-A/B/C r1 pilots **KEEP** (human difficulty 1/2/2; machine autoQA=PENDING in exported JSON). Owner says (a) tire squeal currently fires at low driving speeds and sounds unpleasant/sharp/louder than the warmly tuned engine, (b) menu keyboard accelerators should be PRINTED on buttons, and (c) fast in-drive praise should require only L1/R1→Dpad direction→PS4 Cross (X), or G/arrow/Enter on keyboard, with **retrospective anchor because the road moment already passed**. Original export: §docs/reviews/V0.7D1_PILOT_R1_HUMAN_FEEDBACK.json§, note §docs/V0.7D1_HUMAN_PLAYTEST.md§.

**Read:** §docs/CODEX_V0.7D2_KICKOFF.md§, §docs/V0.7D2_FEEDBACK_AUDIO_SPEC.md§, §docs/V0.7D2_ACCEPTANCE.md§ and archived feedback. These are current scoped requirements.

### Code/permissions safety
- Only work in §C:\astra-dev\OutRun§; expected remote §michael-wang/OutRun§. Playable v0.7D.1 latest reported LOCAL commits §30e6f54§ implementation + §710d184§ handoff (verify actual local HEAD/clean state).
- GitHub §main§ holds chiefly SPEC/DOCS, not working app source. Never merge/reset/check it out onto local game. Create a new local §codex/v0.7d2-feedback-sfx§ from latest playable HEAD; fetch origin/main and selectively import only current §AGENTS.md§, v0.7D2 docs and current archived v0.7D.1 owner review. Preserve all code and historical review exports/localStorage.
- If previous stop-after milestone prevents Git operations, ask owner once for explicit ordinary non-/goal permission within the existing OutRun Codex conversation; respect actual sandbox permission. No repeated rejection retries/bypasses.
- No push, merge, public deployment, paid services, backend telemetry, unlicensed SEGA/Ferrari material, edits to §C:\astra-dev\topwar§ or another repo.

### Fix, don't overengineer
1. Investigate false-positive LOW-SPEED squeals. In Arcade Lateral Balance, ordinary §dx/dt§ can be simple lane correction, not tire slip. Trigger using meaningful corner/slip stress and speed, quiet on gentle/slow driving. Maintain comparable left and right real drift sounds and reset behavior.
2. Make tire sound softer/less piercing and LOWER IN MIX than owner-PASSED warm engine sound. Browser audio comparison, mix levels, no clipping; engine note unchanged.
3. Make PC menu shortcuts VISIBLY discoverable e.g. §[P]lay again§, §[R]eplay same§, §[N]ext§; native Tab/Enter/focus and text/IME controls preserved.
4. DS4 §L1 OR R1§ quick praise; four exact tags mapped Dpad UP/RIGHT/DOWN/LEFT, Cross X saves and RESUMES, Circle cancels; visible diamond/hint including controller confirmation and optional Square issue. PC §G§ praise / §I§ issue, arrows/1–4 and Enter save.
5. Snapshot **actual past driving state**, not current coordinate: maintain ~12–15sec 10Hz lightweight ring buffer; default positive marker about 2–3s BEFORE reaction, selectable Now/-2/-4/-6/-8/-12s; carry past seed/world/L1/vehicle values, export §eventAt§ + §reactionAt§. Retain recent samples briefly at route finish; no video/audio recordings or auto upload.

### Protected regressions and end
- Accepted 1.75× Arcade Lateral Balance, 300 km/h six-speed, v0.7D.1 hill/speed physics, 144px mobile steering and compact HUD, warm engine, actual real PS4 controller driving, keyboard menu controls, 18 L1 families, 2–8 lanes, three worlds, accepted BRK-r2/three pilot experiences and their ORIGINAL exports.
- Actually drive audio and praises, test keyboard/controller edge events and historical anchors, production build/unit/Playwright, phone/desktop screenshots. Commit LOCAL and create §docs/V0.7D2_HANDOFF.md§ with PASS/FAIL/UNVERIFIED.

**STOP after v0.7D.2 for human control/audio review.** v0.8 Stage One is prepared but NOT authorized to start until this deliverable has been human approved.

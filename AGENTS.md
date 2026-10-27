# OutRun — Current Codex working agreement

## ACTIVE OWNER-COMMISSIONED: v0.8.1 Powertrain Feel & Stage 01 Rhythm

**Latest human playtest:** v0.8 Stage One `S01-v0.8-r1-1-ALB1` was **REWORK**, difficulty 2 and comment "Could use more L2 blocks." Exact original review and objective geometry metrics are in `docs/reviews/V0.8_STAGE01_SEED1_HUMAN_FEEDBACK.json` and `docs/V0.8_STAGE01_R1_POSTMORTEM.md`.

Owner's three new requests:
1. Six-speed car still feels like speed grows linearly, not progressively weaker acceleration at higher gears. Gear shifts need a genuine real-torque interruption which may naturally create a SMALL speed dip, NOT a fake fixed km/h subtraction.
2. Stage One L2 sections have excessive empty straight before/after their brief curve events. Stage Seed 1: each of 8 whole beats has only ONE C+ONE E+ONE W, curves occupied only 45.5% of route distance, inter-C gaps ~732–930 world units. **L2 should be a COMPACT challenge core**; L3 composes cores and adds OPTIONAL, rhythmically justified buffers/accelerate/view-release segments. Reuse original HUMAN-KEEP multi-placement L2 Pilot composition, NOT 8 one-C/E/W whole-route mini blocks.
3. User wants 4-lane roads DOMINANT, 6–8 as secondary, scarce 2/3 for special narrow moments. Seed 1 puts `4→2` W04 bottlenecks in 4 of 8 blocks. Measure lane percentages from resolved width profile, not W count, and don't fake 3 lanes as fractional taper.

**Read first:** `docs/CODEX_V0.8.1_KICKOFF.md`, `docs/V0.8.1_POWERTRAIN_STAGE_RHYTHM_SPEC.md`, `docs/V0.8.1_ACCEPTANCE.md`, `docs/V0.8_STAGE01_R1_POSTMORTEM.md` and original user archive. These define CURRENT scope. Original `docs/V0.8_STAGE_ONE_SPEC.md` remains HISTORICAL reference for Stage 01 alpha and is NOT a second active Goal.

## Local source & reviews
- Work only in user's LOCAL `C:\astra-dev\OutRun`, remote expected `michael-wang/OutRun`, latest v0.8 handoff commit `ee86082` or newer; VERIFY HEAD/branch/status before editing. Origin `main` is DOCS-FIRST, not the source. Never checkout/reset/merge remote docs-only main onto local app.
- Branch `codex/v0.8.1-powertrain-stage-rhythm` from latest PLAYABLE local HEAD, import ONLY newest v0.8.1 task docs, this AGENTS and original Stage 1 human review on GitHub main. Preserve all uncommitted work and browser feedback localStorage.
- If previous stop-after-v0.8 automatically blocks Git permission, get explicit owner authorization in ordinary message in same OutRun Codex chat; do not retry denied actions.
- Preserve human-KEEP pilot A/B/C r1 revisions (v0.7D and updated v0.7D.1/D.2), eight BRK-r2 human KEEP, prior v0.7C REJECTs, original v0.8 seed1 REWORK. Revised Stage gets NEW generator revision/fingerprint and starts UNREVIEWED, never relabel human votes.
- Preserve USER-accepted 300km/h six gears, warm engine and softer squeal, 1.75× world pace, grade and speed-sensitive lateral balance, 144px mobile thumb range and compact HUD, PC shortcuts and actual PS4 controller with quick retrospective praise/issues, three current scenic packs. No traffic/rivals, stage editor, RPG, user tracking or new world content.

## Acceptance
- BENCH original vs revised 0→300 speed curve, incremental 0–100 / 100–200 / 200–300, shift 1→2 ... 5→6 RPM/wheel torque/acceleration and genuine small continuous v dip/plateau as forces dictate; old shift can't be replaced by HUD-only speed changes.
- Stage composer true L2 *multi-placement* challenge cores + L3 optional buffers, fewer repeated empty intervals; compare actual sampled C occupancy/gaps vs Seed1 baseline, and 4/6–8/2–3 **distance** shares across 5 Stage seeds.
- Actually drive three full new Stage seeds; inspect start/finish, biome road, real 3D geometry and Pixel/PC/PS4 input, review location export. Build/unit/Playwright and 30/60fps checks.
- Commit LOCAL and create `docs/V0.8.1_HANDOFF.md` with data/videos and exact URL. STOP for human playtest, no automatic next stage or public deploy.

**No push, merge, public deployment, paid services, TopWar/other repo edits, new biomes, 3A planners, huge GUI editors or automatic Stage 02.**

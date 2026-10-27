# Project OutRun

Original browser-based 3D arcade-driving game inspired by the excitement of classic Out Run / OutRun 2, NOT a licensed SEGA recreation. Original/licensed sound, art, vehicle and title required for public distribution.

## ACTIVE: v0.8.1 — Six-Speed Car Feel + More Exciting Procedural Stage 01

**v0.8 human playtest result:** Stage 01 first generated Seed `S01-v0.8-r1-1-ALB1` = **REWORK**, difficulty 2/5, owner comment "Could use more L2 blocks." The Stage generator works structurally and has deterministic seeds/replay, but the actual driving rhythm, straight padding and narrow-road use are not yet good enough.

[Exact owner Stage 01 feedback JSON](docs/reviews/V0.8_STAGE01_SEED1_HUMAN_FEEDBACK.json) · [Measured design postmortem](docs/V0.8_STAGE01_R1_POSTMORTEM.md)

### What failed in first generated Stage

- Eight Stage "beats" were each **one curvature, one elevation, one width** over ~1,450 units; they did NOT faithfully reuse the richer HUMAN-KEEP multi-placement L2 pilot experience.
- Explicit curve-profile windows occupied just **6,143 / 13,500 = 45.5%** of the road; **54.5%** was outside curvature events, with **732–930** world-unit gaps between successive active curves. Not all non-curvature windows are level roads; hills and width can still change.
- Four of eight Width placements targeted `4→2` lane bottlenecks, matching owner's concern about too frequent narrow roads. This is a count of WIDTH EVENTS, not a measurement of actual narrow-distance fraction.
- Vehicle's six-speed "acceleration to 300" appears too LINEAR and shifts show too little actual change in road speed/acceleration. Need proper RPM/gear force, drag and actual integrated shift torque dips; not arbitrary subtraction from the speedometer.

### Current v0.8.1 deliverable

1. **Powertrain:** realistic arcade six-gear tractive effort, nonlinear stronger low-gear vs weaker high-gear acceleration, measurable actual torque interruptions and small natural km/h dips/plateaus during shifts, true attainable 300 and preserved warm audio.
2. **L2/L3 composition:** L2 focuses on ENGAGING driving challenge core (with local multi-curve profiles). L3 designs the overall Stage rhythm and inserts OPTIONAL short buffers/sweeping/reveal/braking approaches between challenge cores where appropriate; NO systematic long straight before/after each L2. Keep nominal 100–150sec first Stage exciting via content rather than filler.
3. **Road width:** mostly 4 real lanes, supporting 6/8 for faster highway, rare 2/3 for bottleneck/mountain exception; count actual sampled widths by traveled distance. Three marked lanes only when real geometry/marking supports them.
4. **Review:** old Seed 1 remains REWORK, new Stage generator version/seed candidates UNREVIEWED; preserve all historical approved BRK and L2 Pilot content and retrospective review history.

### Authoritative docs

| File | Why |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Active Codex scope and safe local source workflow |
| [v0.8.1 Specification](docs/V0.8.1_POWERTRAIN_STAGE_RHYTHM_SPEC.md) | Six-speed torque/RPM + Stage L2/L3 buffering and lane policy |
| [v0.8.1 Acceptance](docs/V0.8.1_ACCEPTANCE.md) | Bench traces, 5-seed Stage statistics, 3 real full recorded drives |
| [Codex v0.8.1 Kickoff](docs/CODEX_V0.8.1_KICKOFF.md) | Next one-shot Goal from latest local v0.8 |
| [Stage 01 Postmortem](docs/V0.8_STAGE01_R1_POSTMORTEM.md) | Objective Seed1 metrics behind redesign |
| [v0.8 Original Stage Specification](docs/V0.8_STAGE_ONE_SPEC.md) | Historical first-stage baseline |

### Source warning & execution

Latest PLAYABLE source is in user LOCAL Windows `C:\astra-dev\OutRun` (reported last v0.8 commit `ee86082`). Remote GitHub `main` is chiefly docs, NOT a replacement source. Do NOT reset/merge/checkout main over playable local game. In existing single Codex OutRun conversation, send ordinary v0.8.1 authorization first if required by old stop-after, then current v0.8.1 `/goal` from kickoff; local branch/commits only, STOP for new human 5-seed driving review.

**Preserve:** Three.js, 1.75× world pace, 300km/h six-speed, grade-aware acceleration/coasting, Arcade Lateral Balance 150/300 sensitivity, 144px compact mobile thumb steering, warm engine and soft squeal, keyboard and user-PASSED PS4 Gamepad, original car/occupants/wheels, 18 L1 geometries and scenery city/coast/canyon, retrospective player praise/issue, same Stage Code deterministic play/replay/new route.

Later only: improved first Stage multi-seed review, longer Guided/Mystery trips, additional traffic/obstacle lanes, new biomes, optional Garage/RPG, Stage Editor if needed.

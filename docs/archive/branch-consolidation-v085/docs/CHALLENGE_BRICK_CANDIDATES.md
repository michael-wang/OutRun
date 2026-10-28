# Challenge Brick candidates — first review batch

**Status:** Original r1 descriptions below. The owner reviewed r1: KEEP 01/02/04/06/07/08; REWORK 03/05, requesting "More radical height delta". Exact feedback is preserved in [the R1 archive](reviews/V0.7A_R1_HUMAN_REVIEWS.json). v0.7A.1 changes road geometry/markings for all eight; their new r2 votes start UNREVIEWED. No revised candidate is human-approved for v0.7B.

A brick is a self-contained **driving moment**, with a clear intended operation, emotion, geometry/visibility constraints and compatible entrance/exit. Difficulty is calibrated using current Arcade Lateral Balance and the currently approved 1.75× pacing. Keep the full run/vehicle controls familiar.

## Initial 8 candidates

| ID | Brief & intended driver action | Emotion / notable view | Calibrated challenge | Natural act | Review hazard |
| --- | --- | --- | --- | --- | --- |
| BRK-01 | **Coastal Panorama Sweeper**: hold throttle on a long readable left or right arc, accurately match ~0.5–0.75 steering | Relaxed speed, broad water vista | Full-speed navigable, enough cumulative heading change to look impressive | Coast | Must NOT unexpectedly require brake because visible bend is misleading |
| BRK-02 | **Double-S Rhythm**: smoothly alternate medium left/right corrections, little dead time, then settle neutral | Rhythmic skill / satisfaction | Approx ±0.5–0.75, safe smooth signed-curvature transitions | Coast or Canyon | No inertial tail or sharp spline snap at S reversal |
| BRK-03 | **Crest & Reveal**: a genuine climb hides a later curving descent, but signs and road visibility give fair warning | Surprise / reward | Safe-to-read medium bend, sufficient response time | Coast or Canyon | Never pair blind crest with surprise extreme brake demand |
| BRK-04 | **Canyon Brake Test**: unmistakably severe corner, full lock at 230 km/h insufficient, early brake makes it passable | Fear → mastery | >1.0 Required Steering at high reference speed, documented safe lower speed | Canyon | Clear brake warning, not a visually shallow unfair corner |
| BRK-05 | **Downhill Acceleration Reward**: broad fast road with meaningful descent and close-range passing scenery | Release / rush | Low-to-moderate turn demand, near-top-speed capable | Canyon→City | Don't let a sudden blind turn erase the reward |
| BRK-06 | **Edge Discipline**: a narrower-looking stretch with manageable bend and nearby cliffs/rails (non-colliding decor first) | Concentration | Moderate Required Steering, generous actual recoverable shoulder | Canyon | Camera/terrain must not hide asphalt; avoid fake collision |
| BRK-07 | **City Boulevard Slalom**: longer streets with a sequence of right/left lane-friendly sweeps (visual streetside props, no real traffic yet) | Rapid urban spectacle | Medium corrections, smooth exits, wide usable road | City | Must feel unlike Double-S via spacing/lookahead/visual context |
| BRK-08 | **Harbor Hairpin & Relief**: shorter high-pressure marked bend followed by fast coastal view | Tension → payoff | Controlled brake-before-entry, then low-demand wide recovery segment | City or Coast | Not all city runs should become mandatory-brake sequences |

These 8 are chosen to exercise **different player actions** (full speed, reversal, sightline, braking, descent, road-width discipline, cadence, challenge/reward). Do not approve eight near-identical curves simply because they look different in 3D.

## Candidate card template

`id/revision: BRK-XX / r1
status: CANDIDATE
title: ...
player_intent: "what the player is expected to do"
emotional_role: "anticipation | skill | danger | release | surprise"
entry: required approach speed and road/grade heading constraints
body: required-steer profile, reference speed, width, elevation, warnings, length
exit: curvature/grade/sightline continuity and recoverability
biomes: supported art/scenery packs
needs_mechanics: features already implemented; no future hazards implied
anti_combinations: adjacent bricks that would create unfair/unpleasant sequences
qa_seed: stable candidate replay seed
automated_checks: fairness, passability, no-seam, visibility, performance
human_vote: KEEP | REWORK | REJECT
human_note: optional
approved_revision: only when explicitly reviewed`

## Approval process

1. Codex makes **one playable preview route per candidate** using stable seed (or an isolated start point). A tiny QA screen can expose **Next / Replay / KEEP / REWORK / REJECT** without building a full editor.
2. Check physically that normal low/mid/high steering, brake when required, bounded off-road recovery and Pixel 8 controls work. A mathematically drivable brick is not necessarily fun.
3. Collect Michael's ratings and small notes. Mark only KEEP as `HUMAN_APPROVED` in the versioned catalog (with a source-readable record). Rejected bricks never enter default journey selection.
4. First milestone aims for roughly **5–6 approved building blocks** from 8; if fewer are fun, make a better batch rather than lower the quality gate.
5. If the approved pool is too small for a varied five-minute trip, use constrained variants (opposite turn direction, different lengths, safe width/grade) and be honest about variety; do not secretly mix rejected bricks.

### User-friendly short evaluation

For each candidate, ask only: **"Was it fun?"**, **"Was the challenge fair/readable?"**, **"Would you like this to recur in a longer trip?"**. A brief optional note is enough; no design-methodology questionnaire.

## Not-yet-implemented obstacle brick family

The user's interest in future obstacles is valid, but a real roadside obstacle or AI car must not be smuggled into the first eight candidates without a known collision/avoidance model.

Future brick types to commission and human-review separately:
- Slow moving traffic with a predictable overtaking corridor;
- Construction cones closing a marked lane, with enough reaction distance;
- Roadside object near-miss (explicitly no unfair spawn on the player's path);
- Reduced grip (rain, gravel, snow/chain equipment) with visible warnings and documented braking effect;
- Rival chase/passing encounter.

Each new mechanic needs its own **safety/solvability test + human approval** before joining the generic generator.

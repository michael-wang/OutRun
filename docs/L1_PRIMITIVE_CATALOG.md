# L1 Primitive Road Profile Catalog — first complete vocabulary (v0.7C)

**Engineering objective:** 18 parameterized L1 profile SHAPES (not 18 fixed roads or 18 separate game modes), assembled with existing human-approved Arcade Lateral Balance and inverse RequiredSteer→curvature. Codex must **audit/reuse** working local v0.7A.1 geometry and helpers before writing new code. No human is asked to drive these L1 units individually.

## Primitive contract

A primitive is a pure, deterministic, finite-distance profile generator:
- `id` / `revision`, parameters and seed (only when randomness is actually needed), `length`, continuous normalized longitudinal coordinate `t∈[0,1]`.
- Exactly one output channel: `turnDemand(t)` / resulting signed curvature, `height(t)` / grade, OR `halfWidth(t)` / lane-count envelope. **One resolved value per channel at each s**. Other two channels remain governed by their own selected primitives.
- Curvature turns are initially specified as signed **RequiredSteering versus reference speed**, then inverted by existing shared handling calibration to actual geometric curvature. C01 is zero demand. Other C types may have multiple signed lobes internally, not conflicting simultaneous curves.
- Elevation profiles return world height with smooth slopes and source-compatible entry/exit. A gradient may be steep and exciting; no new gravity/vehicle dynamics unless an actual bug must be fixed.
- Width profiles return actual paved road geometry and width, coordinated with lane markings, rail/prop offsets and authoritative off-road/shoulder checks. Car-relative dimensions calibrate actual `laneWidth`, not arbitrary world units.
- Parameters such as amplitude, direction, plateau lengths, lane count, transition length and duration are **ranges**, not separate shape IDs. Match to world scale and existing steering levels.
- Prefer existing small typed track segment definition / generator APIs, no abstract node graph, runtime AI, shader rewrite, or giant custom editor. Reuse the visible-band/LOD scenic system.
- Document profile IDs that already exist and need only adapters, versus genuinely new implementations. Machine-test shape behaviors and 3D integration.

## Curvature channel — eight shapes (C01–C08)

| ID | Shape | Minimal semantics / varied parameters |
| --- | --- | --- |
| C01 | Straight | Signed RequiredSteer = 0; length variable. |
| C02 | Sustained constant arc | Smooth transition in/out of plateau demand; left/right sign, 0.25–1.2+ effort and duration. |
| C03 | Tightening corner | Magnitude grows as player advances; strong final apex, left/right, not a sudden kink. |
| C04 | Easing corner | Starts more demanding and relaxes gradually; readable widening visual arc. |
| C05 | Same-direction compound | Two unequal same-sign bends with a soft relaxation/connector between them. |
| C06 | Single S bend | Continuous signed left→right or right→left reversal with zero crossing and no yaw tail. |
| C07 | Repeated reversals | Three or more alternating lobes, variable spacing and intensity; distinct rhythm from C06. |
| C08 | Hairpin / near-U turn | One integrated large direction change with sensible continuous curvature and approach/exit; can be difficult and human-rated Godlike. |

**Do NOT reject C08 or repeated hairpins just for being hard.** A mountain switchback can be valid when vertical layers separate. Only flag unintentionally co-located same-height asphalt overlaps or broken mesh.

## Elevation channel — six shapes (E01–E06)

| ID | Shape | Minimal semantics |
| --- | --- | --- |
| E01 | Flat | Zero grade baseline. |
| E02 | Sustained grade | Climbs OR descends with smooth entry and exit; adjustable grade and net height change. |
| E03 | Ridge / crest | Clear climb → pronounced summit → revealing descent; BRK-03 approved profile a useful reference. |
| E04 | Valley / dip | Descent → lowest point → rising exit, meaningful vertical travel. |
| E05 | Rise–plateau–fall | Distinct climb, sustained high shelf, then descent; adjustable segment proportions. |
| E06 | Rolling hills | Multiple smooth peaks/dips with controllable wavelengths; dramatic if tuned, not tiny decorative sine ripples. |

Avoid fake height changes by moving only the camera or far scenery. World road, vehicle pose, terrain, roadside props and camera elevation should agree.

## Width channel — four shapes (W01–W04)

| ID | Shape | Minimal semantics |
| --- | --- | --- |
| W01 | Constant | Total 2, 4, 6 or 8 marked drivable lanes. |
| W02 | Widening | Actual tapered expansion, e.g. 2→4, 4→6, 6→8; gradual painted lane additions. |
| W03 | Narrowing | Actual tapered reduction, e.g. 8→6, 4→2, with readable advance lead-in. |
| W04 | Bottleneck | Width shrinks and opens again e.g. 4→2→4 or 8→4→8; no auto-centering. |

Use one source for halfRoadWidth(s), road mesh edge coordinates, markings, lane count display, offroad penalty and roadside layout. Width does NOT secretly modify grip or RequiredSteer.

## L3 versus L1

**World/biome and road surface are L3 decisions, NOT unrestricted L1 geometry slots.** Current supported L3 worlds: Azure Coast, Golden Canyon, Sunlit Coastal City, all on current paved physics. L3 chooses allowed art/materials/terrain props, then generators align them to the new L1 road geometry. Later snowy/volcanic ground needs a REAL asset/mechanics pack before appearing as a gameplay choice.

Future local challenge *channels* for physical obstacles and traffic may be added after independent collision/AI capabilities are actually built. Not in v0.7C.

## P0 engineering validation (automatic, not human L1 playtest)

- Sample each of 18 shapes across at least simple + stress parameter cases, positive/negative direction where applicable, with finite values, no discontinuities in road position/heading/slope/width and seeded repeatability.
- Prove 2/4/6/8 drivable widths and offroad thresholds follow the same width profile; non-flat steep slopes create actual elevation.
- For every L1 identify supported parameter limits *from observed actual geometry*, not arbitrary unmeasured numbers.
- A pure L1 PASS means **technically valid shape only**, never "fun" or human-approved.

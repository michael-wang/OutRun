# R5 first map — authored teaching and event director (2026-11)

Status: owner direction translated into an **authoring brief**, not yet
implemented. Does not authorize release to `main`.

## Design rule

Use **progressively legible opportunities**, not written tutorials.
The opening teaches by allowing success. Three concurrent pressures
are deliberately staged: steering complexity, roadside hazards and
civilian traffic density. Do not activate all three at once.

## Lesson arc (order fixed, distances provisional)

| Beat | Road / events | What the player discovers | Acceptance |
| --- | --- | --- | --- |
| A0 | Unobstructed start + long acceleration straight | Gas, shifting, speed and orientation | An inexperienced player can launch confidently; no civilian traffic/obstacles |
| A1 | Large continuous sweeper, no drift required | Smooth steering at speed | Completing at reasonable speed feels comfortable |
| A2 | First visible **civilian** traffic on exit | Watch traffic, choose a passing lane | One or two easy passes, no full-width traffic wall |
| A3 | Banked left-right S-curve | Continuous left/right steering and banking | Clearly perceived body roll, no unavoidable braking |
| A4 | First visible staged multi-car accident beyond S | Read warning/distant wreck, choose an open lane | Multiple cars at varied angles, but obvious safe passage and lead time |
| A5 | First intentional drift corner | Brake/turn/reaccelerate | Forgiving radius, generous exit and recovery |
| A6 | Second drift corner | Apply learned technique with modestly increased demand | Noticeably more technical, still recoverable |

The order and feel are requirements. **Exact metres, seconds and
intensity are not yet requirements.** Pace must be set using actual
high-speed driving and screenshot/video evidence, not a guessed 20%
of 10km.

Racing rivals are active from the starting grid, as today. All
traffic-introduction rules above concern **civilian traffic**.

## After onboarding

- **B: Vista / breath:** hero scenery, spacious visibility and gentle
  turns so the player can enjoy the spectacle without stopping.
- **C: Race pressure:** deliberate rhythm of drifts, overtaking,
  expansion/contraction of lanes, traffic density and longer
  construction closures. Increase **one** source of difficulty at a
  time before deliberately combining them.
- **D: Final sprint:** a last technical gate followed by a clear,
  fast racing finish and visually distinct finish line.

The three bands B/C/D are **experience purposes**, not a mandate to
use a generalized state-machine or procedural road catalog.

## Traffic and accident authoring

The road designer owns **event eligibility windows**. The seeded
traffic/hazard system owns specific actor identity, plausible spacing
and a small bounded variation inside those windows. A reproducible
`stageSeed` and `trafficSeed` make each acceptance replayable.

- A0/A1: zero civilian cars; eight rivals remain in the race.
- A2: very sparse moving civilian cars; don't spawn across all lanes.
- A3: keep lane-changing demands low while introducing S steering.
- A4: begin with a **staged** crash tableau of two or three stationary,
  irregularly angled cars in the roadway, not runtime multi-car crash
  physics. Leave at least one genuinely usable route, and place
  legible visual warning beforehand.
- Later: accident variants, longer lane closures and lane-count
  changes are separate higher-pressure templates.
- New props become real physical obstructions only when the scene is
  prepared. Traffic/rivals must anticipate and avoid stationary
  accident vehicles. Never strand the player on an absent road or
  behind an unavoidable full-width barrier.

No initial requirement for crash cutscenes, emergency personnel,
traffic damage physics or a giant event manager.

## Work in small accepted slices

- **R5a:** whitebox A0, A1, A3 with an A2 civilian traffic introduction.
  Add developer-only markers with exact road metres/lesson IDs to
  make feedback unambiguous.
- **R5b:** add A4 staging and A5/A6 drifting; include safe lanes,
  visibility and traffic avoidance unit tests.
- **R5c:** finish remaining authored driving line and decide where
  hero scenery and deliberate challenge beats live.
- **R5d:** scenery integration, performance, final sprint and end view.

First verify: player sees/understands what to do **from the car**,
not a design spreadsheet or a static Blender view.

Related: `MAP_REMAKE_KICKOFF.md`,
`NEXT_SURFACE_CONTACT.md`, `R5_ART_PIPELINE.md`.

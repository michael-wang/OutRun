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

## R5a code handoff

Current `dev` game build `v0.10.1` implements the road geometry and
bank envelopes of beats A0–A3, with a stage-authored first traffic
schedule and initial crash-free corridor. The new lesson contract
is in `content/stages/coast/onboarding.json` and validated alongside
the road. QA labels with exact metres require `?r5qa=1` in Vite dev.

**Limitations:** Civilian traffic is pre-scheduled in world-space and
moves with race time; the A2 encounter is not yet guaranteed to be
*overtaken* within A2. That timing is a player-test parameter, not a
reason to create an unrelated spawn director. Other sectors of the
10km coastline and scenery remain old placeholders until R5a is
accepted. Multi-car accident and drift teaching await R5b.

## R5a.1 reminder: directed introduction, random racing highway

Only the A2 civilian introduction is paced as a teaching event.
After A3, resume normal reproducible random civilian traffic
(groups, vehicle types, speed and overtakes may vary by trafficSeed).
The stage defines eligibility and difficulty; it does not enumerate
every highway car.

The first sweeper should show visibly banked rivals, but remain
navigable without a forced drift. The longer banked S requires real
successive left/right steering, not a series of almost straight kinks.

## R5a.2 / R5b first drift whitebox (2026-11-13)

This supersedes the numerical R5a/R5a.1 ranges and preliminary
R5b draft above. The lesson sequence is now physically authored:

| Beat | Absolute HUD distance | First playable objective |
| --- | --- | --- |
| A0 | 350–900 | Shorter acceleration; enter race action sooner |
| A1 | 900–1900 | Strongly banked but comfortable sweeper, still no drift |
| A2 | 1900–2700 | One seeded civilian intro; open overtaking room |
| A3 | 2700–4340 | Left 2700–3520, **immediate** right 3520–4340; 13° banks |
| A4 | 4340–5100 (reserved) | **Accident scene not built yet**, future authored hazard |
| A5 | 5100–5640 | First forgiving high-speed drift, demand +0.82 |
| Recovery | 5640–6280 | Clear, long acceleration recovery |
| A6 | 6280–6760 | Harder opposite drift, demand -1.02 |
| Random race | >=7120 | Resume the established seeded-random civilian highway |

The first drift has a generous lead-in/out and an advisory
suggested entry speed of 205 km/h. The second requires earlier
braking and carries a 175 km/h advisory. These are **not**
physics-enforced speed caps, HUD tutorials or claims that every
driver must skid. Driving feedback determines actual difficulty.

The old C02 curve has a 20% cosine entry and exit easing.
An S with separate sweeps therefore feels straight for too
long around the reversal even with zero explicit gap.
For the authored S alone `rampFraction=.08` reduces those
transition shoulders while keeping finite and continuous
steering. The rest of the road preserves the original smooth
C02 easing. Banking is authored by `road.json` envelopes.

R5b includes the **two drift road geometries only** in this
slice. An actual A4 crashed-vehicle tableau, incident warnings,
road closures and any new surface material responses are
separate implementation/acceptance work. This is intentional:
the road/driving line is approved before adding hazards.

Test seeds are reproducible but do not make ordinary highway
traffic static. The first coached civilian introduction is
curated; afterwards random schedule generation and driver AI
remain the same approach as before.

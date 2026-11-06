# Traffic Director R1 — varied, passable, reactive highway encounters

This experimental update lives on `dev`. Scenic road, geometry, weather, background and camera are **unchanged**; vehicle look/outline, collision impacts, smoke, signals and pooling are preserved.

## Goals / driving rules

1. **Replay variability:** Road scenery still uses the stage seed. Traffic has a separate session random seed. Reloading gives a different moving-car lineup and potentially different roadside breakdowns. The ordinary Restart action rerolls moving traffic; previously baked breakdown signs stay aligned until the map is reloaded.
2. **Always a passing opportunity:** An encounter group occupies at most N–1 lanes (four-lane sections retain one lane, five-lane coast retains one lane). New entrants are rejected if they would close the final open lane or spawn inside another vehicle's safety envelope. Active lane changes are vetoed if they would form a local full-width blockade. This does not make traffic disappear after it is already visible.
3. **Reasonable travel speed:** Only a minority of non-stationary vehicles are intentionally slow; cars, trucks and buses still have different cruising speeds. Traffic AI respects a time-headway and closes gradually to the speed of a slower leader.
4. **Basic AI survival:** Cars look up to 300m for slow or stopped leaders, signal early and check adjacent lanes / the player. If passing is unsafe they brake, rather than instantly teleporting backward or rear-ending the stopped car. New high-speed vehicles cannot appear beyond their available stopping distance. A final close-spacing clamp handles large frame-time gaps.
5. **Arcade challenge remains:** The player still gets slow vehicles to overtake, fast pass-by traffic, trucks/buses blocking individual lanes and rare roadside smoke/triangles. No autopilot or forced slowing of the player's car; normal collision mechanics still apply.

## Core code

- `src/traffic-flow.ts`: session seed, reserved-lane planner, spawn gate, predictive following and bounded deceleration.
- `src/traffic.ts`: adopts a per-run schedule, maintains actual car distance/speed and limits repeat impact triggers.
- `src/traffic-lanes.ts`: early obstacle-driven lane changes with turn indicators and lane closure veto.
- `src/breakdowns.ts` and `src/world.ts`: coastal stop sites vary with the same traffic seed as their warning signs.
- `src/runtime-query.ts` and `src/main.ts`: QA URL `?trafficSeed=1234`.

## Acceptance

On `dev`, open any play-test location with a reproducible scenario, e.g.

- `?at=850&trafficSeed=1234`
- `?at=4110&trafficSeed=2026`
- `?at=7600&trafficSeed=8821`

Then replay WITHOUT the `trafficSeed` parameter and confirm the traffic is different while the landscape remains identical. At several speeds overtake moving traffic, check stationary warning triangles and plume, and watch AI cars choose overtaking lanes or brake before a breakdown. If a traffic accident is unrealistic, send `at`, `trafficSeed`, video, and frame state.

CI checks the deterministic planning and key collision invariants; real Pixel 8 10-minute driving/FPS and subjective timing need actual playtest before any `main` release.

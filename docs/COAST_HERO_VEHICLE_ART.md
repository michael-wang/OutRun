# Coastal Highway — Hero Vehicle & Character art track (Priority S)

Status: high-priority art-production track, **not** a request for an automatic wholesale remodel. This runs early and independently of movable scenic-site production.

## Why it outranks ordinary scenery props

The player Riviera 62 and its driver/passenger occupy the chase-camera foreground throughout play; the rival field repeatedly occupies the roadway. Any proportion, shading or animation mismatch is seen hundreds of times more often than a one-off building. Spend most *review attention* on recurrent focal assets, but do not sacrifice the Pixel 8 frame-time budget.

## Style target and identity

- Primary approved reference: `art/reference/coast/03_STYLE_B_coastal_highway.png` (Style Option B). Look for slightly chunkier forms, broad paint highlights, expressive faces, grouped hair and simplified clothing in shared dusk light.
- Existing Riviera 62 stays: distinctive body/roofless silhouette, left-hand drive, small occupants relative to car, red and white paints, FZR-123 plate.
- Driver: young Asian man, layered medium/long dark hair, suit, left hand resting on door where accepted. Passenger: blonde, layered short hairstyle, sleeveless dress. Preserve previously approved design decisions.
- Rivals may be different models/palettes but must share the same tire scale, specular response, clearcoat language, glass, lights and amount of visual simplification.
- Traffic cars should read instantly at speed, with simpler geometry/LODs than the player and important rivals. Do not make them all miniature toys.

## Character art identity — portrait capable / gameplay optimized

Owner requires the driver and passenger to look attractive and expressive **from the front while standing for future photographs**. They also need an economical, upper-body-only representation when driving. This is **one identity and design master per person, with separate portrait/fullbody and optimized driving variants**, not independent lookalikes. The face and grouped hair must survive front/3/4/profile close-ups, not just 200 km/h chase view. The current face primitives in H0 are not photo-ready; minor eyebrow/mouth tweaks are only hypotheses, not final sign-off. First accept a **female face + hair** prototype, then a male head, then optimize race variants; only build full-body figures when a photo scene requires them. Preserve existing pivots, seated gestures, wind hair and mobile performance. Full contract: [Character Master Strategy](COAST_CHARACTER_ASSET_STRATEGY.md).

## H0 — audit first (Julia spec, Codex captures; NO major model changes)

Capture under the SAME existing coast dusk world lighting, chase FOV and camera at:
1. Player's full body and occupants from gameplay rear 3/4, static and moving.
2. Player front 3/4, side silhouette and roofless cockpit close-up.
3. Two rivals directly ahead (near and middle distance), showing paint, wheel animation, tire/smoke state, lights, body highlights and name tags.
4. Player + rival + one traffic car in one image, for proportion/detail matching.
5. Pixel 8 moving visual and baseline frame time if device available.

Compare **silhouettes, proportions, materials, face readability, hair, seat/door contact, tire shape, lights, chrome and shadow grounding**. Report top three actual deficiencies with screenshots and exact camera/seed. Do not ask Codex to speculate and remake every mesh.

Implementation entry points (verified on dev): `src/car.ts` (player and people), `src/rival-view.ts` (rival scene/geometry), `src/hero-*.ts` (player geometry and clothing), `src/traffic.ts` (civilian cars). These implementations are not currently one shared asset pipeline and should not be force-merged merely for style uniformity.

## H1 — hero fidelity pass (one visible concern at a time)

Adjust approved player silhouette/body-to-occupant scale only when an in-game comparison proves it necessary. Prioritize material response and character silhouette before small trim pieces. Keep articulated occupants, camera footprint, paint swapping, brake light, smoke/skid cues and input behavior stable.

## H2 — rivals and traffic family

Improve a single rival archetype to the accepted material/proportion language, then measure and expand to a small family with controlled variation. Avoid multiplying draw calls per rival, per-car unique shader instances or large texture budgets. Traffic uses simplified matching materials.

## H3 — polish and acceptance

Neutral turntable and in-game high-speed review are both required. Verify rear/front/side across dusk, moving camera, opponent proximity and FPS. Track changes to tris, materials, draw calls, geometry memory, texture transfer, animation update cost and shadow passes. Do not release main without owner approval.

## Production ownership

Julia: visual comparisons, art direction, priority and accept/reject criteria. Codex: local captures, mesh/material edits, test/build, GPU profiling. Owner: player-level appearance and handling acceptance. H0/H1 may overlap P1 blockout but **hero polish is a first-class deliverable**, not postponed behind all 14km scenery.

H0 capture set and ranked H1 proposals: [dusk gameplay audit](art-review/h0/README.md).

# Proposed next experiment — L1 stacking, L2 experience bricks, L3 world

**Status: PRODUCT DISCUSSION / PROPOSED ONLY; NO CODEX GOAL AUTHORIZED.**

## Starting point: eight real, owner-accepted L2 bricks

The owner completed second-round v0.7A.1 review on 26 October 2026 and marked **BRK-01..08 revision 2 all KEEP** with autoQA PASS. Preserve the original r1 records (6 KEEP, 2 REWORK) and the r2 export (8 KEEP) as distinct immutable review history. Neither these votes nor automated tests approve any *new combination* without a new player review.

Sources:
- `docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json`
- `docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json`

## Product hypothesis: combine two forms of composition

- **L1 Primitive Profiles** are independent local **road geometry channels**, not whole playable bricks: signed curvature or required-steering profile; elevation/grade profile; paved width/lane-count profile. Each local distance has one resolved effective value per channel. Profile shapes can themselves contain transitions such as S curves, crests, 4→2→4 lane changes.
- **L2 Experience Bricks** are carefully sampled/curated *playable combinations of these L1 profiles*, with an emotional identity, approximate distance and user-supplied KEEP / REWORK / REJECT **plus an optional difficulty classification**. Curated original r2 BRK-01..08 are reference examples; swapping an L1 primitive changes the combination's fingerprint and makes that variant **UNREVIEWED**, even if the parent was KEEP.
- **L3 World / Journey** determines environmental *context and allowed content*: biome(s), ground/road surface, corresponding vegetation/materials/architecture/landmarks and broader journey sequence. Terrain and scenery respond to actual generated road geometry, not independently floating random decoration. A snowy world uses its own surface/props; do not put snow, asphalt, trees, or biome choices into fully unrestricted L1 slots. The same L2 experience can be staged in different world environments where compatible.

This is a *conceptual separation*, not an instruction to build three heavyweight engines or editor interfaces.

### Single world generation pipeline

Given a reproducible seed and simple L3 world constraints:
1. Choose candidate L2 experience recipe and its L1 primitive profiles from allowed content.
2. Merge local curvature/elevation/width profiles at compatible distance anchors. Derive actual 3D road centerline, drivable cross sections and accurate collision bounds from the same values; maintain the accepted Arcade Lateral Balance game model.
3. Generate terrain conforming to the road and L3's biome (cliffs/valleys/coastal ground/street terrain) without road-intersecting geometry.
4. Place roadside scenery using deterministic seeded placement in near/mid/far visual layers, according to L3 world and optional L2 *scenic intent* such as “open vista after crest.” A unique sub-seed per subsystem prevents moving one tree from changing road curvature.
5. Apply a **minimal structural check**: no broken road mesh, unintentional road self-overlap at same altitude, unintentional terrain/building collision with asphalt/camera path, basic geometric/surface continuity. Do not impose speculative high-end “fun,” braking-time, visibility and challenge-difficulty constraints that replace human feedback.
6. Hand a small sample of genuinely playable variants to the owner. Owner decides fun AND difficulty; a hard or surprising corner is not inherently invalid.

**Geometry note:** Hairpins/switchbacks are not automatically bad. Two or more consecutive hairpins may form a sensible mountain switchback, especially when separated in height. Reject only actual unintended overlaps/implausible level crossings or visually nonsensical geometry, not every complex road.

## Minimal experiment (suggested, not approved)

Re-use THREE existing accepted L2 identities:
- BRK-01: visually spectacular full-speed sweeper.
- BRK-03: big ridge climb/crest/landscape reveal.
- BRK-06: variable-width edge discipline.

Create **2–3 new L1-stack variations PER brick** (roughly 6–9 playable samples total) by swapping exactly one or two geometry channels, *not by rebuilding all eight original bricks or shipping an editor*. Keep clear authoring labels: parent BRK ID/r2 reference + variant ID/seed + curvature/elevation/width profile IDs. Avoid having every variation differ only in color.

Use current supported coast/canyon/city environments; test world-specific terrain/props responding to changing road widths/heights with a tiny number of hand-placed landmarks and deterministic procedural near props. No newly invented snow/volcano world until real asset packs exist.

Owner's short evaluation: **KEEP / REWORK / REJECT; perceived difficulty (Easy / Medium / Hard / Godlike or 1–5)** plus optional note. Numeric difficulty is descriptive player feedback, not an excuse to build an elaborate preemptive feasibility solver.

### What would count as GO?

- Geometry/terrain/scenery do not break across swaps and can reproduce the exact variant with a stable seed + content versions.
- Three original approved r2 bricks remain playable unchanged, and generated variants have their own unreviewed state.
- The owner actually sees and feels differences from curvature/elevation/width STACKING, not merely different order of complete bricks.
- Some new combinations are fun enough to KEEP; some may be too hard or strange, and their human feedback shapes future recipes.

**NO-GO:** different compositions feel mechanically identical; geometry and scenery contradict road profiles; human reviews are fabricated, overwritten or inherited without consent.

## Scope safeguard

This proposed spike does NOT include a 5-minute v0.7B Pacific Road Trip yet, Mystery Drive, a full Stage Composer, AI live content generation, garage/currency, roads with physical obstacle collision, rival cars, new weather/snow/volcano, or a heavyweight constraint/optimization system. When the user commissions a milestone, specify a small playable handoff and normal-chat authorization first, then Codex implements/tests/commits locally.

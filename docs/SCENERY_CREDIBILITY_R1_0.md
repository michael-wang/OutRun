# Scenery Credibility R1.0 — believable city corridors and grounded horizons

## Observed problems
In r7/r8, ordinary city buildings were authored only at positive (right-hand)
road offsets (32–220m). The left road terrain always used a coastal cliff down
to the fixed sea level, regardless of the city biome. The right terrain stopped
at 160m even though distant buildings could stand 220m away. Distant canyon
mesas were also generated beyond the terrain ribbon. This created one-sided
cities and floating objects.

## R1.0 design
- Keep roads, steering, road streaming, PS4/touch input, existing assets and
  landmark rendering. No independent geometry or landscape engine.
- Compose 32 immutable route-local cross-sections from the already authored
  R1 trip beats: **urban-both**, **urban-hillside**, **waterfront-left**,
  **waterfront-right**, coastal-left and canyon.
- Most city beats become a two-sided urban corridor. Waterfront exceptions
  remain intentional scenic contrasts, not a universal left-ocean rule.
- The exact same section inventory is used by Worker terrain, Worker scenery
  props and the opt-in Scene Inspector. Transitions ease over 360m around
  section boundaries to avoid sudden terrain discontinuities.
- A shared ground elevation function interpolates the actual curved/banked
  road surface with the same physical shoulder offsets for building anchors
  and road ribbons. Left-city surfaces replace the coastal cliff; right-sea
  sections descend to ocean level. Ground beyond the original 160m ribbons
  extends out to 450m to support far skyline blocks and canyon mesas.
- Buildings gain short buried plinths to cover local uneven ground.
  Left city has a near street-wall row (60m cadence) and sparse rear skyline
  (120m cadence). Waterfront cliffs receive no floating city row.
- Keep historical r1–r8 generated roads, scenery, fingerprints and seeds
  replayable via `?revision=r7` or `?revision=r8`. R1.0 is **v0.9-r9** with
  new section metadata and its own content fingerprint.
- Restrict extra detail to existing geometry/instance materials and worker
  batches; nothing is generated per frame.

## QA
Use `?qa=1&seed=1` (r9) and select **場景橫斷面 (32)** to see the left/right
roles. Inspect urban-both, hillsides and both seafront directions; verify
that the ground below skyline buildings and mesas is physically continuous.
Use `?qa=1&seed=1&revision=r7` for the unchanged prior version.

## Acceptance
Build, unit, Scene Inspector browser test, deterministic cross-sections and
mesh/prop grounding tests, chunk seam equality, and Seeds 1/2/7.
Physical-device beauty/playability remains a separate human acceptance.

### Sharp-turn terrain safety
Far scenic shelves span up to 450m from the road only on gentle curves and
straights. The same curvature-dependent reach (minimum 160m) is applied to
both Worker terrain ribbons and distant prop placement, to keep the wider
urban surface from wrapping through tight switchbacks. The original 160m
near-terrain and drivable road remain unchanged.

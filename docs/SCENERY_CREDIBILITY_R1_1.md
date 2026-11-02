# Scenery Credibility R1.1 — enclosed, low-grade city streets

## Human feedback
The R1.0 screenshot review showed visibly asymmetric density, repeated
one-sided city sections, and floating/mirage-like distant skyline bands.
R1.0's street generation used thin 7–13m buildings on the right every 30m,
versus thin buildings on the left every 60m. It also let 1/3 of city beats
discard a whole side as seafront, and r7 elevation still gave city hills.

## R1.1 implementation (new `v0.9-r10` route revision)
- Reuses r9 seed, curvature, width, lane interchange, bank features and road
  intensity. Archives r9 at `?revision=r9` and r8 at `?revision=r8`.
- Reduces only CITY beat elevation amplitude to **<=3.5m**, preserving the
  baseline height and continuity of E03/E04/E05 profiles. Coast/canyon
  elevation, physics, speed and steering are untouched.
- All city beats are now enclosed `urban-both`, with occasional
  `urban-hillside`; coasts still supply open water scenery. No automatic
  one-sided city core or lonely waterfront blocks.
- Builds near street-wall blocks on both sides at comparable, staggered
  ~45m cadence. Uses wider 22–31m facades and simple storefront/window
  details, then sparse medium-depth rows 90–120m from the road.
- Caps city skyline depth; removes R1.0's isolated 140–220m tall buildings
  in r10 city sections. Uses existing instanced box geometry/materials.
- Shared terrain mesh/prop ground sampling gains an R1.1 `urbanCore`
  profile that keeps outer city ground close to the flatter road rather than
  falling steeply toward a desert-like sea-level horizon. Section transitions
  remain 180m eased on either side.
- No new camera, lighting, shader, Worker protocol, drawing loop or per-frame
  world geometry. Both sides obey existing road-clearance and interchange
  checks. The cliff/canyon/coast and historical r9 scenery paths are retained.

## QA
Use `?qa=1&seed=1` and **場景橫斷面**. Compare identical seed and distance
using `?qa=1&seed=1&revision=r9`. Review mid-city curves and the next
approaching city straight, with special attention to both horizons and side
building density. Pixel 8 physical-device performance and visual quality
must still be accepted by the owner.

## Automated evidence
Assert historical r9 fingerprint/geometry remain unchanged, city-only grade
cap and finite terrain, balanced building counts, view-side symmetry, far
land support, turn clearance and the standard streaming/UI CI smoke.

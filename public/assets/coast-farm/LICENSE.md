# Coastal farm assets

The following downloaded models are offered under **CC0 1.0 Universal**:
https://creativecommons.org/publicdomain/zero/1.0/

- Rice Mature (Cozy Farm and Homestead), contributor 3D Assets:
  https://3dassets.dev/assets/cozy-farm-and-homestead-rice-mature-28d8a6a5
  Original: `rice-original.glb`. Derived: `rice-near.glb`, `rice-mid.glb`.
- Scarecrow (Medieval MMO Starter Realm), contributor 3D Assets:
  https://3dassets.dev/assets/medieval-mmo-starter-realm-scarecrow-64081717
  Original, unmodified: `scarecrow.glb`.

API metadata including the license declarations is preserved in
`rice-source.json` and `scarecrow-source.json`. Both source pages identify these
models as AI generated. OutRun downloads the supplied GLBs; it does not generate
replacement models. The rice derivatives are offline reductions of the source
geometry using Three.js ConvexGeometry and SimplifyModifier: connected source
stalks identify each ear, overlapping envelopes preserve its grain volume, and
two transformed plants form the near clump. The soil pedestal is omitted.
Material colors are baked into merged draws with height UVs for the upstream
wind shader. Originals and their hashes remain unchanged. See the preparation script
and `simplification.json`.

Vegetation code and generated Wildflowers flower masks are from three-stylized,
MIT, copyright (c) 2026 Steve245270533. Its full MIT license and pinned upstream
revision are preserved in `src/vendor/three-stylized/`. Third-party notices are
also served in `THREE-STYLIZED-LICENSE.txt` beside these models.

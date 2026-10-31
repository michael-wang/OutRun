# Frozen S1 correctness oracle

These four modules are copied from commit `1457b3d984bcc4e58312481302027d8375918faa`. Only relative imports were redirected and the provenance comment was added. They are test fixtures, never imported by production code.

- `pilot-composer-original.ts`: original full-scan sampler and track construction.
- `road-worker-original.ts`: identical Worker request/preparation path with the original composer.
- `trip-original.ts` / `stage-one-original.ts`: verify recipe objects, bank features, codes and fingerprints against original generation.

`profile-index.unit.ts` compares exact numbers (`Object.is`) and active placement identities across full routes and boundaries. `profile-index.spec.ts` runs paired original/current Workers in one isolated browser context, compares all road and roadside buffer bytes, and records SHA-256 evidence. Neither rounded coordinate hashes nor screenshot similarity are used as equivalence criteria. Both Worker versions use the same unchanged road/scenery/Three.js dependencies.

Do not casually update the oracle to match changed output; regenerate from an explicitly approved reference commit and document the reason.

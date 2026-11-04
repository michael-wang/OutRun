# three-stylized vegetation modules

Vendored from https://github.com/Steve245270533/three-stylized at
`8eb0dde5a8e7eae985d69f923b627b0cf253bed5` (MIT, see LICENSE).
Only `src/grass` is included; no demo, UI, framework, or renderer.

OutRun uses Grass with external terrain surfaces and coverage sampling, its
instanced blades, Wildflowers and wind shader chunks. Terrain.ts is a transitive
facade dependency; its terrain generator is never invoked by OutRun.
Application-specific fog, distance thinning, field palettes and culling live in
`src/coast-farm.ts`; the upstream modules remain unchanged.

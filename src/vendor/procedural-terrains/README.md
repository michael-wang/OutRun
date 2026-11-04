Vendored unchanged `cpuNoise.js` from [ZyFou/ProceduralTerrains](https://github.com/ZyFou/ProceduralTerrains/blob/main/src/engine/terrain/noise/cpuNoise.js).

Upstream Git blob: `0af63ef50abafc128c1dc897fd604d03c364f530` (retrieved 2026-11-04). MIT license retained alongside the source. `cpuNoise.d.ts` is the local declaration for the subset used by OutRun.

`src/coast-terrain.ts` uses the upstream rotated-domain FBM and erosion/warp-aware ridged noise to shape two inland hill layers. OutRun supplies road clearance and district envelopes. The height field is sampled into existing worker-generated terrain ribbons; neither the editor nor its GPU terrain shading, clouds, water, shadows or post-processing is included. Vegetation roots intersect the same rendered triangles.

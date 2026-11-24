# ADR-009 — finite stages and bounded scene resources

**Status:** accepted. Supersedes obsolete infinite/unbounded journey specifications.

1. Courses are authored, **finite** pieces of gameplay; each has a known road extent and bounded asset budget. No infinite procedural racing requirement.
2. Logical road data is the shared truth for rendering, collision, player controls, rivals and roadside placement. Chunk generation/streaming is merely an implementation detail, not an alternate road model.
3. Road safety comes before optional scenery. If the drivable road is unavailable, stop safely and show loading feedback; never simulate driving on a missing surface.
4. Road and scenery can be prepared in Worker/build time and materialized incrementally. Reuse instanced geometries, textures and shader variants. Avoid long main-thread jobs that freeze driving.
5. Keep explicit stage/chunk ownership and release retired GPU buffers/materials correctly; share reused resources without double-dispose. Retain safe overlaps where a transition is actually required.
6. Keep approved gold rice fields, sunset coast, and Ultra Water until the owner wants a change. Physical device FPS evidence is useful, but **not** a mandatory release gate for every object. Surface serious regressions as P1.
7. Prefer hand-authored road and hero scenery, data-described placements, then small deterministic filler. No speculative scenery generator or emotional director in production.

Legacy P0/P1/P2 streaming implementation roadmaps and measurements were historical experiments, not current work orders. Recover them from Git history only when needed.

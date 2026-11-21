# ADR-010 — Authoring data is not the runtime storage format

**Status:** design constraint adopted; custom binary encoding deferred.
**Date:** 2026-11-12

## Decision

- Readable JSON is not a long-term requirement. Authors, AI agents and editing
  tools need accurate, efficient access to semantic stage data—not a pretty
  text file. JSON is currently a convenient small-scope interchange only.
- A 10km road populated with many thousands of objects cannot be evaluated
  using today's one-house `scene.json` size. Judge formats at *representative
  full-stage density*, including edits and streaming.
- Keep a versioned semantic contract for finite road geometry, placement
  records, asset references and effects, independent of their file encoding.
- Tool/AI access should be **range- and category-selective** (e.g. scenery
  within 1000–1200m), ideally indexed or queryable. Merely switching to a
  binary file does not reduce model context tokens if an agent still has to
  expand and read the whole stage.
- Existing GLB/glTF handles mesh/material payloads. For dense numeric samples,
  prefer TypedArray/binary chunks built offline from source content, rather
  than inventing a unique binary specification prematurely.
- Profile on a **fully populated** stage and Pixel 8: compressed download,
  parse/decode and Worker init/clone time, temporary and retained heap,
  GPU buffers, incremental chunk load and frame stalls. Select chunk sizes
  and binary encoding based on observed bottlenecks.
- Runtime chunks must have bounded ownership, safe cancellation/disposal,
  and the same never-drive-on-missing-road rule as ADR-009.

## Current work

R2e sends an ID for the coastal Worker stage rather than structured-cloning
the bulky legacy Trip/Pilot compatibility object. The Worker resolves the
same versioned source locally. This is an incremental transport improvement,
not evidence that the long-term stage format has been decided.

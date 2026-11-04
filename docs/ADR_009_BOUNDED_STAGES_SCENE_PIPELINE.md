# ADR-009 — Bounded Stage Resources and Scene Resource Pipeline

**Status: ACCEPTED — 2026-11-05**  
**Decision owner:** OutRun / 極速漫遊 product direction  
**Implementation:** incremental, starting on `dev` with R9.0 P0. This ADR is authoritative for future Codex changes; do not silently revive a never-ending route/world streaming objective.

## Product design decision (non-negotiable)

**極速漫遊 uses finite, individually designed stages with bounded resource requirements, NOT an infinite road or infinite world.**

A stage owns a known route, scenery recipe, required geometry, textures, shaders, traffic, and a declared resource budget. Part of **level design** is composing an engaging scene **within those limits**. A scenic idea is not accepted merely because the engine can generate it: it must fit the stage's performance and resource envelope, especially Pixel 8.

Between completed stages there is an intentional **transition/buffer segment** (OutRun-inspired) which masks visible handoff and provides time to retire the previous stage's resources and prepare the next stage's. For a finite journey, pre-authoring / build-time baking is encouraged when it improves launch or mid-drive stability. Runtime streaming within a stage is still allowed to limit memory, but it is **bounded by stage scope**, not designed for an unbounded future.

A transition must be visually persuasive **from the driver's view**, without spending on perfect invisible off-screen geography. No need to perfectly preserve terrain beyond view. If next-stage essentials are unavailable, use the existing explicit safe hold/prepare behavior; **never drive into missing road**.

### Lifetime / budgeting contract

- State progression: `STAGE_ACTIVE(N)` → `TRANSITION(N→N+1)` → `STAGE_ACTIVE(N+1)`.
- In the buffer: decouple previous-stage retirement from next-stage preparation. Retire only after the last required visual/physical elements have left view; load the next stage's **drivable road first**, then essential scenery, then optional decoration. Use occlusion/direction changes where useful.
- The transition can temporarily require both stages' **minimal** assets, but must not exceed a measured **transition peak budget**. Explicitly audit overlap; do not assume two full high-detail stages fit.
- Resources are classified: **stage-local** (geometry, per-stage instances, textures unique to the stage), **shared across the journey** (common vehicle, materials, repeatable assets, shader variants), **transition-only** (covers/props), and **retired**.
- Dispose stage-local GPU buffers, instances, textures and JS references once safe; retain/reuse shared assets with clear ownership. Avoid double-dispose and leaking references. Measure resource counts and release latency across restart/replay.
- Stage-specific caps shall cover at minimum: CPU preparation milliseconds per frame and worst single task, draw calls, triangles, GPU texture/geometry count or memory estimate, concurrent loaded scenery chunks, and shader/texture prewarm workload. **Initial numeric caps are hypotheses, set only after physical Pixel 8 measurements, not invented performance guarantees.**
- Each stage handoff has acceptance tests: playability, no missing road, no severe pop-in, resource-peak bounds, no catastrophic long frames, no leak over repeated stage transitions/restarts.

## Scene Resource Pipeline — common 3D resource contracts

These are *engine-level* concerns. Avoid 'special case per meadow' optimizations as the permanent architecture.

1. **Prepare (Worker or build time):** Pure deterministic numerical generation, sampling, instance transform/color buffers, static topology. Input `stageId,chunkId,seed,recipe`; output typed, versioned data with ownership and bounds. Avoid Three.js scene objects or WebGL work here. For fixed hero stages, bake data to reusable assets where useful.
2. **Materialize (main thread):** Reuse canonical `BufferGeometry`, `Material`, `Texture`, shader variants and base meshes. Only allocate per-chunk buffers/instance transforms that are genuinely unique. A collection of 10,000 flowers should not require 10,000 JS `Mesh` objects.
3. **GPU readiness:** Compile by *shader/material variant* and prewarm necessary buffers/textures before first visible use. Track CPU submit time separately from GPU completion. Do not prewarm many km of resources merely to lift the first startup gate.
4. **Schedule:** Separate road-safety priority from scenery desirability, drive jobs from estimated visibility/time-to-need, and honor a per-frame CPU budget. A 3ms while-loop is a **soft** budget; a synchronous 30ms task **must be split or moved off the main thread**. No speculative huge refactor without a measured task trace.
5. **Render:** Per-chunk/frustum culling, instancing, sharing, distance LOD, opaque textured surfaces for far dense fields. Optimize both JS/driver costs and GPU work; note that without disjoint GPU timer support, CPU wall time is not true GPU elapsed time.
6. **Lifecycle:** Bounded stage ownership, incremental disposal, zero dangling GPU/JS resources after transitions/replay.

### Two workloads must not be confused

- **Spike/jank:** Initial stage preparation or a single oversized main-thread task when a new chunk enters the working set. Pixel 8 trace: ~2,205m, 20.7 FPS, ~24.2ms *average* `world.update()` per frame while a 7km scenery chunk appears. Exact offending task not yet attributed.
- **Sustained load:** Already visible dense scenery, for example initial flower fields ~37 FPS vs rice ~50 FPS in one November 2026 drive; CPU render time increases, but the device reported `gpuTimerSupported=false`. No claim of GPU causality without further evidence.

Do **not** reduce the accepted R8.8 golden rice-sea look as a blind mitigation for the first issue.

## Three incremental work packages

### P0 — Universal task attribution and oversized-work elimination (FIRST)

- Add lightweight opt-in **per scheduled task** telemetry to the existing streaming queue: kind, chunk, wall-clock ms, player distance, peak and >budget counts, worst spikes. Surface it in `?fpsdiag=1` JSON. Group tasks by generic operations (`geometry`, `instances`, `field-construction`, `retirement`) and identify the real culprit before splitting it.
- Hold current 5km road safety behavior constant; no art, vehicle, ocean, or GPU-quality changes.
- Next change after actual Pixel 8 task trace: migrate pure heavy preparation to Worker/build time or split long tasks into cancellable stages. Do not pretend the existing `pump()` 3ms loop can interrupt an expensive callback.
- Gate: sustained rice appearance unchanged; eliminate 50–100ms **CPU-driven** long frames around ~2.2km without moving the stall to the first visible field.

### P1 — Stage-scoped streaming priorities, separately for road and scenery

- Keep **road safety headroom** long enough for 300km/h and Worker response jitter. Treat scenic distance as a separate bound, initially experiment around camera far plane (mobile currently ~1,400m) plus measured preparation margin, not a universal 5km.
- Keep genuinely distant sky, mountains and hero landmarks as special *cheap low-detail distance assets*. Maintain scenery no-pop-in. Do not defer essentials past the last safe point.
- Admit scenic task jobs based on distance/time-to-visibility, bounded per-frame work; no far future chunk stealing time from current driving.
- Gate: no missing road; normal driving at up to 300km/h with no new scenery pop-in and reduced spikes. At end of 10km route no infinite prefetch takes place.

### P2 — Shared asset resources + Hybrid Flower Sea (after P0/P1 evidence)

- Reuse geometry, materials, Shader programs, flower silhouette atlases, seed/baked instance layouts across stage chunks. Keep field-specific transforms as per-chunk buffers.
- Hybrid floral fields: colorful low-cost distant canopy, medium clumps, only essential nearby 3D flowers, coherent soft wind. Preserve clearly readable multicolored blooms rather than flat colored slabs.
- Validate in Pixel 8 with matched drive, draw/tri count, resource peaks, CPU frame time and **actual visible aesthetics**. Acceptance must be both beauty and performance.

## Current source of truth and constraints

- `src/coast-ultra-stage.ts`: finite **10,000m** stage.
- `src/streamed-scene.ts`: currently 1km chunks, 5km `ahead`, 1km `behind`, a soft 3ms commit-loop budget, Worker road/scenery geometry preparation. P0 instruments this existing queue.
- `src/coast-farm.ts`: a single synchronous `createFarmPlot()` call can still exceed the soft budget. New task measurements must prove its actual cost.
- `src/drive-fps-diagnostics.ts`: opt-in driving telemetry; keep on by URL only for diagnosis. `src/startup-diagnostics.ts` remains for first load.
- `main` stays the accepted R8.8 family playtest until performance and QA on `dev` pass.

### Definition of done for full architecture

Finite stage resource budgets are authorable and checked; a stage loads and unloads deterministically; transition buffer safely bridges stages within a bounded temporary resource peak; long CPU tasks cannot monopolize game frames; assets are shared where possible; GPU preparedness is scheduled before need rather than before launch; Pixel 8 playthrough and repeated restart/transition prove stability. **Not** a mandate to write all systems at once.

## Change control

This ADR records the user's explicit product decision. Future Codex tasks may evolve the architecture, but a return to an "infinite road requiring unbounded assets" must be raised as a new product decision first.

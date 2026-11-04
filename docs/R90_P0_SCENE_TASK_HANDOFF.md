# R9.0 P0 — Scene Task Attribution (FIRST INCREMENT)

**Status: INSTRUMENTED ON `dev`; awaiting real Pixel 8 trace and build/test execution.**  
**Design authority:** [ADR-009 — bounded stages and Scene Resource Pipeline](ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).  
**Public `main`:** remains the human-approved R8.8 family playtest; no public deploy authorized for P0.  
**Rollback checkpoint:** `checkpoint/r90-before-scene-pipeline` at `5a43c2770dfef5fe4bb854087a56f975bbcd6024`.

## Why this first step

Nov 4 Pixel 8 `?fpsdiag=1` drive showed ~20.69 FPS at 2,205m while average `world.update()` CPU cost spiked to ~24.2ms/frame. At 2,281m FPS recovered to ~52.3; inside 2,400–3,000m golden rice fields the run averaged ~49.6 FPS. A simultaneous farm count increase from 79 to 91 suggests Chunk 7 scenery preparation, but the previous trace did not identify **which synchronous main-thread task** was responsible. The existing `StreamedScene.pump()` soft 3ms budget checks only **between** tasks: a single blocking `createFarmPlot()` cannot be preempted mid-call.

**P0 does not yet claim to remove this stutter.** First attribute its exact source, then split/Worker-offload the offending step without changing visual fidelity.

## Implemented in this commit series

- New reusable `SceneTaskProfiler` in `src/scene-task-profiler.ts`, opt-in via existing `?fpsdiag=1` or `?streamdiag=1` only.
- `StreamedScene` now classifies existing work into:
  - `road-geometry`, `roadside-instances`, `road-annotation`
  - `scenery-geometry`, `scenery-instances`, `scenery-field` (includes flower/rice construction)
  - `ready-marker`
  - `retire-field`, `retire-instances`, `retire-geometry`
  - `queue-sort` and `pump-overhead` (distinguish scene generation from work-queue processing)
- For each type, record number of tasks, total CPU wall time, mean, worst, recent P95 and >3ms, >16.7ms, >33.3ms, >50ms counts.
- Keep up to 96 recent tasks exceeding 8ms, including chunk, duration, current player distance, outstanding count and `performance.now()` timestamp.
- `?fpsdiag=1` JSON every second includes `extras.streamer.taskProfile` and `lastSlowTasks` (latest 3, so file remains bounded). There are no automatic console logs for every oversized task.
- Existing ~3ms scheduler budget, Worker dispatch, road coverage, startup gate and water/rice/flower graphics **are intentionally unchanged**.

## Device test and next decision

1. In local repo, synchronize `dev` and execute `npm run build`, `npm test` (plus relevant physical Pixel 8 checks). See below: GitHub-only edits are not proof that tests passed.
2. Pixel 8 Chrome on the same LAN: `/?fpsdiag=1`, version `v0.9-coast-r9.0-p0`.
3. Drive from the starting coast past ~2,500m and optionally into the flowers, without pausing or backgrounding. Export FPS JSON **after** the 2,100–2,300m frame-rate cliff.
4. Find the first `seconds[]` row at 2,100–2,300m; inspect `extras.streamer.taskProfile.byKind` and `lastSlowTasks`. Compare to adjacent seconds to see which category increments its >16 / >33ms counts.
5. If `scenery-field` Chunk 7 contains repeated large tasks, split its pure CPU work into Worker/prebaked data and low-cost main-thread commits. If another type is worst, fix that *generic pipeline stage* rather than specializing rice/flowers.
6. Maintain the existing 5km road safety prefetch. Later **P1** separately scopes scenic prefetch and priority; **P2** shares assets and converts flower fields to a hybrid renderer only after P0/P1 measurements.

## Acceptance for next P0 implementation (not yet met)

- No repeated >50ms callback events due to Chunk 7 at ~2.1–2.3km under comparable Pixel 8 conditions.
- No new missing road or field pop-in, no degradation of the accepted R8.8 golden rice.
- Measured reduction in worst task CPU time, not simply reduced draw calls or a shifted stutter.
- No uncontrolled extra background CPU/heap/GPU memory accumulation, including stage handoffs/restarts.

## Rollback and historical constraints

Current `dev` is an additive, opt-in profiling change with no scene schedule or visual edits. `main` is untouched. Use the checkpoint commit as a comparison baseline. If the P0 instrumentation itself harms performance, open normal Git revert commits; no force-push needed. Checkpoint branch is a temporary safety anchor, not a new permanent development branch.

## Roadmap

- **P0a:** task-type attribution (THIS INCREMENT).
- **P0b:** targeted split or Worker-side preparation of whichever oversized primitive is proven responsible; replay profiling.
- **P1:** decouple bounded scenery visibility window from road safety window; author low-cost distance assets.
- **P2:** shared asset pool and flower-field hybrid approach, plus explicit per-stage and handoff resource budgets.

Do not silently broaden this into an infinite road/world or an all-at-once engine replacement.

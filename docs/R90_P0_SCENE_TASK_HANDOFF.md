# R9.0 P0 — Scene Task Attribution (FIRST INCREMENT)

**Status: INSTRUMENTED ON `dev`; awaiting real Pixel 8 trace and build/test execution.**  
**Design authority:** [ADR-009 — bounded stages and Scene Resource Pipeline](ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).  
**Public `main`:** remains the human-approved R8.8 family playtest; no public deploy authorized for P0.  
**Rollback checkpoint:** `checkpoint/r90-before-scene-pipeline` at `5a43c2770dfef5fe4bb854087a56f975bbcd6024`.

> **2026-11-05 P0a evidence and P0b first experiment (dev):** The real Pixel 8 log `outrun-fps-2026-11-04T18-30-46.957Z.json` confirms `scenery-field` is the expensive synchronous class. New experiment shares the flower mask atlas and records plot subtypes; **no post-change Pixel 8 evidence yet**. `main` remains unchanged. See the update below.

## P0b-1 Pixel 8 follow-up — 2026-11-05, 10.41km driven

**Result: ACCEPT the reference-counted shared flower atlas as a resource-lifecycle improvement; DO NOT mark the main-thread field stutter fixed.** The physical Pixel 8 trace is `outrun-fps-2026-11-04T18-46-07.787Z.json`, ~82.5s of gameplay and 10.41km traveled. It is a single A/B run, subject to device variance; comparison uses only the shared 0–4.5km distance.

| Measure | P0a baseline (4.52km run) | P0b-1 new (10.41km run) |
| --- | ---: | ---: |
| Matched 0–4.5km mean per-second FPS | 46.81 | 47.43 |
| Main rice 2.4–3.0km mean FPS | 49.91 | 52.06 |
| Main flowers 3.1–3.6km mean FPS | 42.72 | 43.39 |
| Main flowers minimum per-second FPS | 37.46 | 41.42 |
| Main flowers mean main-scene CPU ms/frame | 11.82 | 11.20 |
| 91 field tasks cumulative CPU | 3413.4ms | 3333.6ms |
| Worst field task | 100.7ms | 87.6ms |
| Field tasks above 50ms (same 91 plots) | 13 | 14 |
| Loaded renderer texture count at ~3.2km | 72 | 43 |
| Shared flower-mask atlases (new only) | not tracked | 1 (reference-counted) |

At ~400m, 454m, 1152m and 2215m the **new trace has four per-second samples below 30 FPS** (17.63, 20.37, 27.57, 24.81 respectively), all coincident with field construction for distant chunks. The baseline had two below-30 samples at matched 0–4.5km. The user felt a significant improvement in the first half, but the instrumented 0–4.5km mean gain is only 0.62 FPS, and the very short streaming cliffs still occur. The new 1.15km spike reveals Plot 76/77/78 (flowers, Chunk 6), including a **87.6ms** synchronous plot; at 2.215km several Chunk 7 flower plots remain >45ms. Rice plots average ~34.3ms, flowers ~39.6ms over 91 plots, so material pooling alone is not enough.

On the additional unobserved baseline distance **4.5–10.41km**, 42 one-second samples average **44.85 FPS**, minimum **36.86 FPS** (at ~6765m), and **zero frame gaps >50ms**. The `scenery-field` task count stays at 91 from ~2.3km onward. At 6.7–7.0km `world` averages ~0.33–0.42ms while `mainScene` is ~12.7–13.2ms, identifying *steady draw/render load* (P2 concern), not streaming creation (P0 concern).

Reference-counted mask ownership falls with live flower fields: 31 owners at ~2.3km (30 flower masks + one stage pin) to 16 around 5km, 7 around 8km, and **1 at 9km with zero farm plots** (the intentionally pinned stage atlas); no evidence of owner accumulation during this drive. Only a restart/stage transition can verify the final pin is released.

**Next recommendation — P0b-2:** preserve the accepted visual geometry and field densities, but eliminate the per-plot non-preemptible 30–88ms `createFarmPlot()` synchronous task. Provide reusable prepare/commit primitives: deterministic sampling / vegetation matrix calculation in Worker or stage-baked resource data; main thread does bounded upload/object attachment. Keep `plot.kind`, `plot.id` telemetry and measure no >16.7ms plot callback; do not merely reschedule the same 88ms callback to another kilometer. This needs independent code/build/device validation before P1. Treat P2 flower steady ~40–43 FPS as a separate rendering optimization.

---

## P0a field evidence — confirmed by physical Pixel 8

The ~42-second exported driving trace reached 4.52km and captured three recurring streaming cliffs.

| Driver position | Recorded FPS | World CPU average/frame | Expensive background work |
| --- | ---: | ---: | --- |
| ~407m | 15.67 | 32.08ms | Initial chunks 4/5 being materialized |
| ~451m | **24.67** | 12.54ms | Farm construction for Chunk 5 |
| ~1,102m | 38.19 | 5.31ms | Farm construction for Chunk 6 |
| ~1,176m | 33.52 | 8.97ms | Farm construction for Chunk 6 |
| ~2,209m | **30.53** | 11.07ms | Farm construction for Chunk 7 |
| ~2,456m (rice) | 54.22 | 0.40ms | Queue empty, no field construction |
| ~3,218m (flowers) | 37.46 | 1.25ms | No synchronous field-creation spike |

Near 2,330m: **91 scenery-field tasks**, total **3,413.4ms CPU**, mean **37.51ms per task**, worst **100.7ms**, **55 >33ms** and **13 >50ms**. In contrast, `scenery-instances` worst 0.8ms, `road-geometry` worst 0.3ms. This confirms the broad root cause is the monolithic `createFarmPlot()` call per `scenery-field` task, not ordinary geometry or instanced-mesh commit.

In the snapshot closest to 2.2km, Chunk 7 plots are built while the driver is almost 5km behind them; the 3ms queue budget cannot preempt a running 60ms callback. The trace does **not** contain a full isolated GPU timer measurement (`gpuTimerSupported=false`).

**Important:** The user observed one instant ~24 FPS before the flower field. This specific JSON has **24.67 FPS at ~451m** and a flower-field per-second low of **37.46 FPS at ~3,218m**. The HUD's instantaneous reading may be shorter than a one-second window. Treat it as reported gameplay observation, not as a verified matching 3.2km per-second log sample.

## P0b-1: shared deterministic flower atlas (first safe optimization on dev)

The high-risk global Worker/prebake refactor remains postponed. First eliminate an obvious and needless **repeated GPU-resource and Canvas draw cost** in the confirmed slow code path:

- `src/vendor/three-stylized/flowerShapes.ts`: `acquireSharedFlowerMask()` / `releaseSharedFlowerMask()` with reference-counted atlas lifetime, plus `sharedFlowerMaskStats()`.
- `Wildflowers.ts`: every field reuses the same shape atlas instead of regenerating a separate 480×256 CanvasTexture each time; the last owner disposes the texture. The pre-existing flower shape, UV, wind, masks and field density are unchanged.
- `src/coast-farm.ts`: stage resources pin one flower atlas during `loadCoastFarm()`, so the CPU rasterization is not triggered on the first visible field. Disposed at stage end alongside other assets.
- `src/scene-task-profiler.ts` and `src/streamed-scene.ts`: generic optional `detail` and `resourceId` on scene task records, aggregated under `byDetail` (`scenery-field/rice`, `scenery-field/flowers`). These preserve location/identity for future scenery types without specializing the scheduler.
- `?fpsdiag=1` includes `extras.farms.sharedFlowerAtlas` so repeated per-field duplicate masks and release behavior can be checked.
- Unit tests cover shared identity/refcount/disposal and subtype task accounting.

### P0b-1 acceptance and limits

Run `npm run build` and `npm test` locally, then the same physical Pixel 8 drive, comparing the 400m, 1.1km, 2.2km cliffs and actual flower-region FPS. Check `byDetail` for whether `flowers` construction costs less, and `sharedFlowerAtlas.residentAtlases` remains 1 while fields are active. Drive far enough to retire early fields and restart to catch reference leaks. **Do not claim the 100ms tasks are solved until the new trace demonstrates it.** If worst `scenery-field` times still exceed one 60 FPS frame (~16.7ms), P0b-2 must split numerical preparation into bounded Worker/build-time stages; do not merely move creation from 2km to 5km.

The previous accepted R8.8 geometry/Shader/wind, 5km road safety window, and gameplay inputs remain unchanged. `main` remains on the approved stable R8.8; rollback via a normal Git revert on dev if regression occurs. Original baseline checkpoint `5a43c2770dfef5fe4bb854087a56f975bbcd6024` remains preserved.

---

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

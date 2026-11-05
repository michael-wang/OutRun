# R9.0 P0 — Scene Task Attribution (FIRST INCREMENT)

**Status: R9.0 P0b-2 on `dev`, repeat Pixel 8 driving accepted by owner; strict per-task budget and local CI/build verification remain open.**  
**Design authority:** [ADR-009 — bounded stages and Scene Resource Pipeline](ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).  
**Public `main`:** remains the human-approved R8.8 family playtest; no public deploy authorized for P0.  
**Rollback checkpoint:** `checkpoint/r90-before-scene-pipeline` at `5a43c2770dfef5fe4bb854087a56f975bbcd6024`.

> **2026-11-05 P0a evidence and P0b first experiment (dev):** The real Pixel 8 log `outrun-fps-2026-11-04T18-30-46.957Z.json` confirms `scenery-field` is the expensive synchronous class. New experiment shares the flower mask atlas and records plot subtypes; **no post-change Pixel 8 evidence yet**. `main` remains unchanged. See the update below.

## P0b-2 Pixel 8 repeat drive — 2026-11-05 05:26 UTC — GAMEPLAY ACCEPTED, TECHNICAL DEBT OPEN

Second physical Pixel 8 Chrome trace: `outrun-fps-2026-11-05T05-26-33.058Z.json`, 77 one-second buckets covering **408–10,334m** (78.36s recorded). The owner drove almost the entire 10km coast and reported **no player-perceptible stutter**, perhaps only subtle frame-rate variations. This is the primary user-experience acceptance evidence; it is not proof of zero slow frames.

| Metric | P0b-1 legacy preparation | P0b-2 previous trial (19:11 UTC Nov 4) | P0b-2 repeat (05:26 UTC Nov 5) |
| --- | ---: | ---: | ---: |
| 91 field-commit CPU wall total | 3333.6ms | 994.6ms | **1146.5ms** (65.6% lower than P0b-1) |
| Worst field-commit task | 87.6ms | 40.1ms | **47.9ms** (45.3% lower) |
| Flower field commits >16.7ms | not subtyped | 21 | **27** |
| Field commits >50ms | 14 | 0 | **0** |
| First 0–4.5km mean FPS | 47.43 | 49.47 | **50.19** |
| All one-second buckets below 30 FPS | 4 in baseline 10.4km | 1 | **0** |
| Minimum per-second FPS, whole drive | 17.63 | 27.92 | **35.49** |
| Main rice 2.4–3.0km average FPS | 52.06 | 52.07 | **53.01** |
| Main flowers 3.1–3.6km average FPS | 43.39 | 44.24 | **41.32** |
| Second half (4.5km onward) mean FPS | 44.85 | 49.53 | **44.77** |

*Only one physical device/run per capture; FPS varies with scene, GPU heat and conditions. The latest repeat is not uniformly faster than the first P0b-2 capture, but both confirm reduced creation cost compared with P0b-1.*

**Critical old drop regions:** near ~450m **20.37 → 60.15 FPS**, near ~1.15km **27.57 → 37.84 FPS at 1226m**, near ~2.2km **24.81 → 41.72 FPS at 2218m**, with near-2353m **40.43 FPS**. Near-position comparison is approximate, not frame-aligned.

**Remaining trace:** 8 isolated >50ms frame gaps in the 77-second capture; largest **83.2ms at ~360m** just after the drive timer began, with `mainScene` CPU 38.3ms rather than world task creation. Other 66.5–66.6ms gaps occurred near 1182m and 2261–2274m where `world` CPU reached ~19–24ms, plus near 3553m, 3700m and 5138m. **Zero gaps >100ms**. `gpuTimerSupported=false`, so exact GPU execution cost is unknown.

**Data-path validity:** Worker prepared all **91 plots in 6 chunks** (`farmWorker.workerCpuMs=2582`), `missingPlots=0`, no recorded retries. End-of-drive `farms.plots=0` and `sharedFlowerAtlas.owners=1`, consistent with stage-local cleanup and the intentionally retained shared-stage atlas pin. No missing-road condition appears in the one-second chunk status snapshots; the owner's complete drive corroborates usability. This is **not** a substitute for a rigorous repeated-stage memory-leak test.

**Decision:** Keep P0b-2 on `dev` as a **playability / user-experience pass**; do not claim the strict 16.7ms-per-field-task performance criterion passed. The remaining 40 flower commits take 921.8ms total, ~23.05ms each on average (27 over 16.7ms, worst 47.9ms), while 51 rice commits average 4.41ms with **none over 16.7ms**. If strict P0 completion is needed, P0b-3 should offload flower/grass instance transform + vertex attribute generation or split main-thread assembly. P1 streaming priorities and P2 sustained flower rendering remain separate. User approval to promote to `main` has **not** been requested or granted for this release.

---

## P0b-2 Pixel 8 A/B result — 2026-11-05 — PARTIAL PASS

Real Chrome / Pixel 8 10.41km drive trace: `outrun-fps-2026-11-04T19-11-35.723Z.json`; 83 one-second buckets / ~84.3 seconds of driving. This is a single matched-device experiment, not a statistically controlled performance study.

**Worker data path accepted provisionally.** The trace confirms 6 prepared farm chunks, 91 worker-prepared field plots, 2870ms total reported Worker CPU prep, and `missingPlots=0`. No logged retries or missing road. Field graphics/positions still need separate owner visual sign-off; JSON can only confirm geometry/instance counts and successful preparation.

| Matched metric | P0b-1 baseline | P0b-2 Worker preparation | Interpretation |
| --- | ---: | ---: | --- |
| 91 synchronous field-creation tasks total | 3333.6ms | **994.6ms** | **70.2% less main-thread CPU wall time** |
| Worst synchronous field task | 87.6ms | **40.1ms** | **54.2% faster**, still exceeds 16.7ms |
| First 4.5km mean per-second FPS | 47.43 | **49.47** | +2.04 FPS, one run each |
| Number of first-4.5km one-second buckets below 30 FPS | 4 | **1** | Early severe slowdown much rarer |
| 4.5km-to-end mean FPS | 44.85 | **49.53** | +4.68 FPS, not proof of a direct Worker effect |
| Main rice 2.4–3.0km mean FPS | 52.06 | **52.07** | Essentially unchanged |
| Main flower 3.1–3.6km mean FPS | 43.39 | **44.24** | Small change; still a sustained-rendering topic |

Matched critical positions (nearest available one-second samples; not frame-for-frame):
- 450m: **20.37 → 41.42 FPS**.
- 1.15–1.20km: **27.57 → 37.24 FPS**.
- 2.215–2.240km: **24.81 → 41.42 FPS**.

Residual stutters are **not gone**:
- At ~405m, first recorded second **27.92 FPS**, mean `world` 16.8ms/frame, active distant field construction.
- Four >50ms individual frame gaps recorded overall; worst **99.8ms at ~2283m** during a Chunk 7 field commit. Worker cannot prevent synchronous main-thread mesh assembly from occasionally overrunning.
- Final `scenery-field` 91 tasks: 994.6ms total, max 40.1ms, **21 >16.7ms**, **9 >33.3ms**, **0 >50ms**.
- Rice: 51 plots, 222.1ms total, 4.35ms average, 14.5ms worst, **no plot >16.7ms**.
- **Flowers: 40 plots, 772.5ms total, 19.31ms average, 40.1ms worst, 21 plots >16.7ms**. These residual flower commits still dominate P0.
- The new Worker itself spent 2870ms CPU on farm numeric prep, completing the last distant farm batch by ~2.3km. Retain road-priority safety constraints: do not let Worker-side scene prep delay essential road deliveries in future larger stages.
- 4.5km-to-end: **44 samples average 49.53 FPS, minimum 38.45 FPS, no >50ms frame gap**. Accepted golden rice remains ~52 FPS, flowers ~44 FPS; `gpuTimerSupported=false`, so do not claim a GPU bottleneck is measured.

**P0b-2 outcome: KEEP on dev for follow-up; do not promote to main yet.** This fulfills meaningful CPU offload but not the strict <16.7ms per-main-thread-task target. The next narrow step (P0b-3) should address the per-flower `Wildflowers`/`GrassLayer` **main-thread `InstancedMesh` attribute/matrix generation and geometry aggregation** still in `createFarmPlot()`. Either prepare GPU-ready typed instance transforms/attributes off-thread (preserving original RNG sequence and world-space transform exactly), or break the per-plot build into explicit small commit stages. Instrument separate `field-materialize` phases if needed before moving code. Keep plots, wind, colours, culling and flower-masks unchanged; confirm no new road stalls, GPU upload bursts, or visual differences on Pixel 8. The broader P1 road/scenery window split and P2 sustained flower rendering remain separately scoped.

---

## P0b-2 — Worker-side deterministic field preparation (dev experiment, not yet device-accepted)

**Checkpoint:** `checkpoint/r90-p0b1-before-worker-farms` references `88322e062a86cedca8a4e1f017e79736d1c0f7dc` before this series. `main` is still R8.8. Version on dev: **`v0.9-coast-r9.0-p0b2-exp`**.

### Implementation

The 10-km route is a **finite authored stage**. Its Worker already owns the same deterministic track recipe. Instead of asking the rendering thread to reconstruct every field's terrain and repeatedly sample thousands of vegetation positions inside each non-preemptible `createFarmPlot()`:

1. `src/coast-farm-prep.ts` introduces a **pure numeric** `prepareFarmPlot(plot,track.sample)` routine. It computes terrace-edge heights using the existing terrain rules; rice-canopy positions, normals, UVs, colors and indices; and deterministic grass/wildflower surface sample arrays. It creates **no textures, WebGL objects or DOM elements** and can also be used in future build-time stage baking.
2. `src/road-worker.ts`: while assembling each coast scenery chunk, prepare its farm data; send it with the original scenery payload as **transferable `Float32Array` / index buffers**, with `farmPrepCpuMs` separately recorded. This moves the expensive geometry/coverage/surface sampling work off the main render thread, not the car collision/road-safety checks.
3. `src/vendor/three-stylized/surfaceSampler.ts`: pack/unpack world positions/normals in an explicit 6-float stride. The original seeded sampling algorithm remains the authoritative implementation.
4. `GrassLayer.ts`, `Wildflowers.ts`, `Grass.ts`: accept **optional** one-shot precomputed initial samples, preserving existing no-preparation behavior for noncoastal stages and runtime changes. Existing flower masks, wind Shader, instance colours and density are unchanged.
5. `src/coast-farm.ts`: optional prepared data populates the **same** field meshes/materials, instead of running terrain-height sampling and rice-canopy vertex generation again. Subsequent renderer controls, farm updates, cullling, lifecycle and stage-owned resource pools are unchanged.
6. `StreamedScene`: consume full per-chunk preparations in the old scenery commit queue, keep road priority, reject incomplete advertised Worker payloads and track fallback. `?fpsdiag=1` now adds `extras.streamer.farmWorker`: `chunks,plots,workerCpuMs,lastChunk,lastMs,missingPlots`.
7. New `tests/coast-farm-worker-prep.unit.ts` compares old versus Worker-prepared rice mesh attributes/indices, flower/grass instance counts and transforms, and transferable-buffer uniqueness.

**No visual simplification:** all approved R8.8 rice, flowers, houses, scarecrows, Ultra-Water and driving settings remain the same. The exact numeric positions are serialized as 32-bit floats when crossing Workers, so minuscule rounding differences are possible; mobile visual QA is required. Worker responses can take more CPU time on the separate thread; this is acceptable only if it does not delay required road chunks, create pop-in or increase stage loading beyond acceptable limits.

### Required verification on physical Pixel 8

- First run `npm run build` and `npm test` locally; GitHub file edits alone do not prove TS compilation or tests passed.
- Launch `/?fpsdiag=1`; verify upper-right version `v0.9-coast-r9.0-p0b2-exp`.
- Drive normally from 350m through **4.5km**, especially 400–500m, 1100–1250m and 2100–2300m. Capture the complete JSON **after** driving. Inspect unchanged visual density, flower colours, rice canopy continuity, no missing scenery or stuck "Preparing Road".
- In `seconds[].extras.streamer`, check `farmWorker.plots` increases during chunk assembly, `missingPlots=0`, and per-task `taskProfile.byDetail['scenery-field/rice'|'scenery-field/flowers']` worst drops to ideally **below 16.7ms**. If `missingPlots>0`, old synchronous work is still running and invalidates that A/B comparison.
- Check the `fps` at the three previous bottleneck distances; look for **zero per-second samples below 30 FPS caused by field creation**, and far fewer `>50ms` frame gaps.
- Replay at maximum safe speed to near the 10km route end; verify road is present, no new scenic pop-in and stage-local field resources are retired. Also verify start-up remains close to approved R8.8 (~8s in previous dev test; not guaranteed on every run).
- Compare the same 3.2km flower field and 2.6km rice field screenshots, keeping scenery, colours, and wind unchanged.

**Acceptance is pending.** This is a substantial internal data-path change even though the intended art output is identical. If compilation, real Pixel 8 frame times, road readiness or visual comparison fail, revert the P0b-2 commit range normally or restore from the checkpoint branch; do not force push. Do not promote to `main` until approved.

---

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

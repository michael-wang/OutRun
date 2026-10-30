# P0 road-streaming hotfix — 2026-10-31

Baseline: `f9ccbb178e5bf2daa16277f1bc2bd786056badfd` (r7/ALB7). Issue: https://github.com/michael-wang/OutRun/issues/7.

## Diagnosis and limits

The exact trigger on Michael's Pixel 8 is **not established**: the original screenshot has no worker/context/memory log. We reproduced the same missing-road failure mode in baseline gameplay by delaying delivery of worker requests for chunks >=5 by 12 seconds. At 83.419 s / 8010.700 m, chunk 8 was still `working`, chunk 9 was absent, the worker was busy, and both commit and retirement queues were empty. No worker error was reported. The car continued into missing geometry. See `baseline.json.gz` and `baseline-missing.png`.

This proves the unsafe progression / insufficient preparation-throughput failure path, not that this was the physical phone's specific trigger. Initial readiness was insufficient; dispatch interleaved scenery with roads and an error could permanently stop preparation. No evidence identifies a service-worker fault, bridge geometry defect, memory exhaustion, or GPU context loss as the original cause. Matching main/SW cache names were checked; PWA behavior is unchanged.

## Fix

- Before every simulation tick, require attached asphalt geometry from 80 m behind through at least 350 m ahead, increasing to three seconds of actual travel plus the next tick and margin. No larger streaming window: still 1000 m chunks, 5000 m ahead / 1000 m behind.
- Missing safety coverage freezes elapsed time, distance, handling state and traffic time. Rendering continues to prepare/commit chunks. Fullscreen-safe **Preparing road…** appears; loading completion resumes the same journey without reset, teleport or clearing inputs. Lost WebGL context also blocks progression until restored.
- Dispatch all desired roads before scenery; commit roads before optional scenery and deferred disposal. Memory/window eviction remain bounded.
- Worker exceptions, decode failures, synchronous launch/dispatch errors, malformed/empty road results, and a 30-second response timeout have at most two worker restarts. Retain committed geometry and retry the affected chunk. Exhaustion or main-thread commit failure gives a visible blocking error instead of continued driving.
- Production `?streamdiag=1` provides a compact status and **Export stream log**: elapsed/distance, readiness, pending age, preparation/commit timings, worker errors/retries, queues, FPS, draw calls, renderer allocation counts, available JS heap and stalls. Bounded 900-sample ring. Fault injection and gameplay controls remain DEV-only.

No changes to geometry, r7 identity, handling, traffic, collision momentum, scenery content or SW/PWA files.

## Continuous full journeys

Actual real-time RAF gameplay from the normal start to the finish; no teleports, accelerated simulation clock or preloaded inspection stops. Existing controls are driven by a test driver. Edge, 960×432, DPR 2, touch/mobile viewport; three concurrent browser contexts on a desktop GPU. These are browser-emulated stress results, **not physical Pixel 8 acceptance**.

| Seed | Simulated seconds | Peak km/h | Frames checked | Missing / unsafe progression | Stalls | Sampled FPS min / mean |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 694.07 | 217.22 | 41,641 | 0 / 0 | 0 | 58 / 60.00 |
| 2 | 665.61 | 252.38 | 39,948 | 0 / 0 | 0 | 58 / 60.00 |
| 7 | 618.83 | 318.57 | 37,160 | 0 / 0 | 0 | 57.99 / 59.99 |

All finished at approximately 69,350 m with zero worker/page errors. Seed 7 used full throttle and **4-second delays inside the Worker** for road/scenery requests from chunk 8 onward, not merely main-thread CPU throttling. Every RAF checks current/camera road and safe advancement; each second also raycasts the actual road center. Logs include the whole journey and samples nearest the reported 162-second time (`at-162-seconds.json`).

Sampled peak renderer geometry counts: 158 / 171 / 163; JS heap: 57.66 / 58.24 / 59.82 MiB (end 41.96 / 53.76 / 41.95 MiB); draw calls: 282 / 285 / 284. Peak observed commit queues: 46 / 46 / 0; sampled retirement queues: 0. Short-lived queues between one-second samples may be larger. Worker timing entries retained in sampled history observed road preparation up to 546 / 1030 / 1605 ms; delayed Seed 7 worker round trip up to 5606 ms. These are observed samples, not exhaustive profiler maxima or GPU-memory measurements. `journey-summary.json` and compressed raw logs retain the evidence.

The complete journeys ran before final error-path hardening, fullscreen container placement and diagnostic-history filtering. Those final changes were independently covered by the subsequent tests below; road priority, safety buffer and simulation progression logic were unchanged.

## Failure and regression checks

- In-worker 4-second delay at the safety boundary: elapsed, position, speed and applied steering remain unchanged while held; current road remains attached; automatic recovery in approximately 4.2 seconds (`slow-recovery.json`, `preparing-road.png`). This targeted setup moves to the boundary; it is separate from continuous journeys.
- Persistent injected worker exception: three failures / two retries, visible blocking error, no distance/time progression (`failure.json`, `failure.png`).
- WebGL loss/restoration: time/distance frozen, same journey resumes after restoration.
- Seven streaming unit cases: geometry-backed readiness, priority, transient restart, persistent failure, watchdog, malformed response, construction/dispatch failure.
- Production build passes, with the existing bundle-size warning.
- Focused unit command below: 24 passed (before adding two additional synchronous-failure cases); full serial suite: **158 passed / 5 failed**. The same five failures reproduce on an untouched archive of `f9ccbb1`: handling return-to-center expectation; pilot fingerprint; Stage r1 expectation; two legacy brick/review expectations. See `baseline-existing-tests.json` and `unit-results.json`. They are outside this hotfix and were not rewritten to hide failures. Initial parallel timeouts disappeared under serial execution.
- Browser checks: all 18 unique tests pass after updating one stale Stage r1 expectation to the existing r2 identity. Includes four new reliability tests, three existing streaming tests, Worker deterministic buffers, four trip/replay/telemetry tests and six r7 shoulder/bridge/contact/guardrail tests. Tests that deliberately teleport now await loading before manual advancement.
- Existing bridge traversal with traffic at 4× main-thread CPU throttle: sampled FPS minimum 44.52 / mean 48.11; road ready throughout, wheel/traffic contact and both bridge guardrails pass (`bridge-regression.json`). This is distinct from Worker slowdown coverage.

Commands:

```powershell
npm run build
npx vitest run --maxWorkers=1 --testTimeout=15000
$env:OUTRUN_BROWSER='msedge'
npx playwright test tests/stream-journey.spec.ts --workers=3
npx playwright test tests/stream-reliability.spec.ts tests/v085-stream-browser.spec.ts tests/v085-road-worker.spec.ts tests/v09-trip.spec.ts tests/road-expansion.spec.ts --workers=1
```

Raw JSON journey logs are gzip-compressed without dropping samples. Tests regenerate readable JSON. Historical evidence overwritten by existing tests is restored, with the relevant new bridge measurements copied here.

## Human acceptance still required

Michael: run the full continuous Seed 1 journey on physical Pixel 8, preferably with `?seed=1&streamdiag=1`, and export the log immediately if any interruption occurs. Also exercise Seeds 2/7 and maximum speed. Physical memory pressure, mobile GPU/driver behavior and the original incident's trigger remain unverified. Dev only; no main merge or deployment.

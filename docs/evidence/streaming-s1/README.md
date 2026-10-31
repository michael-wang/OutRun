# Goal S1 — streaming diagnostics and scenery investigation

Base: c22866e2f9f143614b4654a9ffff43e24b624866. Development only; no main merge, deployment, release configuration change or S2/S3 implementation.

## Findings

The continuous desktop-browser runs did **not reproduce the reported spontaneous missing scenery**. All three seeds finished with zero missing-road frames, unsafe advances, stalls, page/Worker errors, sampled nearby scenery-not-ready states, or ready-chunk generated/attached count mismatches. Screenshots near 2:41 show populated scenery. This does not establish the cause of the physical Pixel 8 screenshot.

Road Worker preparation is the dominant measured streaming CPU cost: road P95 1.12–1.21 seconds versus scenery P95 7–8.6ms and main-thread per-chunk attachment P95 at most 0.5ms. These are elapsed synchronous Worker timings, not GPU timings. CPU attachment and renderer submission are explicitly separated; GPU completion, visible pixel counts and GPU memory remain unavailable.

See [source audit](SOURCE-AUDIT.md), [physical follow-up](PIXEL8-FOLLOWUP.md), [full summary](journey-summary.json), and the per-seed lossless JSON gzip logs. Historical r7 evidence remains unchanged.

## Continuous journey conditions

Edge 156.0.4314.50, Windows desktop (Ryzen 9 9950X3D, 32 logical CPUs), headless with desktop GPU, three concurrent browser contexts, 960×432 CSS viewport, DPR2, touch/mobile emulation, no CPU throttle. App coarse-pointer settings cap renderer pixel ratio to 1 and disable shadows. Existing deterministic seed and input driver, real RAF time, no teleports or accelerated simulation. Seed 1 gas cap 60m/s, Seed 2 cap 70m/s, Seed 7 full gas plus 4000ms in-Worker delay on road/scenery requests from index 8. Default effective pace unchanged. The serial unit suite ran during the early journey section; screenshots introduce small readback costs. These are not physical Pixel 8 results. Host details: [host.json](host.json).

Full journeys ran before the final diagnostic-only sample-retention reduction, observed wall-travel speed and snapshot-cost labeling; streaming scheduling, commits, safety, geometry and render callbacks were unchanged. Final build, export, overhead and focused regression checks cover those final adjustments.

| Seed | Sim seconds | Peak km/h | Frames checked | FPS min / mean | Min headroom all / before final 5km (s) |
|---|---:|---:|---:|---:|---:|
| 1 | 691.66 | 217.23 | 41545 | 55.00 / 59.98 | 5.71 / 46.59 |
| 2 | 660.09 | 252.93 | 39647 | 55.00 / 59.98 | 5.65 / 39.73 |
| 7 | 631.78 | 318.57 | 37932 | 55.00 / 59.98 | 7.02 / 25.86 |

Headroom naturally contracts near the route end. The earlier minimum isolates ongoing streaming coverage. All nearby chunks through +1200m were scenery-ready in the one-second samples, covering the 1100m fog limit. This is sampled coverage, not a per-pixel assertion.

## Per-chunk timings (milliseconds)

Each cell is **P50 / P95 / P99 / worst**, nearest-rank. Each row has **70 completed requests** (all route chunks), including startup. Ready latency begins at dispatch, not initial demand; incomplete requests would be excluded and retained separately. Injected waits are included in response and ready latency, excluded from Worker CPU.

| Seed | Phase | Worker CPU | Worker response | Main commit CPU sum | Main commit wall span | Request → CPU ready |
|---|---|---|---|---|---|---|
| 1 | road | 612.20 / 1201.40 / 1317.30 / 1317.30 | 612.70 / 1201.90 / 1318.40 / 1318.40 | 0.20 / 0.40 / 1.00 / 1.00 | 0.20 / 0.70 / 1.10 / 1.10 | 618.30 / 1217.30 / 1333.90 / 1333.90 |
| 1 | scenery | 3.60 / 7.00 / 7.90 / 7.90 | 3.80 / 7.70 / 18.20 / 18.20 | 0.20 / 0.40 / 0.70 / 0.70 | 0.20 / 0.50 / 0.70 / 0.70 | 12.00 / 21.20 / 24.10 / 24.10 |
| 2 | road | 640.10 / 1213.00 / 1378.60 / 1378.60 | 640.40 / 1213.30 / 1378.80 / 1378.80 | 0.20 / 0.50 / 0.80 / 0.80 | 0.20 / 0.50 / 0.80 / 0.80 | 650.50 / 1217.70 / 1384.10 / 1384.10 |
| 2 | scenery | 4.30 / 8.60 / 10.80 / 10.80 | 4.70 / 8.80 / 12.80 / 12.80 | 0.20 / 0.40 / 0.50 / 0.50 | 0.20 / 0.40 / 0.50 / 0.50 | 14.40 / 22.60 / 25.40 / 25.40 |
| 7 | road | 652.20 / 1116.00 / 1532.80 / 1532.80 | 4654.10 / 5117.50 / 5533.70 / 5533.70 | 0.20 / 0.50 / 0.70 / 0.70 | 0.20 / 0.50 / 0.70 / 0.70 | 4667.20 / 5129.40 / 5548.50 / 5548.50 |
| 7 | scenery | 4.50 / 8.00 / 9.10 / 9.10 | 4005.60 / 4009.40 / 4015.40 / 4015.40 | 0.20 / 0.50 / 0.60 / 0.60 | 0.30 / 0.50 / 0.60 / 0.60 | 4013.30 / 4024.00 / 4028.70 / 4028.70 |

## Queue and resource trends

| Seed | Peak sampled road / scenery commit queue | Retirement peak | Draw calls peak | Geometry count peak | Heap peak / end MiB |
|---|---|---:|---:|---:|---:|
| 1 | 0 / 0 | 0 | 294 | 159 | 70.09 / 44.70 |
| 2 | 16 / 23 | 0 | 265 | 171 | 67.62 / 57.53 |
| 7 | 14 / 0 | 0 | 283 | 163 | 68.02 / 41.19 |

No discarded work in continuous drives. Seed 7 peaked at one unrequested road and two unrequested scenery chunks; one Worker task was pending at most, as designed. Resource counts stayed within the rolling scene window; heap fluctuated with GC and ended below peak. JS heap is not GPU memory. Sampling can miss short queue peaks.

## Comparison with r7 hotfix evidence

Archived r7: zero gaps/stalls, mean ~60 FPS, sampled minima ~58; geometry peaks 158/171/163 and heap peaks 57.66/58.24/59.82 MiB. S1: the same safety outcomes and ~59.98 mean FPS, minima 55 around capture activity, geometry peaks 159/171/163. Initial S1 logging retained repeated lifecycle records and raised heap peaks to 68–70 MiB; the final sample ring omits those duplicates while latest/export retains the complete bounded lifecycle. This is not a claimed performance improvement over r7. Differences in traffic interactions, screenshots, sampling and GC prevent a causal before/after speedup claim.

Archived r7 road maxima 546/1030/1605ms came from sparse history, not complete per-chunk distributions. S1 captures every request (maxima 1317/1379/1533ms), so the first seed's larger maximum does not by itself prove a regression. The delayed Seed 7 response maximum is 5534ms versus r7's sampled 5606ms.

## Reproduction, profile and final verification

The targeted reproduction, Worker profile and final checks below cover the completed S1 implementation.

## Reproduce

~~~powershell
npm run build
npx vitest run --maxWorkers=1 --testTimeout=15000
$env:OUTRUN_BROWSER='msedge'
$env:OUTRUN_EVIDENCE_ROOT='docs/evidence/streaming-s1'
npx playwright test tests/stream-journey.spec.ts --workers=3
npx playwright test tests/stream-diagnostics.spec.ts tests/stream-reliability.spec.ts tests/v085-stream-browser.spec.ts tests/v085-road-worker.spec.ts tests/road-expansion.spec.ts --workers=1
node scripts/summarize-stream-s1.mjs
~~~

The summary script reads either raw JSON or lossless gzip. Existing regression tests write to historical evidence paths; preserve/restore those archives after copying relevant new results into the S1 evidence folder.

### Controlled missing-scenery reproduction — PASS

`stream-diagnostics.spec.ts` reuses the existing DEV Worker fault and reset hooks. Seed 7 is explicitly reset to 6350m after initial preparation; requests from chunk 6 are delayed 2000ms inside the Worker. This is a targeted boundary setup, **not** another continuous journey.

1. At 6350m, chunk 6 road is ready, scenery missing, attached count 0, generated count unknown/null. Worker is preparing chunk 7; four roads and six scenery chunks remain unrequested. Road/scenery commit and retirement queues are all empty. See [scheduling screenshot](delayed-scenery-scheduling.png).
2. The scenery request for chunk 6 starts about 11.24s after its road response, after all desired roads have been requested/prepared. While this scenery request waits, generated count remains unknown and attached count 0; no commit backlog exists. See [Worker-delay screenshot](delayed-scenery-worker.png).
3. Resume ordinary driving: at 6401.65m / 0.5 simulated seconds, scenery is still pending and `held=false`. Optional scenery does not pause gameplay.
4. Response arrives after 2003.7ms, of which only 2.4ms is synchronous scenery generation. Commit CPU/wall cost is 0.3ms; request-to-CPU-ready is 2008ms. All 471 generated instances attach. At the recovery snapshot 6531.18m, 238 instances belong to recently submitted meshes; that smaller value is expected view selection, not lost attachments. See [recovered screenshot](delayed-scenery-recovered.png) and [all four snapshots](delayed-scenery.json).

Classification: **scheduling delay plus deliberately delayed Worker availability**, not a geometry-generation failure, main commit bottleneck, premature retirement, culling failure, or intentionally empty chunk. The populated recovery demonstrates that this region's content exists. Screenshots are captured immediately adjacent to JSON snapshots, not atomically with them; diagnostic panel text updates once per second and can lag the snapshot.

This establishes a reproducible mechanism by which road remains playable while optional scenery is visibly absent. It does **not** prove the original Pixel 8 incident had that mechanism or that ordinary continuous gameplay starves scenery; all three continuous S1 runs had nearby scenery ready in every sampled row.

### Worker profile and single next recommendation

Standard V8 Worker CPU sampling over six newly desired late-route chunks after a Seed 1 reset to 55350m took 6.73s. Of 4294 samples, 56 were idle. `profile` accounted for 2166 self samples and `pilotSample` 1268: **81.0% of non-idle samples combined**. Including their `knots` lookup adds another 148 samples. Geometry/material constructors and garbage collection were minor in this sample. See [profile summary](worker-profile-summary.json) and [standard DevTools CPU profile](worker-late-route.cpuprofile). Frame line numbers refer to Vite-transformed sources, not repository line numbers. Sampling has overhead; these percentages identify a hotspot rather than predict an exact speedup.

**Single highest-value next optimization:** replace repeated full placement scans and reevaluation of expired elevation/width profiles in `pilotSample` with an indexed active/held-value lookup, preserving the exact existing sample results. `prepareRoadChunk` calls this path repeatedly across road strips, markings and normal sampling; later distance causes more expired profiles to be evaluated. This recommendation follows the CPU profile, growing per-chunk latency, and source audit. No implementation is included. Require deterministic geometry/route equivalence tests and rerun the same baseline after owner authorization. Geometry pooling is not the first recommendation supported by these measurements.

### Diagnostic overhead — PASS within tested conditions

Fixed Seed 2 view at 14000m, ready window, 2s warmup, four 20s runs in off/on/on/off order, same mobile viewport and `perf=1`, no concurrent journey test. Mean FPS: **59.9982 off / 59.9983 on**. Mean renderer CPU: **0.6753ms off / 0.6621ms on**; the small difference is noise, not a claimed speedup. Draw calls were exactly 202 in both conditions. All 200 explicit diagnostic snapshot calls were <=0.3ms. The <5% FPS regression threshold passes. [Raw overhead measurements](overhead.json).

This fixed-view check isolates steady rendering/callback/sampling overhead; it does not simulate Pixel 8 memory bandwidth or a 256-record export. The continuous journeys separately show near-60 FPS with the growing lifecycle set, under the earlier, more memory-heavy retention. Final saved samples avoid duplicating records; export remains bounded at 256 lifecycle records, 900 snapshots, 128 stalls and 2000 legacy timing entries. [Production JSON export](production-export.json) confirms no DEV gameplay hook and preserved lifecycle payload with no repeated per-sample record arrays.


### Verification status

- **PASS:** production TypeScript/Vite build; existing bundle-size warning only.
- **PASS:** 12 focused streaming/road/scenery unit tests; all 10 streaming-specific cases pass.
- **PASS:** all 3 full real-time journeys (Seeds 1/2/7), including maximum throttle and Worker slowdown.
- **PASS:** all 18 relevant browser tests, including the 4 new diagnostic checks, existing recovery/error/context-loss tests, deterministic transferred buffers, rapid retirement, replay and r7 bridge/traffic/contact checks. See [browser output](browser-results.txt), [journey output](journey-results.txt), and [new regression evidence](regressions/).
- **PASS:** controlled missing-scenery classification, bounded lifecycle retention, production JSON export, and tested diagnostics overhead.
- **FAIL — existing baseline:** full serial unit suite has 161 passes / 5 failures, exactly the five names in the archived r7 untouched-baseline results: handling return-to-center; accepted pilot fingerprint; Stage r1 expectation; two legacy brick/review expectations. No new unit failure. Their source files were not changed. See [full unit JSON](unit-results.json) and [focused JSON](focused-unit-results.json).
- **UNVERIFIED:** original Pixel 8 trigger, physical thermal/memory/driver behavior, GPU completion and visible-pixel completeness. No physical-device acceptance claimed. Julia's review and Michael's Pixel 8 acceptance remain required before another goal.

S1 stops here. No optimization to gameplay/generation or S2/S3 work was implemented. The commit containing this report is the S1 delivery commit (see Git history); only dev is pushed.

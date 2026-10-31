# S2A — eliminate growing route-profile evaluation cost

Base: `1457b3d984bcc4e58312481302027d8375918faa` on clean dev. Production changes are limited to `src/pilot-composer.ts`. Physical Pixel 8 acceptance remains pending; desktop results are not final acceptance.

## Change and exact semantics

The original `pilotSample` loop scans every placement on every query. After passing an elevation/width placement it repeatedly evaluates that expired profile at t=1, even when later placements overwrite the result. More expired placements accumulate as distance increases; S1 sampling identified this path as the dominant Worker cost.

S2A builds an index of the exact start/end boundaries. Each boundary stores both the inclusive endpoint state and the state immediately after it. Runtime lookup uses binary search, then evaluates only the winning active curvature/elevation/width profiles, with cached held endpoint values for expired elevation/width. The interpolation function, knots, clamping, normalized-t arithmetic, derivative arithmetic and half-width calculation are unchanged. No sampled lookup table, approximation, rounding or geometry quantization is used.

Input-order assignment precedence is preserved, including unordered/overlapping inputs. Both placements remain active at a shared end/start boundary; active entries retain original identity and order, and each call returns a fresh active array. Expired curvature never overrides an active curve; expired elevation/width retains the original last-eligible-assignment rule and zero grade. Forward and backward querying uses the same index, with no mutable distance cursor.

Index construction scans the recipe at each distinct boundary (O(N²) once; at most 2N boundaries). For valid nonoverlapping per-channel recipes, active-state storage is O(N), and each query costs O(log N) plus at most three unmodified profile evaluations. Cached held values are exactly `profile(knots, 1).value`. Initialization timings below include this construction.

The WeakMap relies on finalized immutable authored placements; current generators use this pattern, and the existing knot cache already assumes immutable knot parameters. Generated recipes are assembled before sampling and are not mutated afterward in production. Replacing the placement array invalidates the index; an observed length change also rebuilds it. Same-length in-place placement/boundary edits are not a supported cache-update mechanism; an editor must supply a new recipe/placement array (and new placement objects when changing knot parameters). No cache or index is serialized into recipes or codes.

Worker scheduling, safety holds, chunk/window sizes, road/scenery/asset generation, geometry templates, renderer, traffic, physics, Stage/Trip codes and default 1.75× pace are unchanged. Test-only frozen S1 modules provide an independent reference; [provenance](oracle-provenance.json) verifies that only their import paths and provenance headers changed.

## Matched Worker benchmark

Headless Edge, Windows desktop Ryzen 9 9950X3D, one blank 960×432 DPR2 mobile/touch context, no game renderer, CPU throttling or injected faults. Original and optimized Workers use identical unchanged dependencies and identical route recipes; execution order alternates per chunk. Three fresh-worker repetitions per seed, one chunk-0 warmup before measurement, then chunks 0–20. Measurements are the Worker's existing synchronous cpuMs; messaging, hashing and byte comparisons occur outside the timed section. No other test suite ran during this benchmark. Mobile emulation is **not a physical Pixel 8 test**.

Browser version: 156.0.4314.50

| Seed | Chunk band | Samples | Mean before → after (ms) | Mean speedup | P95 before → after (ms) |
|---|---|---:|---:|---:|---:|
| 1 | 0–5 | 18 | 163.48 → 63.40 | 2.58× | 237.90 → 83.00 |
| 1 | 6–10 | 15 | 231.20 → 65.43 | 3.53× | 303.20 → 81.90 |
| 1 | 11–20 | 30 | 321.82 → 63.62 | 5.06× | 398.60 → 83.30 |
| 2 | 0–5 | 18 | 152.91 → 68.86 | 2.22× | 208.40 → 90.90 |
| 2 | 6–10 | 15 | 225.83 → 69.04 | 3.27× | 292.10 → 96.70 |
| 2 | 11–20 | 30 | 308.61 → 66.84 | 4.62× | 369.00 → 77.10 |
| 7 | 0–5 | 18 | 153.91 → 69.83 | 2.20× | 200.50 → 89.50 |
| 7 | 6–10 | 15 | 231.78 → 69.98 | 3.31× | 298.20 → 78.60 |
| 7 | 11–20 | 30 | 311.51 → 65.68 | 4.74× | 369.00 → 81.20 |

Late/early mean ratio (chunks 11–20 / 0–5):

| Seed | Before | After | Linear slope before → after (ms/chunk) | Worker init mean before → after (ms) |
|---|---:|---:|---:|---:|
| 1 | 1.97× | 1.00× | 12.19 → 0.07 | 427.10 → 70.23 |
| 2 | 2.02× | 0.97× | 12.08 → 0.16 | 402.70 → 66.93 |
| 7 | 2.02× | 0.94× | 12.31 → -0.14 | 434.27 → 75.30 |

The previous roughly 2× growth across these bands disappears in this controlled desktop measurement. Residual chunk-to-chunk variation remains; this is not a claim that every chunk has identical cost. [Raw paired samples](worker-benchmark.json) and [summary with P50/P95/P99/worst and every chunk index](benchmark-summary.json) retain the measurements. Percentiles are nearest-rank over the stated small sample counts, not confidence intervals.

Michael's S1 physical P95 values (Seeds 1/7/2: 14.36s/21.08s/18.54s) motivated S2A. They are not directly comparable to this isolated desktop benchmark and are not used to infer a phone speedup. See [physical acceptance procedure](PIXEL8-ACCEPTANCE.md).

## Equivalence and regression evidence

The numeric oracle covers 30 recipes: Trip Seeds 1/2/7 at revisions r1–r7, Stage Seeds 1/2/7 at r1/r2, and the three pilots. **1,457,452 sample comparisons** traverse the full route every 2.5m, all placement and internal-knot boundaries, adjacent representable floats and ±1e-7 offsets, before/after-route clamping, infinity endpoints, and reverse query order. Every numeric field is compared with Object.is, and active placements by exact reference/order. Recipe objects, bank features, codes and fingerprints deep-equal the frozen S1 generators. Dedicated cases cover shared endpoints, input-order precedence, overlap, replacement-array invalidation and fresh active arrays. [Numeric evidence](profile-equivalence.json).

**Full road geometry: PASS.** All 70 chunks of all 21 Trip seed/revision cases (Seeds 1/2/7 × r1–r7) match byte-for-byte: **1,470 chunks / 1,076,704,616 bytes**. Positions, normals, UVs, colors, triangle indices and roadside instance matrices are compared directly; material-kind and raycast-range metadata must match exactly. SHA-256 is recorded after byte equality, not used as a substitute for it. [Full geometry evidence](geometry-equivalence.json).

The single-pass r7 equivalence runs additionally measured far-route chunks 50–69: means **808.94 → 74.93ms (Seed 1), 831.00 → 76.04ms (Seed 2), 839.96 → 76.60ms (Seed 7)**, roughly 10.8–11.0× faster. These are auxiliary single-pass measurements, not the three-repetition benchmark above. Optimized early means in these runs were 57.63/58.67/59.30ms, so residual full-route variation remains (~1.3× late/early). The dominant accumulated expired-profile cost is removed; S2A does not claim all road-preparation cost is constant or the phone problem is fully resolved. Per-band tail distributions are retained under `lateRoute` in the summary.

**Scenery geometry: PASS.** All **210 r7 scenery chunks / 14,868,020 bytes** match exactly across Seeds 1/2/7. Template position/normal/UV/color/index buffers and instance matrices are compared directly, with material settings exact and nondeterministic template UUIDs normalized to template indices. [Scenery evidence](scenery-equivalence.json).

## Remaining cost and limits

The reused S1 V8 Worker profiler captures the same reset to 55350m (actual desired indices 54–60, seven chunks). Post-change capture duration is 646ms, versus the archived S1 capture's 6732ms; this is a supplementary profiled scenario, not the primary repeated benchmark. The historical test's text says six chunks; the raw snapshot identifies seven and the new summary includes that correction.

Of 394 post-change samples, 379 were non-idle. Active `profile` evaluation has 129 self samples (34.0%), `pilotSample` 52 (13.7%), track `sample` 106 (28.0%), and road `point`/`append` 44 (11.6%). The combined profile/sampler share drops from S1's 81.0% to 47.8%, while absolute preparation time falls substantially. Remaining work is active interpolation, track sampling and road vertex/normal assembly. The short sample does not uniquely attribute the residual ~1.3× far-route variation; content/geometry work and the existing linear course lookup may contribute. No extra optimization, scheduling change or geometry pooling was introduced. [Profile summary](worker-profile-after.json) · [DevTools CPU profile](worker-after.cpuprofile).

## Verification status

- **PASS:** production TypeScript/Vite build, with the existing bundle-size warning.
- **PASS:** exact numeric/recipe comparisons, 1,470 road chunk byte comparisons, 210 scenery chunk byte comparisons, and the controlled before/after benchmark.
- **PASS:** all 22 selected browser checks verified: scenery equivalence; r7 bridge/shoulder/traffic/guardrail contacts; delayed optional scenery; Worker profile; production JSON diagnostics; bounded Worker failure/recovery; WebGL restoration; deterministic transferred buffers; retirement/replay; Trip codes, telemetry/history preservation and touch input independence.
- **Environment-only first-run failures:** two production checks initially hit `ERR_CONNECTION_REFUSED` because the previously existing preview server had stopped. They failed before application assertions. Both passed when rerun with the standard Playwright configuration managing preview. The initial and rerun logs are retained; no application change was made to resolve this.
- **FAIL — existing baseline only:** full serial unit suite is **163 passed / 5 failed**, matching the same five archived S1 failures (handling return-to-center, pilot fingerprint, Stage r1 expectation, and two legacy brick/review expectations). No new unit failures. [Full unit JSON](unit-results.json).
- **UNVERIFIED / not final PASS:** S2A on physical Pixel 8. Michael must confirm actual Worker tails, scenery recovery and full-journey behavior; Julia must review the code/evidence. Desktop improvement is insufficient for final acceptance.

This goal stops at S2A. No S2B/S3, main merge, deployment or release-configuration change. The delivery commit is the commit containing this report; dev only is pushed.

## Reproduce

```powershell
npm run build
npx vitest run tests/profile-index.unit.ts --maxWorkers=1
npx vitest run --maxWorkers=1 --testTimeout=15000
$env:OUTRUN_BROWSER='msedge'
npx playwright test tests/profile-index.spec.ts --config playwright.worker.config.ts --workers=1
node scripts/summarize-profile-s2a.mjs
npx playwright test tests/stream-reliability.spec.ts tests/v085-stream-browser.spec.ts tests/v085-road-worker.spec.ts tests/road-expansion.spec.ts tests/v09-trip.spec.ts tests/stream-diagnostics.spec.ts --grep-invert 'diagnostic overhead' --workers=1
```

The Worker-only configuration starts only the Vite module server; it does not alter release settings. Standard regression configuration also manages production preview. The completed regression run used the Worker-only configuration while an existing preview was expected; the two production reruns used standard configuration. Existing tests write historical evidence paths: new results are copied under this goal and the historical originals restored. Full-route geometry checks are intentionally serial/slow so paired timing conditions stay controlled. The numeric unit suite briefly overlapped historical geometry cases after the dedicated benchmark had finished; those cases establish equality, not a controlled performance comparison. No continuous ten-minute S2A gameplay acceptance or physical-device run is claimed; actual gameplay coverage here is the existing bridge/traffic, input and streaming-recovery browser regression suite.

Execution logs: [matched Worker/equivalence checks](worker-results.txt), [numeric checks](numeric-test-results.txt), [initial browser run](browser-initial-results.txt), [successful production rerun](production-rerun-results.txt). New screenshots and recovery/telemetry records are preserved in [regressions](regressions/); historical archives remain unchanged.

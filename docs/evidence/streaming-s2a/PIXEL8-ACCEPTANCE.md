# S2A — physical acceptance pending

Michael reported physical Pixel 8 Road Worker P95 of 14.36s / 21.08s / 18.54s for Seeds 1 / 7 / 2, with persistent scenery starvation and sharply increasing cost after ~6km. Those are owner-supplied S1 measurements, not S2A measurements or a claimed phone speedup.

After Julia's review, run the reviewed S2A dev build on physical Pixel 8 using the existing authorized test setup. No deployment or main promotion is performed by this goal. Use `?seed=1&streamdiag=1`, then Seeds 7 and 2, reproducing the earlier pace, browser and device conditions. Export each full journey and immediately capture a screenshot/export if scenery remains absent or a loading hold occurs.

Compare Worker CPU per chunk in bands 0–5, 6–10, 11–20 and the rest of the route. Check P50/P95/P99/worst, road headroom, pending request age, unrequested scenery/commit queues, generated versus attached scenery counts, stalls and resources. Confirm the previous distance-dependent growth is gone on the phone and scenery stays populated; desktop speedup alone is insufficient.

Keep temperature, power saving, charging, browser/build/Trip Code and elapsed time with the exports. No faults should be injected for acceptance. GPU completion and visible pixel counts remain unavailable; `ready` denotes CPU attachment. Existing road safety and optional-scenery behavior are unchanged.

S2A status remains **UNVERIFIED for physical acceptance** until Michael's results and Julia's code review. S2B/S3 are not authorized or implemented here.

The unchanged diagnostic UI may still show `S1-stream-diagnostics`: that is the instrumentation schema label, not proof of which sampler implementation is loaded. Verify the delivered S2A dev commit when preparing the device build; Stage/Trip codes intentionally remain unchanged.

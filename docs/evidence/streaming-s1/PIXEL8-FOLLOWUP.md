# Physical Pixel 8 follow-up (Michael) and evidence review (Julia)

Use the reviewed S1 build through the existing authorized test setup; S1 does not deploy or change release configuration. Add `?seed=1&streamdiag=1`, then repeat Seeds 2 and 7, including maximum-speed driving. Preserve the Trip Code/build, browser version, orientation, device temperature/battery and whether power saving is active. Browser mobile emulation is not this acceptance test.

If scenery appears missing, take a screenshot and immediately use **Export stream log** before reloading. The export includes route position, player speed and effective world travel speed, nearby chunk states, pending Worker kind/index/age, separate commit queues, generated versus attached instances, last renderer submissions, resource proxies, stalls and retained per-chunk timings. Export at the end of an uneventful full trip too.

Interpret the same-position screenshot with the JSON:

- No scenery request yet, road demand pending: scheduling delay is supported.
- Scenery request pending, no response/generated count: preparation/delivery delay is supported; Worker CPU and response latency later separate synchronous work from waiting.
- Response present, generated count nonzero, commit incomplete/attached count lower: main-thread attachment backlog or commit failure is supported.
- Ready with generated and attached counts equal: this rules out a simple missing CPU attachment; it does not establish visible scenery. Compare render-submission counts, camera direction, bridge/rock exclusions and fog. GPU errors/occlusion need physical-device capture or remote browser tools; GPU completion and memory are unavailable in this export.
- A deliberately sparse bridge/rock region with matching counts and visible road structure is a density/content classification, not evidence of a streaming loss.

The original screenshot lacks seed/Trip Code, exact route distance and Worker/commit telemetry. In-game 2:41 and dashboard 251km/h alone do not uniquely identify its position or cause. Do not close issues #7/#9 or authorize another goal solely from desktop results. Julia should review the measured bottleneck and physical evidence before S2/S3; no further optimization is included in S1.

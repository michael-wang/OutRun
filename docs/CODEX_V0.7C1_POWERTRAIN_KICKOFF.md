# Codex — focused vehicle-feel tuning handoff, v0.7C.1

**Prerequisite:** Verify current playable LOCAL OutRun v0.7C source & working tree; the last reported local code commits were `c87860a` and `ec7f844`. The user rejected the **v0.7C 16-L2 design direction** as a batch, but this task MUST NOT redesign L2 until the user's ~40s reference gameplay clip has been studied and event-density analysis completed.

**Other user complaints:** 238 km/h cap, too-quick acceleration, no enjoyable six-gear rhythm, tiring/shrill engine tone. This separate narrow task is the next vehicle-feel fix.

- Local repo `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. Github `main` holds docs-only, **DO NOT merge/reset/checkout it over actual playable game**.
- Create `codex/v0.7c1-six-speed-audio` from latest playable local HEAD, preserve uncommitted files. Fetch origin/main and selectively import ONLY `docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md` and `docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md`; keep local AGENTS / L2 data/reviews untouched. If newer user-approved L2 work exists locally, retain that as well.
- Prior goal's stop-after-v0.7C was for human review; the user has provided new explicit tuning requests. For permission conflicts, ask for specific ordinary-chat human authorization and respect actual sandbox approval.
- Keep original Arcade Lateral Balance, road model, world pace 1.75×, mobile dual-thumb, fixed camera and offroad. Prefer a compact gear/RPM/torque state, not a full drivetrain simulator.

## Optional owner plain-chat authorization (same OutRun Codex conversation, BEFORE Goal if automatic permission conflicts persist)

`I authorize Project OutRun v0.7C.1 vehicle-feel tuning from the current playable v0.7C checkout. Add a real six-speed automatic gearbox, change acceleration to take noticeably longer to reach a genuine 300 km/h, and make the procedural engine sound lower, smoother and less piercing while preserving audible RPM/shift events. You may branch safely, import only the powertrain specs, test and commit locally. Do not change L1/L2 composition, overwrite old feedback, push/merge/deploy, or touch other repos. I will start the Goal separately.`

## Ready-to-paste Goal

```text
/goal Tune Project OutRun v0.7C.1 SIX-SPEED 300 KM/H POWERTRAIN AND ENGINE AUDIO on the EXISTING LOCAL playable v0.7C project. Verify current C:\astra-dev\OutRun source/status/remotes and preserve latest playable HEAD (reported c87860a/ec7f844 or later). Branch safely to codex/v0.7c1-six-speed-audio. Fetch origin/main and selectively import ONLY docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md and docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md; DO NOT merge/reset docs-only main over game. Read and implement those specs.

FIRST benchmark current acceleration 0-100/0-200/0-238. Deliver a genuinely functional six-forward-gear AUTOMATIC drivetrain with real gear state and RPM rise/drop and five distinct full-throttle upshifts, short smooth torque transition, no gear hunting, naturally downshifting when braking, readable current gear near existing gauge and NO new phone thumb shift controls. Retune acceleration to remain fun but take meaningfully longer to accelerate; initial target 0-100 ~4-6s, 0-200 ~14-20s, 0-300 ~32-45s, with an actual attainable 300 km/h on a long flat road at default 1.75x coherent world pace. Rework current synthetic engine audio to warm/full/softer, tame sharp high-frequency harmonics and unwanted screeches, use RPM/load/gear to produce convincing rising note and distinct soft shift pitch drops, no clipping or harsh gain spikes; keep mute/gesture policy, no unlicensed audio recordings. Preserve existing fun Arcade Lateral Balance, steering, all previously accepted r2 BRK content and all v0.7C L1/L2 generator/profile data, normal Pixel 8 controls and PWA, lane widths/terrains/occupants. DO NOT attempt to redesign L2 or impose arbitrary L1 event counts in this task; user-provided reference clip needs separate verified review. Actually drive to 300 and record gear/time/RPM/speed/audio clips; test acceleration/shift/downshift behavior and no leakage across L2 replay, run build/unit/Playwright, fix bugs, commit locally and write docs/V0.7C1_POWERTRAIN_HANDOFF.md with measured old/new bench and audio samples. No push/merge/public deploy, v0.7B, road generator rewrite, economy, TopWar or other repos. Stop for human powertrain/audio playtest.
```

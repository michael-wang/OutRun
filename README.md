# Project OutRun

Independent original 3D arcade driving game inspired by the *feel* of classic Out Run / OutRun 2, not licensed SEGA content. Only original / properly licensed art and sounds. Internal project title is not a cleared public name.

## Current status — v0.7C delivered, L2 batch design NO-GO

Codex completed local v0.7C with 18 L1 profile shapes, 16 L2 lab previews and precise local feedback. Source is in the user's **LOCAL `C:\astra-dev\OutRun` checkout**; last reported local commits `c87860a` implementation and `ec7f844` handoff. GitHub `main` is mostly **planning/docs**, never reset/merge/check it out over the playable code.

**Critical human finding:** despite technically green tests, the 16 L2 designs mostly FELT like one overlong L1 road effect, not a short rich driving experience. The old spec's row was one C+E+W for the entire L2, no temporal arrangement of multiple local events. See [v0.7C product postmortem](docs/V0.7C_L2_DESIGN_POSTMORTEM.md). User declared a batch design NO-GO. Their exported JSON recorded specific REJECT for L2-001..004 and UNREVIEWED for L2-005..016; don't fake ratings.

## Owner's next three vehicle-feel requests

1. Real, enjoyable **SIX-speed shifting** (initial automatic to preserve phone thumb layout), with slower full-throttle acceleration.
2. Real attainable **300 km/h maximum** versus current ~238 km/h, at the accepted 1.75× optical world pace and without sacrificing existing steering/drift.
3. A **warmer, smoother engine sound**, less shrill, with RPM-responsive tone and distinct gear changes.

**Focused future Codex order**: [v0.7C.1 powertrain/audio spec](docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md) and [kickoff](docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md). This is a separate narrow vehicle-feel change. The exact next L2 design needs analysis of the owner's ~40s gameplay reference; do not invent its event count or hardcode 3–5 L1 based on earlier hypothetical wording.

## Still-valuable accomplishments

- L1 C01–C08 / E01–E06 / W01–W04 technical vocabulary (verify exact local implementation and future combinations).
- v0.7C praise/issue buttons, anchored user feedback, overall rating and local export.
- Original **eight BRK-01..08 r2 human-KEEP** playable bricks, genuine road width and steep elevation.
- Original human-approved **Arcade Lateral Balance**, soft four-stage steering, bounded off-road penalty and expressive car animation.
- Pixel 8 landscape full screen/PWA two-thumb controls and PC A/D+Space/Enter, 3 Three.js scenic acts.

## Working documents

| Resource | Purpose |
| --- | --- |
| [L2 Design Postmortem](docs/V0.7C_L2_DESIGN_POSTMORTEM.md) | Why a technically correct 16-L2 matrix still felt like one L1 |
| [Powertrain/Audio Specification](docs/V0.7C1_POWERTRAIN_AUDIO_SPEC.md) | Six gears, slower 0→300 and softer engine tone |
| [Powertrain/Audio Codex Kickoff](docs/CODEX_V0.7C1_POWERTRAIN_KICKOFF.md) | Safe limited next vehicle-feel Goal |
| [Original v0.7C Spec](docs/V0.7C_SPEC.md) | Historical first 18 L1 / 16 L2 design, NOT correct L2 product target |
| [Original L2 Matrix](docs/V0.7C_L2_COVERAGE_MATRIX.md) | Historical coverage matrix illustrating the design mismatch |
| [R1/R2 Human BRK Reviews](docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json) | Eight historic approved BRK bricks |
| [Procedural Strategy](docs/PROCEDURAL_JOURNEY_STRATEGY.md) | Long-term curated procedural journey direction |

### Codex workflow

Work only on latest playable LOCAL OutRun branch. Stop and ask for user authorization when required by sandbox. Fetch/selectively import current relevant docs without merging documentation-only main over source. No push, merge, public deploy, TopWar edits, unlicensed assets or unrelated work. New goals must not replace human feedback with machine PASS results.

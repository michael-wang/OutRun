# Project OutRun

An original browser arcade-driving game inspired by the joy of classic Out Run / OutRun 2, not a licensed SEGA remake. Use only original/license-cleared visual and audio assets; §Project OutRun§ is an internal name, not a cleared public brand.

## ACTIVE: v0.7D — True Multi-Placement L2 Composer + targeted car/mobile UI tweaks

**Latest user-playtested build:** v0.7C.1 (LOCAL implementation §f0ec3f7§, handoff §d1fea62§). The user has accepted the newly warmed engine sound and **144 CSS px horizontal mobile steering travel**. The user now wants:
1. **More believable six-speed upshifts**: transient real engine/wheel torque interruption and corresponding physical acceleration response, so the speed may naturally pause/dip rather than shift as if uninterrupted. No artificial subtracting from displayed speed.
2. **Smaller lower-mobile speedometer**: Current dial overlays the top-left MENU; shrink to ~20–26% screen height and move down near the left side of the car, keeping 0–300 dial and gear legible. Menu remains visible AND clickable.
3. **Shorter-height mobile steering panel**: remove redundant title/instruction captions, slim vertical footprint near lower-left while KEEPING the already approved 144px full steering thumb travel, 9 effective detents and multi-touch.
4. **True multi-event L2 Composer**: old v0.7C batch defined one C+E+W per entire 30–60s and was a PRODUCT NO-GO. Implement distance-localized L1 instances with several changes over one 25–40s micro-journey. Deliver **THREE** testable L2 pilot routes only. Distinct road beats in sequence and overlapping channels, no arbitrary fixed primitive count.

Both tweaks and Composer are in **one SEQUENTIAL v0.7D Goal**, from latest user-tested v0.7C.1; NOT two parallel Goals on one checkout. Do NOT proceed to mass generate new 16 L2 or v0.7B before new human approval.

### Current authoritative files

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | v0.7D scope and local safe workflow |
| [v0.7D Specification](docs/V0.7D_TRUE_L2_COMPOSER_SPEC.md) | Shift physics, compact mobile HUD, multi-placement L2 |
| [v0.7D Acceptance](docs/V0.7D_ACCEPTANCE.md) | Shift and real menu/touch layout, 3 pilot routes |
| [Codex v0.7D Kickoff](docs/CODEX_V0.7D_COMPOSER_KICKOFF.md) | Current autonomous Goal and plain-chat authorization |
| [37s Reference Beat Analysis](docs/REFERENCE_37S_DRIVE_BEATS.md) | Grounded coarse image-based reference timing |
| [v0.7C Root Cause](docs/V0.7C_L2_DESIGN_POSTMORTEM.md) | Wrong composition unit (whole-route triple) |
| [18 L1 Shape Library](docs/L1_PRIMITIVE_CATALOG.md) | Reusable technical primitives |
| [R2 Human KEEP Reviews](docs/reviews/V0.7A1_R2_HUMAN_REVIEWS.json) | Earlier 8 accepted experiences and revision integrity |
| [Roadmap](docs/ARCADE_DESIGN_BACKLOG.md) | Future actual gameplay milestones |

### Git preservation
Playable app is at **LOCAL §C:\astra-dev\OutRun§**, not on GitHub docs-only §main§. Branch from local current playable HEAD and selectively import latest v0.7D docs; never merge/reset/checkout docs-only main over source. Preserve already human-approved speed/bar/audio behavior and review localStorage/exports.

Existing project: Three.js + TypeScript + Vite, real 3D 2–8-lane road, altitude/terrain, accepted Arcade Lateral Balance, 1.75× travel pace, 4 soft steering detents per side, original animated convertible/wheels/occupants/hair and coast/canyon/city environments, Pixel 8 landscape fullscreen PWA/two-thumb swap and PC A/D + Space/Enter.

### Handoff
Use current v0.7D kickoff in the SAME OutRun Codex conversation: send ordinary authorization first if needed to supersede stop-after-v0.7C.1, then start a new §/goal§. Codex implements, checks real browser moving footage/phone hitboxes, unit/E2E, commits locally and produces §docs/V0.7D_HANDOFF.md§. No push/merge/public deployment, TopWar changes, runtime telemetry or automatic next version.

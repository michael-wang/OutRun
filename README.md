# Project OutRun

Original browser 3D arcade-driving game inspired by the joy of classic Out Run / OutRun 2; not a licensed SEGA remake. Use only original or appropriately licensed artwork, vehicles and sound; internal title is not a cleared public brand.

## CURRENT OWNER-APPROVED MILESTONE: v0.7A.1 — Verticality & Variable Width

The **playable v0.7A** Brick Lab was implemented in the user's LOCAL Windows checkout (`b6ee7ea`, `e6e80f0`). The owner personally drove and rated **all eight first-round challenge bricks**:

- **KEEP (6):** BRK-01 Coastal Panorama, BRK-02 Double-S, BRK-04 Canyon Brake, BRK-06 Edge Discipline, BRK-07 City Boulevard, BRK-08 Harbor Hairpin.
- **REWORK (2):** BRK-03 Crest & Reveal and BRK-05 Downhill Acceleration. Both have the precise note **"More radical height delta."**
- **Global requirement:** Road width visually never changes; create REAL drivable 2-, 4-, 6- and 8-total-lane roads with smooth readable narrowing and widening.

**Product decision:** improve bricks before composing. v0.7A.1 reworks the existing eight with true dramatic 3D elevation and variable road geometry; **v0.7B 5-minute Pacific Road Trip is NOT yet authorized**. Player reviews control the production brick catalog; changed geometry requires revisioned re-review, no fake votes.

### Active development and review resources

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | New v0.7A.1 local Codex scope / repo safety |
| [v0.7A.1 Spec](docs/V0.7A1_SPEC.md) | BRK-03/05 hills, true 2–8-lane geometry, reviewed-brick revision scheme |
| [v0.7A.1 Acceptance](docs/V0.7A1_ACCEPTANCE.md) | Actual slope/width/motion, review-preservation and gameplay tests |
| [v0.7A.1 Codex Kickoff](docs/CODEX_V0.7A1_KICKOFF.md) | New autonomous Goal, normal-chat authorization and local branch prep |
| [Actual R1 Human Votes](docs/reviews/V0.7A_R1_HUMAN_REVIEWS.json) | Original KEEP/REWORK/REJECT decisions and notes (archived) |
| [8 Challenge Brick Descriptions](docs/CHALLENGE_BRICK_CANDIDATES.md) | Existing tested concepts |
| [Procedural Journey Strategy](docs/PROCEDURAL_JOURNEY_STRATEGY.md) | Later curated generation and two modes |
| [v0.7B Direction](docs/V0.7_PLAYABLE_PROTOTYPE_PLAN.md) | Five-minute Guided Journey after revised bricks pass human review |

### Protect the local code

GitHub `main` is primarily docs. The real playable app is at `C:\astra-dev\OutRun` on a LOCAL feature branch, latest reported v0.7A code `b6ee7ea` and handoff `e6e80f0`. **Never merge/reset/checkout documentation-only main over source code.** Codex must branch from playable local HEAD and selectively import the four v0.7A.1 docs + archived R1 reviews.

**Workflow:** FIRST send explicit authorization in an ordinary Codex chat (to avoid the old stop-after-v0.7A approval deadlock), THEN start new Goal using `docs/CODEX_V0.7A1_KICKOFF.md`. Codex owns coding, visual/video QA, browser regression, tests and local commits. Human owns R2 ratings. No public deployment, push, merge, other-repo edits or v0.7B without permission.

### Protected gameplay

Three.js/TypeScript/Vite; genuine 3D road/cars and three scenic biomes, Accepted Arcade Lateral Balance steering, 4 soft detents each side, 1.75× travel pace, exaggerated controlled yaw and animated occupants/wheels, car-left analog speedometer, bounded offroad, playable fast/brake turns. Pixel 8 landscape fullscreen/PWA dual touch, swappable hands and PC A/D + Space/Enter must remain.

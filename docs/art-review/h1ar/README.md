# H1aR — Approved heroine appearance → real 3D prototype (LOOKDEV)

Date: 2026-11-14. **2D CHARACTER DESIGN APPROVED BY OWNER. 3D MODEL NOT YET PRODUCED/APPROVED.**

## Reference precedence (IMPORTANT — now supersedes previous exploratory status)

1. **Female protagonist's exact visual identity**: the owner explicitly approved the NEW front/45°/profile concept made by Julia as **"this is exactly my heroine"**. Preserve her *face, almond-shaped warm-brown eyes, eyelids, natural small nose, subtle confident smile, softly tapered jaw, short layered swept blonde bob, broad sculpted hair locks, golden diamond earrings and cream halter/sleeveless neckline*. Do NOT generate a different face or hairstyle merely to resemble a generic 3D character.
2. **Whole-world art style**: the original [Style Option B](../../../art/reference/coast/03_STYLE_B_coastal_highway.png) continues to control vehicle, buildings, environment, palette and broad stylized arcade 3D treatment. Where the older Style B female differs from the newly approved heroine (e.g. eyes/accessories/neckline), the **new approved heroine wins** for THIS person.
3. Earlier H1a coded-face attempt (`v0.10.18`) is VISUALLY REJECTED. Do not refine `src/passenger-face.ts` or ship its appearance as the final heroine.

### Approved source archive

User download: **`OutRun_H1aR_APPROVED_3D_REFERENCE_2026-11-14.zip`**, given in ChatGPT on Nov 14. This archive **replaces** the earlier exploratory `OutRun_H1aR_Lookdev_2026-11-14.zip` whose README incorrectly says "not approved" now that the owner has chosen the look.

Put ZIP **outside Git** or in ignored local staging; do not commit ZIP, gigantic generated candidates or API secrets.

Inside the new ZIP:

| File | Role | SHA-256 |
| --- | --- | --- |
| `01_APPROVED_FRONT.png` | **Primary canonical character identity** and candidate image-to-3D front input | `58b7ba936a981a0c58847d306742018f4f0e556ad3f8328c08ddb04c0931551d` |
| `02_APPROVED_THREE_QUARTER.png` | Front-oblique proportions and face/hair continuity | `9e61e0b86ec7eaa49966d56cf9193edcde532805d23bd3b60c3b6476ed5bb06e` |
| `03_APPROVED_PROFILE.png` | Profile nose/chin/hairline; **nose points screen-left** | `c011cbb08aaa27fd6b5ad47c965033c0ad1be469813b57960ecf8964fe2a04a7` |
| `04_APPROVED_THREE_VIEW_SHEET.png` | Comparison only, NOT image-to-3D input | `7b0e29254250ea481bfdc0dc943f3987d5c2c332481866ddd532c0d52b03b727` |
| `05_STYLE_B_ORIGINAL_REFERENCE.jpg` | Art world style reference, NOT primary heroine identity | `4a3e215eadf61fd685169269ec17c8bc241d221ef916d475265423f008541d67` |

Images are AI-authored *concepts*, **not** orthographic projections of an existing physically consistent model. Reconcile minor geometric contradictions by preserving the front-view identity and coherent 3D shape.

## 2026-11-14 budget correction — NT$0, supersedes paid suggestions below

The owner has explicitly set **zero additional spending** on AI or 3D production. Do not use fal paid inference, Meshy/Tripo subscriptions, cloud GPU credits, purchased models, or trials that require a credit card. **The complete current local execution plan is [Zero-cost 3D Pipeline](../../COAST_CHARACTER_ZERO_COST_3D_PIPELINE.md), tracked in Issue #38.** Any earlier references on this page to a paid cloud model are historical and no longer authorized.

Codex should test a **local open-weight shape model** on the RTX 5070 Ti (verify driver / 16GB VRAM / CUDA compatibility first), preferably Hunyuan3D-2 shape-only; consider MIT TripoSG if license or install issues block it. Keep all dependencies, weights and candidate GLBs outside tracked game content. Import the actual mesh into Blender, render front/45°/side/back and STOP for owner art approval. Do not confuse "free model" with unconditional worldwide commercial shipping rights; document licenses.

## Codex next action: obtain/inspect an ACTUAL editable mesh

Execute [Issue #38](https://github.com/michael-wang/OutRun/issues/38) — not the old #37 — in two strictly separated steps:

**Step A: One bounded 3D generation + Blender validation (CURRENT).**

- Unpack approved ZIP and verify hashes. Use the isolated **front image** for a first image-to-3D candidate; optionally add 45°/profile only if the chosen model officially supports those camera angles and you verify left/right convention. Never upload the entire multi-character Style B board or the three-view contact sheet as the subject.
- **Local only, no paid provider:** Hunyuan3D-2 shape-only on the owner's GPU, or TripoSG MIT as a fallback. Preflight CUDA 12.8+/PyTorch with RTX 5070 Ti Blackwell compatibility, use isolated installs outside the repo, and follow the [zero-cost pipeline](../../COAST_CHARACTER_ZERO_COST_3D_PIPELINE.md). A paid inference fallback is prohibited.
- A suitable licensed artist-authored character-base mesh adjusted in Blender is an acceptable fallback, with source/license preserved, but not another hand-coded math/ellipse face.
- Download candidate GLB into ignored local staging and **import in Blender**. Check REAL geometry under rotation: eyes/lids, nose, smile, sculpted hair volume, side profile and back of head (the back is not covered by the concept), transparent/painted-on details, neck/bust transition, separate earrings. Refine artistically in Blender **only when already near target**, not by writing a new giant procedural facial script. Save editable `.blend` source.
- In `docs/art-review/h1ar3d/`, create a short README and **actual Blender renders**: front, 45°, side, back, and one warm golden-hour 45°; include a comparison with the approved references. No AI-enhanced fake screenshots, no painted image planes passed off as geometry. Capture a simple viewport wireframe or Blender scene hierarchy for evidence.

**Step B: visual review gate (STOP).** Present renders, model source/licensing, GLB/Blend paths, approximate triangle/texture complexity, any provider credits spent, and most significant remaining mismatches to Julia + owner. **Do not proceed to game integration, retopo, rigging, morph targets, LOD, or full-body modeling until the actual 3D asset is explicitly approved.**

### Explicit rejection conditions

Reject generic doll-face, heavily anime-proportioned/flat eyes, painted-on teeth, lumpy/sharp nose, banana/wedge hair, hair lacking its distinctive sweeping silhouette, faceted cheeks, a perfect 2D front with unusable side/back, grotesquely merged earrings/neckline, and plastic skin. Lighting and textures matter but cannot hide broken anatomy.

## Process and efficiency

Existing game H1a remains as-is during the model trial. The true deliverable is a reviewable 3D sculpt, **not code volume, tests or a screenshot based on 2D planes**. No scene/road/vehicle changes, `main` release, or lengthy full-game tests for a Blender-only experiment. Do not burn Codex quota on repeated AI retries: test at most **one** candidate, report if it fails. Separate subsequent game integration into a later accepted task.

Read [art recovery](../../COAST_CHARACTER_ART_RECOVERY.md) and [character master strategy](../../COAST_CHARACTER_ASSET_STRATEGY.md).

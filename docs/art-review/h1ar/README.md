# H1aR — Female passenger character look-dev, NOT game integration

Date: 2026-11-14
Owner's current approved reference: **Style Option B** — [art reference PNG](../../../art/reference/coast/03_STYLE_B_coastal_highway.png).
Current game implementation H1a (`v0.10.18`) remains **VISUALLY REJECTED**, despite passing technical tests.
Execution task: [Issue #38](https://github.com/michael-wang/OutRun/issues/38).
Root cause/production method: [Character Art Recovery](../../COAST_CHARACTER_ART_RECOVERY.md).

## Julia's completed first step

Julia generated (1) a cinematic character mood concept and (2) a clean front/45-degree/profile **2D character reference** based on Style B. These are **proposals, not approved art and NOT 3D meshes**. Their purpose is to reduce ambiguous text descriptions before a DCC/image-to-3D experiment.

User handoff package: `OutRun_H1aR_Lookdev_2026-11-14.zip` (available in the Nov 14 ChatGPT conversation; owner downloads once and places in the local repo root for Codex to use). Contents:

- `00_APPROVED_STYLE_B_female_reference.jpg` — crop of the original canonical Style B; compare everything to it.
- `01_NEW_THREE_VIEW_CONCEPT.png` — new image with front, 45°, and profile in similar lighting.
- `02_front.png`, `03_three-quarter.png`, `04_profile.png` — convenience crops of that sheet.
- `05_CINEMATIC_CHARACTER_HEAD_MOOD.jpg` — secondary mood/appearance idea only (the misleading pseudo-UV/mesh diagrams were excluded).
- `manifest.json` and `README.md` — checksums and limitations.

**Do not assume these files are present in the GitHub repo.** This README documents the handoff, not a successful binary upload.

### Style precedence / avoid drift

The original Style Option B concept board remains the ONLY **approved** art identity. The newly generated views may be stylized differently (e.g. larger eyes, optional earrings/halter neckline) and are **not** authorization to change the approved white sleeveless outfit or character proportions. They are a test input for approving an isolated, actually sculpted character head. AI-generated perspective panels are **not guaranteed true orthographic views or perfectly consistent 3D measurements**; validate shape after a model is obtained.

## Actual 3D tool trial — bounded, gated

To progress to a real editable head mesh, prefer:
1. If the owner connects a suitable 3D-capable provider (e.g. fal in ChatGPT), test **one** candidate with a cropped single portrait or supported multiview inputs; take care that multiple views represent the same expression and head shape. fal currently advertises Hunyuan3D 3.1 Pro Image-to-3D with optional multiview and GLB return, Trellis 2 and other options; **check current pricing and capabilities before a paid run**. No automatic credit spend. Provider page: https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d
2. OR import an artist-sculpted commercial-safe stylized base head with verified license into Blender and edit to match reference, without needing a provider connection.
3. Inspect the **real editable mesh in Blender** from front/45/profile under neutral and coast-dusk lighting, with no Photoshop-style cutout tricks. Assess eyelids, cheekbones, mouth, nose profile, hair shape and material response. If poor, **discard promptly** rather than repair with a new coded ellipse/triangle maze.
4. **STOP for owner + Julia visual acceptance BEFORE** driving-LOD, rigging, Three.js integration, speed/frame-time benchmarking, or further character models.

## QA deliverable (future, not yet done)

- Source .blend/mesh file and GLB if trial actually succeeds (none delivered by this documentation).
- Paired renders: original B crop vs true 3D head, frontal, 45°, side; clear pass/fail and remaining artistic gaps.
- Model origin, license, editable pipeline and approximate geometry/texture costs.
- A brief recommendation for the next action; **no game/source mutation** in this gate.

## Reason for this workflow

The prior H1a already passed `npm run verify:dev`, had lower face draw calls and acceptable geometry counts, yet looked far from Style B. Visual acceptance must now precede engineering work. Avoid burning limited Codex quota on another technically impeccable but visually unacceptable result.

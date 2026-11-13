# R5d-H1aR — ZERO-EXTRA-COST character 3D pipeline

Decision: 2026-11-14. **Owner budget for additional paid AI / 3D services is exactly NT$0. This supersedes all earlier suggestions to use a paid fal / Meshy / Tripo service.**

## Approved look / deliverable

- Design is APPROVED as 2D: `OutRun_H1aR_APPROVED_3D_REFERENCE_2026-11-14.zip` in the owner/Codex local handoff. See `docs/art-review/h1ar/README.md` for checksums and reference precedence.
- The first deliverable is an actual, editable, rotatable Blender head + bust candidate and four neutral/dusk renders. Not yet an animated game asset.
- Source code faces from `v0.10.18` are **rejected visually**. Do not reproduce that route with TypeScript or Blender Python ellipses.

## Strict cost rule

**NO** paid cloud GPU, subscription, prepaid credits, free trials requiring a credit card, commercial API inference, model purchases, purchased assets, or exposure of API tokens. Freely downloadable open-weight models and no-cost licensed Blender assets are allowed. Owner approval is not required for the zero-cost local workflow but is required for visual acceptance. Document license terms before considering shipping; 'free inference' does not automatically mean unrestricted worldwide commercial distribution.

## Local first: RTX 5070 Ti (16GB) image-to-3D candidate

Codex's H1a report measured on an **RTX 5070 Ti** desktop. Actual available VRAM and environment need a new local check.

**Preflight (no installation / repo change):**

```powershell
nvidia-smi
py -0p
# If an isolated AI Python already exists:
python -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No CUDA')"
```

The RTX 5070 Ti is NVIDIA **Blackwell / sm_120**. Do not blindly install a PyTorch 2.5 / CUDA 12.4 pinned stack from an older model README and assume it supports this GPU. Use a **compatible official CUDA 12.8+ PyTorch build**, and check custom extension compatibility; PyTorch 2.7 introduced Blackwell support. Native Windows modules may still fail to compile. Preserve working OutRun Node/Three/Vite environments.

**Attempt one local inference backend**, ideally in a separate venv and cloned sibling folder outside OutRun:

- **Primary trial: Tencent Hunyuan3D-2 / shape-only**. Official source: https://github.com/Tencent-Hunyuan/Hunyuan3D-2. Their documented minimum is ~6GB VRAM for shape only; full shape+texture is quoted at ~16GB total and may OOM on the 16GB card, so do **NOT** enable the full texture pipeline initially. The repo contains an image→mesh script/pipeline; export local GLB/OBJ, import it into Blender and render. An independently maintained Windows/low-VRAM port exists: https://github.com/deepbeepmeep/Hunyuan3D-2GP, but review third-party code/versions before running it; not a magic one-click guarantee.
- **Fallback when environment/licenses make Hunyuan unsuitable: TripoSG**, official MIT repo https://github.com/VAST-AI-Research/TripoSG, reports >=8GB VRAM and a `python -m scripts.inference_triposg --image-input PATH --output-path PATH.glb` entry point. This produces a **shape candidate**, not automatically a perfect fully textured game-ready animated heroine.
- **Lightweight fallback:** Stable Fast 3D https://github.com/Stability-AI/stable-fast-3d, ~6GB VRAM and textured GLB; Windows support experimental, and its Community License imposes commercial terms/thresholds that MUST be reviewed for potential release. Prefer MIT/CC assets if license friction is significant.

**IMPORTANT: no setup rabbit hole.** If GPU kernel / Windows / xformers / dependencies fail for the chosen backend, document the exact failure and pivot to the *free model-base* path below; do not endlessly install CUDA variants or reconfigure the game project.

### Input image discipline

- From approved ZIP use `01_APPROVED_FRONT.png` for first attempt; *not* the multi-panel contact sheet or original six-asset Style B board.
- Treat `02_APPROVED_THREE_QUARTER.png` and `03_APPROVED_PROFILE.png` as **comparison references** unless the selected local model explicitly supports true multi-view images and camera conventions can be established. They are AI drawings, not orthographic photographs of the same mesh.
- A full head and back-hair geometry is expected. Eye/hair/mouth details must be 3D, not flat cutout textures disguised as topology.

## No-GPU or rejected AI fallback: genuinely free Blender reference model

Use [Blender Studio Rain v3](https://studio.blender.org/characters/rain/v3/) as a **free CC-BY** human-shaped rig and sculpt starting point, if appropriate for the heroine's shape. Credit the original per CC-BY. The source is a *base to modify*, never a candidate to relabel as the heroine without visible artistic redesign. It may be a poor stylistic match; inspect before investing. Alternately search genuinely free/CC0 licensed stylized heads from their primary publisher; verify licensing and derivatives. 

Blender can be used interactively or with small bpy scripts for **import, lighting, rendering, mesh cleanup and repeatable export**. This does **not** authorize recreating the full facial design via mathematical sphere/ellipse scripts (the failed H1a method). AI/Codex still needs visual feedback and a model that already looks close to the approved concept.

## Gate / evidence

1. No spending; capture OS/GPU driver, available VRAM, Python/PyTorch/CUDA compatibility and model chosen.
2. ONE real mesh candidate. Export as Blender-editable `.blend` and `.glb` **only if the model is useful**. Keep large weights/model output outside the tracked Repo.
3. Under neutral lighting: actual Blender front, 45°, profile, back, and one dusk-light preview. Compare alongside the approved 2D design. Show Blender mesh wireframe so true 3D geometry is evident. Save **small screenshots only** and short README in `docs/art-review/h1ar3d/`.
4. **Stop before gameplay integration**. No source edits to `src/car.ts`, `src/passenger-face.ts`, `src/hero-groom.ts`, `src/occupants.ts`, no morph, LOD, collision, male head, full-body or `main` release until the user and Julia APPROVE 3D renders.
5. Report honest failure if the face is generic/unattractive. Do not infer aesthetic PASS from triangle counts, test results or script completion. If local route cannot be installed for free, submit the exact blocker and pick a licensed base model, rather than suggesting a paid workaround.
6. No automatic `npm run verify:dev` when only a Blender sandbox and documentation change. Codex usage is also a budget: **one bounded attempt**, local test evidence, and stop.

## Official sources and licensing notes

- Hunyuan3D 2 repository and VRAM: https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- Hunyuan3D 2 **Tencent Community License** (not MIT/Apache): https://github.com/Tencent-Hunyuan/Hunyuan3D-2/blob/main/LICENSE ; includes territory and commercial distribution conditions. Check whether output can be shipped to the intended audience **before** public release; keep local R&D separate from approved shipping assets.
- TripoSG MIT code: https://github.com/VAST-AI-Research/TripoSG ; model card: https://huggingface.co/VAST-AI/TripoSG . Check model and auxiliary weight licenses individually.
- Stable Fast 3D: https://github.com/Stability-AI/stable-fast-3d ; its Community License is not unconditional free commercial usage.
- Blender Studio Rain v3 free CC-BY: https://studio.blender.org/characters/rain/v3/
- NVIDIA 5070 Ti Blackwell GPU: https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/
- PyTorch 2.7 Blackwell/CUDA 12.8 release: https://pytorch.org/blog/pytorch-2-7/

No paid service account is needed, and the user's willingness to spend on separate tooling must **never** be inferred from their ChatGPT plan.

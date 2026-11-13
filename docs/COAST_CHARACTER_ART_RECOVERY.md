# OutRun R5d — character art recovery: H1a visual rejection and new asset-authoring gate

Date: 2026-11-14. Status: **H1a v0.10.18 is technically verified but VISUALLY REJECTED by the owner**. Do not promote the appearance to main, do not clone the face into the male driver, and do not continue the same parametric-face refinement loop.

## Verified failure, not a renderer defect diagnosis

- The approved reference is [Style Option B](../art/reference/coast/03_STYLE_B_coastal_highway.png), especially its passenger portrait.
- The rejected [H1a output](art-review/h1a/README.md) looks like a simple procedural 3D game NPC rather than a polished charming stylized arcade character. Compared with reference, the whole facial design, head shape, eyes, smile, hair flow and material/lighting response diverge. Increased geometry count or passing geometry budgets does not make the face artistically correct.
- The [H1a implementation](../src/passenger-face.ts) directly produces one geometry through coded skull cross-sections, mathematical relief, separate eye and mouth patches and vertex colors. [Hair](../src/hero-groom.ts) is likewise generated through parametric strips, curves and instancing. **No Blender-sculpted source model, manual DCC correction or third-party authored mesh was used in H1a.**
- Codex legitimately chose the lower-risk option permitted by the original ticket, but that option was wrong for the user's high-fidelity character visual goal. The acceptance sequence also failed: the reference-to-portrait comparison did not stop game integration.

## New division of labor

- **Art direction (Julia + owner):** produce/approve a clearly isolated female character reference sheet or head concept suitable for 3D reconstruction; choose face silhouette, hair clumps, eye shape, cheek/nose/mouth, expression and shading. Review a 3D portrait BEFORE any runtime work.
- **3D source (editable mesh):** acquire a genuinely artist-authored, licensed stylized base head OR try a tightly limited image-to-3D candidate. Use Blender as the canonical editing/cleanup tool. Codex can import/retopologize, automate exports and make material/animation adapters, but **a Blender Python script generating fresh facial curves from numbers is not an acceptable substitute** for an approved appearance.
- **Game engine (Codex):** once appearance is approved, export approved GLB and wire the face/head pivot, wind-groom and facial expression into the existing vehicle without unrelated architecture changes. Preserve a lightweight driving profile and a distinct portrait profile derived from the same identity.

## Low-cost H1a recovery trial — STOP at the portrait gate

1. Crop/isolate the *approved female* reference; the full six-asset board is not a suitable input for image-to-3D. Establish a consistent front, 3/4 and profile head study (no conflicting hairstyle/proportions across views). It is fine to use AI image generation to create a consistent turnaround as an authoring aid, but it needs visual acceptance before expensive 3D work.
2. Bring **at most two alternative sources** to 3D for comparison:
   - A high-quality licensed stylized female base mesh, modified in Blender toward the selected face, **or**
   - One targeted multi-view image-to-3D trial via Meshy/Tripo (requires owner-run account/credits and approved terms). AI output is a candidate, not an expected production-ready, rigged face.
   The user must authorize any external paid service or resource purchase. Codex must not open subscriptions or spend credits without approval. Record source/licence/attribution.
3. In Blender, assess front, 3/4, profile, eye/eyelid anatomy, smile/lip topology, hair grouped volume and realistic-for-arcade skin material. Repair or re-sculpt only if candidate is already near reference; **do not use scripted spheres/ellipsoids to rescue the same approach**. Abandon bad candidates early.
4. Render one review board with reference crop beside **front, 3/4 and side** shots, including one neutral-light setup and one sunset-light setup. The art must pass the owner's aesthetic review **before** LOD, morph targets, driving animation, Three.js integration or performance polishing.
5. After owner approval, create/retain Blender source and optimized GLB, preserve facial expression landmarks and do a separate, narrow gameplay integration work ticket. Verify actual cockpit and chase view, animations, geometry/draw calls and Pixel 8.

## Explicit art rejection criteria

Reject if the face reads as a generic mannequin, eyes/eyelids are stickers or unnatural, nose and lips lack believable shape from side, smile feels like a painted line, layered blonde hair is a set of thick bananas/wedges instead of coherent flowing groups, or skin is flat/plastic. 'Matches concept' must be demonstrated in three angles at **similar crop, focal length and lighting**, with real Blender/GLB renders, not code-review assertions.

## Resources and constraints

H1a costs measured on desktop (3,060 driving face/hair triangles, 4 draws; 21k portrait geometry), **not** proof of useful fidelity. A great-looking low-poly character may need baked normals/color/texture and good lighting more than extra triangles. The two profiles must come from one approved identity, not two unrelated character models. Codex quota is scarce: no repeated long prompt-driven mesh guessing, no premature local integration and no whole-game `verify:dev` for off-runtime model experiments.

References:
- [H1a report](art-review/h1a/README.md)
- [Character Master Strategy](COAST_CHARACTER_ASSET_STRATEGY.md)
- Meshy [multi-image input API](https://docs.meshy.ai/en/api/multi-image-to-3d) and [face/hand limitations](https://help.meshy.ai/en/articles/16102152-fix-character-pose-face-and-hand-issues-in-meshy)
- Tripo [multi-view inputs](https://www.tripo3d.ai/product-doc/model-generation/multi-view-to-3d) and [export to DCC / GLB](https://www.tripo3d.ai/product-doc/export-and-integration/export-dcc)

No runtime source is altered in this decision document; v0.10.18 remains a development-only experiment pending the visual replacement or rollback. This is **a visual rejection**, not a claim that the code/tests failed.

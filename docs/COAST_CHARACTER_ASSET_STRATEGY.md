# Coastal Highway — Character Master / Gameplay Variant Strategy
Date: 2026-11-14
Status: owner direction; H0 visual review complete; H1/H2 3D work pending owner visual acceptance.
Reference: [Style Option B](../art/reference/coast/03_STYLE_B_coastal_highway.png).
Related: [H0 game captures](art-review/h0/README.md), [vehicle art track](COAST_HERO_VEHICLE_ART.md).

## Product requirement: the same two people must look good in the cockpit AND standing for a front-facing photograph

The owner expects possible full-body standing portraits, race end photographs and character presentations in the future. The currently simplified, seated-only faces are not sufficient as final character identity. Their faces need to be **attractive, readable, three-dimensional and consistent with the chosen slightly chunky, charming stylized arcade look**, without turning into realistic portraits or large-eyed anime.

**Do not build two unrelated male/female character models.** Author a common visual identity per character, then expose two optimized presentation profiles. They may have different topology and amount of geometry but must not drift in identity:
- `Hero / portrait`: face and hair suitable for frontal and three-quarter close-ups; full body and shoes; standing relaxed pose, optional portrait/finish-screen gestures; loaded only in a scene that uses it.
- `Driving / race`: preserve the same recognizable facial landmarks, head shape, hair and clothing but retain only upper body/visible arms (and any necessary seat-contact geometry); keep existing wind hair, waving/cheering, steering and left-hand-on-door behavior; light enough for persistent Pixel 8 rendering.
- Shared semantic design source: face landmarks, hair grouping, complexion, hairstyle, eye shape, outfit palette and proportions. Source geometry/texture code or Blender source should be traceable; do not attempt runtime duplication of two arbitrary meshes.

This is **one character identity with two presentation exports/profiles**, not two independently designed characters. Do not load a full standing character or invisible lower-body geometry during racing.

## H0 assessment: why small eye-dot tweaks alone are not the finish line

At `docs/art-review/h0/05-cockpit.jpg`, the current eyes read as dots/flat black ovals, with almost no expressive lid/cheek/mouth form. Both faces are weaker than the excellent existing silhouette/body-color readability. A single extra eyebrow or mouth stroke may serve as a quick hypothesis, but must **not** be labeled "photo-ready" unless the face genuinely works from front and 3/4 views.

At `02-driving.jpg` the head/hair silhouettes must still work while moving; preserve that. At `03-front.jpg` and `04-side.jpg`, vehicle polish is a separate follow-up; avoid mixing it into the first character H1 iteration.

## Suggested modeling strategy (minimal risk to existing architecture)

Current production vehicle and occupants are procedural Three.js geometry in `src/car.ts`, `src/hero-groom.ts`, `src/hero-tailoring.ts` and `src/occupants.ts`, not a preexisting, shared Blender rig. The current driver/passenger head groups already have separate pivots and wind-groom update logic.

1. **Look-dev first.** Select one character (passenger first) and create a *head + hairstyle prototype* compatible with Style Option B. Model credible eye socket/lid/eyebrow form, iris readability, nose volume, mouth corners/smile and cheek/chin silhouette. Use a few sculpted coherent clumps for hair, not many transparent cards. If Blender production pipeline is verified, prefer an editable Blender master export with a controlled lightweight gameplay profile; otherwise prototype within the existing procedural geometry pipeline without a speculative migration.
2. **Test neutral portrait before seat integration.** Capture clean front, 3/4 and profile with neutral and smiling expressions at intended photo scale. Preserve matching silhouette and colors under dusk lighting.
3. **Integrate ONE gameplay head only** (female passenger first), retaining existing seat scale, gestures, hair wind and frame-time baseline. Do not re-author the whole car/body or require `createCar()` to become async unless a benchmarked asset path actually justifies it.
4. **After owner acceptance**, apply same face design language to male driver (young Asian man, suit, layered longer dark hairstyle), keeping their faces distinct and not using one shared face with a hair recolor.
5. **Later**, derive each full standing body from the approved character master. Need only a few poses at first; reuse an appropriate head and materials, and add the lower body, feet, clothing continuation and simple skeletal/pose controls when a specific photo/finish feature is specified.

There is no requirement for one identical high-poly head mesh in both profiles. **Identity is shared, geometry complexity is purpose-specific.** Prefer composition and reusing existing pivots/hair motion over a general character engine.

## Art acceptance — all are required for H1 character approval

- Works in **front view**, **three-quarter view**, and **profile**, not just a chase camera. Faces are expressive at realistic screenshot resolution, not a sticker of dots on a rounded head.
- Recognizably same person under neutral world light and accepted coast dusk: correct visual age/style, face/eye/head proportions, individual identity, coherent shading.
- Female: blonde layered short hair, sleeveless dress, confident cheerful face. Male: Asian young adult, layered medium-long dark hair, tailored suit, warm but composed face. Keep existing relative occupant-to-car size and gender presentation.
- Preserves left-hand drive, wheel/door hand placement, two characters seated comfortably, steering and cheer gestures, passenger wind hair with no alpha-card overdraw and no hair clipping under turn motion.
- Pixel 8 frame-time and memory do not materially regress, especially after existing shadow profile. Use same capture routes/seed as H0. Record draw calls, geometry count, render/update cost and source/license.
- Owner approves portrait silhouette/expression **before** H1 is called finished; then and only then derive the driving variant or fullbody family.

## Production order & quotas

- **H1a**: female face/hair prototype, portrait + one in-car view; single bounded scope, **no full-body model and no car/refactor**.
- **H1b**: male face/hair identity, use exact same QA technique and material family.
- **H1c**: controlled optimized driving versions and moving test; only adjust geometry needed to maintain art identity/performance.
- **H2 (later)**: complete standing bodies and a two-person photo pose, once there is a real target scene or screenshot. Neither gameplay mode nor scenery pilots should await H2.
- Independent tasks: Riviera lamps/wheels and white traffic silhouette as already ranked in H0. No multi-family "fix every asset" Codex ticket.

Owner should choose on image quality and game feel. Julia writes visual briefs, evaluates screenshot pairs and prioritizes. Codex builds prototypes, runs local tests, reports impact and pushes only `dev`; no `main` without explicit owner approval.

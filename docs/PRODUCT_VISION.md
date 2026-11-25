# 極速漫遊 — current product vision

An original arcade racing road trip inspired by the *feeling* of classic coastal racing games, not a recreation of protected vehicles, tracks or music.

**Now playable:** v0.10.0 development coastal highway at sunset, eight entrants, mixed traffic, steering/accelerator/brake, timed race, optional PS4 controller and touch controls, Ultra Water sea, restart and race recovery.

**Next product priority:** Remake the **first map as a learn-by-driving experience**. Begin with easy acceleration, comfortable non-drift sweepers and a banked S-curve, gradually introduce civilian traffic and staged accidents, then introduce two drift corners. Afterwards alternate hero scenery with real race challenges and conclude with a finish sprint. The owner approves by driving the course, not by abstract intensity scores.

**Art direction:** Author road first, then hero scenery, supporting scenery and restrained filler. Important views are planned (curve → reveal → vista), not selected by luck from randomized layouts. Ground, mountains and scenery must also pass **moving-camera parallax tests**, not just still screenshots. Scene events are authored windows with seeded safe variations, not indiscriminate random traffic.

**Engineering:** Keep Three.js and Ultra Water. Create general reusable rendering/game capabilities, then place assets using stage data. Other modeling tools (Blender, 67.js, etc.) may export assets, but must not force a runtime engine migration.

**Second stage:** Previous city/canyon journey proposals are not a product commitment. The next stage will be rebuilt from the new authoring workflow; no compatibility requirement for old L1/L2/L3 or scenic director.

**Shipping:** Individual game, friends-and-family playtests. Block only P0; report P1 and let the owner decide. Keep rapid edit → drive → publish.

**R5c first-map expansion:** The accepted initial driving tutorial
now flows into a 30km scenic/competitive grand tour: bay views,
cliff chase, inland rice plateau, mountain/shore switchbacks,
open-water bridge opportunity, two late technical turns and a
true finish sprint. Five Hero Scenery locations are marked but
their large 3D assets are not yet modeled. The entire ocean
edge has low visible protective railing, so the driving boundary
is visually credible. Rival competitiveness comes from actual
braking, line selection and traffic, never rank-based rubber banding.

## 2026-11-23 — Scene Studio as the next production workflow

Michael's desired environment production workflow is a **browser-based, segment-scoped authoring tool on the actual running Three.js stage**, inspired by STREETFORM's selectable building, free 3D camera, sliders, and PBR/clay/wireframe views. Every scenic stretch should ultimately be browsable, editable, and **persistable to the actual stage source**; the designer then drives the same scene to accept it. This is not the same as improving individual geometry generators or building a separate impressive static demo.

**Priority order for scenery:** prove a high-quality PC look (asphalt, rock coast, near mountains, real forest layers and cohesive sunlight) before systematically optimizing the approved look for Pixel 8 ~30 FPS. Preserve the existing authored road/physics, Ultra Water, existing accepted content and dev-first release policy. Scope, save safety, staged M0 implementation and evidence gates: [Scene Studio](SCENE_STUDIO.md); [Issue #77](https://github.com/michael-wang/OutRun/issues/77). **Recorded design direction only; editor is not implemented or accepted yet.**

## 2026-11-26 — 深夜漫遊模式 / Night Cruise (working title)

**Status: important idea / deferred, owner-approved to record only; not authorized for implementation.** The goal is a relaxing, noncompetitive driving experience: enjoy the journey rather than maximize speed. Long or potentially endless low-difficulty roads, no ranking, timer or mandatory finish; sparse noncompetitive passing/oncoming traffic, minimal optional HUD, gentle driving rhythm. Moonlight, subtle weather/lighting changes, ocean ambience and soft music (e.g. jazz) are candidate atmosphere choices.

- City: reuse the emerging parametric building system (frontage width, height, spacing, style and materials) to generate coherent neighborhoods with variety.
- Coast: generate whole landscape segments rather than isolated objects. Parameterize sandy beaches, rocky shores, cliffs, plains, road curvature/elevation/distance from sea, vegetation, and landmarks such as lighthouses, fishing harbors and viewpoints. Reuse Asset Library → Scenic Package → Stage Layout and connectors where practical.
- Route composition: use geography-aware adjacency and transitions, authored scenic reveals with seeded variation, recent-history/repetition constraints and gradual environmental changes. Avoid arbitrary random joins, obvious repeated sequences or overstimulating density. Keep authored competitive stages separate; procedural extension must prove visual coherence and performance before adoption.
- Future exploration: after city parameterization matures, assess a short coastal prototype and feasibility of streaming longer routes on Pixel 8; the exact generation architecture, duration, audio and standalone-game possibility remain open. No current milestone, runtime change, release or Judy work order is implied.

Dashboard: surface this under future ideas/design discussion history (dated 2026-11-26, important, deferred), linking to this canonical section rather than treating it as an active milestone. Preserve future discussion ideas and decisions with their dates and status.

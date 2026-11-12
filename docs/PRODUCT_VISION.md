# 極速漫遊 — current product vision

An original arcade racing road trip inspired by the *feeling* of classic coastal racing games, not a recreation of protected vehicles, tracks or music.

**Now playable:** v0.10.0 development coastal highway at sunset, eight entrants, mixed traffic, steering/accelerator/brake, timed race, optional PS4 controller and touch controls, Ultra Water sea, restart and race recovery.

**Next product priority:** Remake the **first map as a learn-by-driving experience**. Begin with easy acceleration, comfortable non-drift sweepers and a banked S-curve, gradually introduce civilian traffic and staged accidents, then introduce two drift corners. Afterwards alternate hero scenery with real race challenges and conclude with a finish sprint. The owner approves by driving the course, not by abstract intensity scores.

**Art direction:** Author road first, then hero scenery, supporting scenery and restrained filler. Important views are planned (curve → reveal → vista), not selected by luck from randomized layouts. Ground, mountains and scenery must also pass **moving-camera parallax tests**, not just still screenshots. Scene events are authored windows with seeded safe variations, not indiscriminate random traffic.

**Engineering:** Keep Three.js and Ultra Water. Create general reusable rendering/game capabilities, then place assets using stage data. Other modeling tools (Blender, 67.js, etc.) may export assets, but must not force a runtime engine migration.

**Second stage:** Previous city/canyon journey proposals are not a product commitment. The next stage will be rebuilt from the new authoring workflow; no compatibility requirement for old L1/L2/L3 or scenic director.

**Shipping:** Individual game, friends-and-family playtests. Block only P0; report P1 and let the owner decide. Keep rapid edit → drive → publish.

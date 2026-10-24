# Project OutRun — Product backlog after Velocity Gate

The owner has approved the **design direction** below, but these features are intentionally **not part of v0.3.1**. First demonstrate convincing speed and get human GO. Then plan a focused next playable milestone.

## A. More expressive turning, intentional drifting and honest audio

Current v0.3 driving frequently triggers tire squeal with small steering input, while the visible car cannot rotate far enough during dramatic corners. This is an **arcade racer**, not a realistic driving simulator.

- Separate steering turn rate, vehicle trajectory and visual body yaw/slip for controllable exaggerated drifting; avoid making the car move sideways purely cosmetically or break road-edge constraints.
- Allow visually substantial, controllable yaw on strong high-speed turns (candidate visual range ~20–40° during intentional drift, tune by human video/playtest, not a fixed physics law).
- Tire squeal should require meaningful slip at sufficient speed/steering load (and possibly a short hold/hysteresis); **ordinary gentle steering should not squeal**.
- Clear sound onset/offset with intensity related to slip. Keep mute/unlock, bounded shoulders, recovery and no automatic road steering. Do not allow full-circle outward spins at shoulder boundary.
- Objective check: gentle bend without squeal versus deliberate hard corner with visible yaw+sustained squeal; user playtest decides quality.

## B. Designed arcade rhythm, not geographically realistic roads

User-specified target cadence at typical high-speed travel, for inspiration:
- **6–7s acceleration / easier road**
- **3–5s exciting curve**
- **6–7s relatively easy travel**
- **3–5s exciting curve**
- **2–3s very dangerous corner**
- **3–5s recovery/easier road**, then repeat with variation.

This is a *designed emotional rhythm*, not a fixed real-time timer. Author track curvature/elevation in **travel-distance segments** so slowing down makes a bend take longer. Expose tunable curvature/severity and reasonable sightlines; the goal is to reward setting up corners, braking and recovering without unrealistic sharp spline discontinuities.

Avoid making all roads equally twisty or simply making steering twitchy. At least one repeatable benchmark circuit should force human decisions and yield a real difference between expert line/speed and sloppy line/off-road penalties.

## C. Original open-top sports car and expressive passengers

Replace the current closed-roof car with an **original unbranded convertible**, readable in chase view. Seats/cockpit and two stylized passengers should be visible. Later add exaggerated, joyful passenger reactions (leaning with corners, hair/scarf flutter at speed, raised arms on crest/drift, laughing/cheering), keeping animation readable and comfortable in motion.

- Don't copy Ferrari model, SEGA OutRun character likeness, licensed logos or existing game models.
- Start with clear roofless silhouette and passengers; stage rich animations after basic vehicle/handling performance passes.
- Maintain Pixel 8 smooth frame pacing; don't invest in premium art before core gameplay speed is accepted.

## D. Future scenic variety (still later / optional)

Switch clear visual themes every ~30–45 seconds of strong driving (coast, arid landscape, city, forest/snow) with distinctive props/palettes and smooth streaming. This creates rewards for continued progress but **must not conceal a weak core speed experience**.

## Human priority and stop/go

**Velocity Gate → expressive arcade drift/road rhythm → convertible/passengers → scenic transitions.** If Velocity Gate is NO-GO, reconsider the driving presentation/technology before adding content.

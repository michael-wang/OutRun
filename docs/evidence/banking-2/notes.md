# Arcade Banking 2.0

Default Trip geometry is now r3 / ALB3. Horizontal centerlines, elevation centerlines,
widths, traffic, collision response and handling code are unchanged. The existing
bank relief cap remains intact; straight cross-slope does not add lateral force.
Trip Codes explicitly load r1 (flat) and r2 (previous banking) recipes. Replay keeps
the selected revision; New Route uses r3. Stage and pilot revisions are unchanged.

Ordinary banking uses biome-weighted curve demand. Sparse showcase profiles select
long, moderate-demand non-city bends with adequate width and mild grade; quintic
entry/exit envelopes blend into ordinary banking. Scenic buffers carry selected
4–7 degree cross-slopes. Features are deterministic recipe metadata, calculated once
and included in the fingerprint. Rendering and workers share the same sampled bank.

## Seed 1 locations

Absolute route distances (subtract 350 m for distance travelled from the start):

- Ordinary screenshot: 1134 m, 9.59 degrees.
- First showcase: 3019.75–3425.5 m, leftward 21 degrees, 109.55 m entry/exit ramps.
- Other showcases: 24672–25180.5 m, rightward 23 degrees; 45507–45988 m, leftward 20 degrees.
- Scenic straights: 29122–29472 m, rightward 5 degrees; 64580–65130 m, leftward 6 degrees.

## Distribution

Sampled every 10 m over each full journey. Typical values are median/p90 banking
on meaningful non-city curves outside authored features. Flat means below 1 degree.

| Seed | Typical median / p90 | Maximum | Showcases | Banked straights | Flat |
|---|---|---|---|---|---|
| 1 | 7.11 / 15.00 degrees | 23 degrees | 3 | 2 | 32.4% |
| 2 | 7.52 / 15.00 degrees | 24 degrees | 4 | 2 | 32.9% |
| 7 | 7.23 / 15.00 degrees | 24 degrees | 3 | 2 | 32.3% |

## Gameplay evidence and checks

`seed-1-ordinary.png`, `seed-1-straight.png`, `seed-1-showcase.png` use the normal
chase camera and public HUD; diagnostic panels are hidden for evidence capture.
Seed 2/7 showcase screenshots additionally verify opposite-direction grounding.
`drive.mp4` is actual canvas gameplay through the first showcase, approximately
231–234 km/h, from entry through sustained banking to exit. It has no audio or DOM
HUD. Test steering holds a lane; production steering and camera are unchanged.
Screenshots and sampled recording frames were visually inspected: the road itself
tilts clearly, with aligned barriers, car and traffic, without visible gaps.

- Production build passed (existing large bundle warning).
- 29 focused unit tests across 11 files passed: banking, legacy geometry, handling,
  Trip generation, road chunks, traffic impacts/variety, pass-by and shared skid signal.
- 6 browser tests passed: new banking journey/contacts/legacy codes, four Trip
  replay/mobile/history/streaming regressions, all four traffic vehicle impact/reset cases.
- Edge mobile emulation: 960×432, DPR 2, 4× CPU throttling. Settled driving FPS 58–60;
  render CPU 2.09–2.53 ms. Desktop GPU, not physical Pixel 8 performance.
- Streaming ready at every driving sample; sampled chunk seams 0 m. Player wheel
  surface gaps below 0.001 m, sampled traffic wheel gaps below 0.029 m.
- Raw measurements: `checks.json`; full feature/distribution data: `distribution.json`.

Michael's physical Pixel 8 playtest and Julia's visual acceptance remain pending.
No main merge or deployment.

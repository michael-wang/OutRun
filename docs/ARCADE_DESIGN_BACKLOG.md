# Project OutRun — Short practical development backlog

## COMPLETED & currently in human visual review

- v0.7A: playable eight Challenge Brick Lab; owner reviewed.
- v0.7C: 18 L1 atomic shapes / 16 L2 challenges and praise/issue snapshot system; owner rejected initial L2 because it didn't truly combine multiple L1 placements.
- v0.7D: three multi-placement L2 pilot routes; owner liked all three.
- v0.7D.1 and .2: slope, speed-dependent lateral drift, gamepad, keyboard focus/shortcuts and retrospective praise/issues.
- v0.8/0.8.1: first deterministic procedural Stage01 Pacific Getaway, tightened challenge core and 4-lane majority; owner wanted harder Stage and realistic shift dynamics.
- v0.8.2: physical force gear shift dips/uphill/downhill overrun, Stage evidence/telemetry, screenshot controller chord (real DS4 L1+L2 failed), 1s resume. Human v0.8.2 first JSON ~117.3sec, 93% gas, 9 brakes, zero offroad.
- v0.8.3: dedicated SHARE screenshot, OPTIONS Play/Pause, Touchpad/R3 fullscreen and stronger speed planning challenges. Codex reports local `c3c8125`+`962ec67`. Human supplied two actual screen captures: first shows wheel appearing to penetrate/hover despite pivot `surfaceGap≈0.010m` in canyon bend; second shows elevated road underside apparently empty and city backside blank. New seed1 human JSON ~114.54sec, 94.1% gas, seven brake presses, 0 offroad. No explicit formal v0.8.3 vote.

## ACTIVE next: v0.8.4 — Visual Grounding / Capture Archive / Scenery Continuity

**Do these four and STOP for human review:**

1. **Touchpad press takes photo, SHARE toggles fullscreen**, OPTIONS Play unchanged. R3 screenshot fallback only when touchpad button unavailable. The owner can retain left thumb stick while taking snapshot; real DS4 mapping/hardware verification still needed.
2. **Unique, persistent every-shot PNGs** on running Windows Vite dev server: `C:\astra-dev\OutRun\captures\YYYY-MM-DD\`, secure dev-only file middleware, 12 photos → 12 accessible PNGs, sidecars with frame pose/Stage metrics, capture status and failure fallback. Do not ship photo cloud backend or complex gallery.
3. **Real four-wheel visual contact** against actual road profile/mesh, body visual pitch/roll + small suspension and shadows; arcade grip/dynamics and Stage geometry unchanged. User screenshot gap at body origin is insufficient. Test steep canyon + turns + crests + variable widths.
4. **Procedural scenery support and depth**, lean near/mid/far bands in existing L3 scene generator: road-edge skirts/cliff/embankment/bridge supports, cheap building mass back row, coast cliff/water continuity, canyon mesas, horizon/occlusion. Fix seed1 ~s8426 visual reference and prove multiple other Seeds, no over-built AAA world or prior mountain road obstruction regression.

See [v0.8.4 spec](V0.8.4_SPEC.md), [acceptance](V0.8.4_ACCEPTANCE.md), [kickoff](CODEX_V0.8.4_KICKOFF.md), [human review](V0.8.3_HUMAN_VISUAL_REVIEW.md).

## Backlog AFTER actual v0.8.4 visual acceptance (do not start now)

- Need additional, variety-rich meaningful driving choices in Stage01? New 114.5sec actual seed1 run still 94.1% GAS and no offroad. This observation might motivate retuning or traffic/hazards L1, but first owner must explicitly review Stage challenge. Do NOT autonomously alter difficulty this time.
- Introduce dynamic traffic/rivals and respectful collisions after proven scenery and screenshot loop.
- Longer 5-min Pacific road trip and Mystery Drive/other biomes based on player ratings.
- Only after users voluntarily repeatedly drive fun roads: garage, upgrades, terrain equipment, unlocks, light in-game economy.
- Keep original finite systematic L1 category inventory + L2 multi-placement and L3 city/coast/canyon metadata. No algorithmic 3A feasibility theater, giant track editor or full vehicle rigidbody engine. Human play remains fun gate.

**Repo warning:** Remote GitHub main is docs only; local Windows checkout contains playable game. Always build from latest local playable branch, selectively import docs. No push/merge/deploy.

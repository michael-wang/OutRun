# OutRun — Active v0.8.5, longer-term 10-minute Road Trip

## Latest human input (v0.8.4)

- Owner tested real multiple saved screenshots on Windows: `captures/YYYY-MM-DD` works. Wants small **saved confirmation only during drive**, and simple **Open Folder** row in pause menu, removing redundant `Recent Photos`.
- Two user screenshots still visibly reveal elevated distant road as thin/hollow and overly thin/evenly spaced palm tree rows. v0.8.4 green QA did NOT mean visuals were accepted.
- The **priority is now ~10 min of varied continuous procedural driving**, no full 10-min geometry/asset build at startup, and no loading pauses/hitches during scene/biome transitions.
- Latest owner run 114.95sec, 13,488 world units, ~93.7% GAS, only ~2.62 sec brake, zero offroad. Used same v0.8.3-r1 StageCode by design after visual-only v0.8.4; not a stale build bug.

## ACTIVE (owner authorized): v0.8.5 streaming FOUNDATION

**Use existing ~2-minute Stage** as unchanged reference:
- Lightweight deterministic logical RoutePlan (full itinerary planning cheap), bounded rolling SceneChunks (road + support + props), prefetch ahead, dispose/pool behind, shared materials/instances. Approx initial 800–1000 distance units/chunk and 4–6k ahead are hypotheses, profile real engine and Pixel before fixing.
- Stage Code, sampleRoad(s), grade/width, steering/gear physics, gamepad+Pixel controls, screenshot metadata, eventAt/reactionAt and review data preserved.
- Per-frame CPU/GPU budget, 10/20-min simulated memory plateau, chunk seam and biome-transition screenshots from chase camera; no frame hitch or missing road.
- Photo UI: only '📸 Saved' in game, one dated folder + working Open Folder in localhost Windows pause menu, remove Recent Photos. Dev-only fixed-path security, no cross-site arbitrary Explorer launch.
- No actual 10-min new mode or scenery canopy beautification yet. STOP at local commits/`docs/V0.8.5_HANDOFF.md` and owner playtest.

[Specification](V0.8.5_STREAMING_FOUNDATION_SPEC.md) · [Acceptance](V0.8.5_ACCEPTANCE.md) · [Codex kickoff](CODEX_V0.8.5_KICKOFF.md).

## NEXT separate human-authorized stages

| Version | Focus | Product gate |
| --- | --- | --- |
| **v0.9** | Seeded ~10-min varied road trip using same bounded streamer, real L2 core rhythms + L3 transitions, city/coast/canyon scenes, no "five repeats" | Three full browser drives, two human long-seed playtests, stable memory/frame times |
| **v0.9.1** | Visual quality at streaming camera scale — support elevated roads with land/bridges, lush organic palm crowns/clusters, skyline depth and terrain | User aligned before/after captures + 5-seed scenery continuity, no fps regression |
| LATER | More biomes, traffic/rivals, optional RPG progression, richer L1 input vocabulary | Only if people willingly replay long drives |

No blanket AAA planner or whole-world 3D loading. Local PC playable source separate from docs-only GitHub main. Each Goal must receive authorization, branch from current local playable HEAD, no push/merge/deploy.

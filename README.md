# Project OutRun

Original browser 3D arcade road-trip game, Three.js + TypeScript + Vite, mobile landscape PWA, PC keyboard and PS4 controller. Internal name only; public product title/assets must be original and licensed.

## ACTIVE: v0.8.5 — Bounded Scene Streaming Foundation

The next product destination is **a varied 10-minute Road Trip with no initial full-world load and no visible scene streaming hitches**. The owner explicitly authorized proceeding with the FIRST prerequisite only: **stream-render the existing ~2-minute Stage 01 without modifying its driving content.**

Latest PLAYABLE implementation remains LOCAL Windows `C:\astra-dev\OutRun`, Codex reported v0.8.4 branch `codex/v0.8.4-visual-captures` with code commit `edd7018` and handoff `4d2b6ad`. **GitHub `main` contains chiefly docs, NOT the playable game source. NEVER checkout/reset/merge it over Windows app code.** No v0.8.5 code has been executed from this documentation session.

### One v0.8.5 output

1. Preserve deterministic `RoutePlan` for Stage 01 and make `SceneChunk` geometry/resources on demand around player progress, with ready-ahead windows, scene-boundary continuity, bounded GPU/CPU memory and release/pooling behind.
2. Measure real frame times, streaming latency, resource counts and 10/20-min synthetic play memory; compare with v0.8.4 baseline. No new driving difficulty or stage-level seed revision.
3. Keep 12+ unique saved photos. In gameplay show only unobtrusive saved toast. Pause menu: one dated Windows folder path and secure local-PC **Open Folder** action. Remove `Recent Photos`. Remote Pixel LAN must not launch PC Explorer.
4. Test three existing seeded 2-min full drives, chunk seams and performance, 30/60fps and Pixel-like viewport (physical Pixel still requires owner).
5. Commit LOCALLY; **STOP** for owner stage/performance review before any 10-minute content.

### Current documents

- [v0.8.5 Streaming Foundation Specification](docs/V0.8.5_STREAMING_FOUNDATION_SPEC.md)
- [v0.8.5 Acceptance](docs/V0.8.5_ACCEPTANCE.md)
- [Codex v0.8.5 Kickoff](docs/CODEX_V0.8.5_KICKOFF.md) — normal authorization + one ready-to-paste `/goal`
- [10-minute Roadtrip Architecture](docs/TEN_MINUTE_ROADTRIP_ARCHITECTURE.md) — context/next design
- [10-minute milestone acceptance](docs/TEN_MINUTE_ROADTRIP_ACCEPTANCE.md) — v0.8.5 then v0.9 then v0.9.1
- [Most recent human visual review](docs/V0.8.4_HUMAN_FOLLOWUP_10MIN.md) — photo UX, hollow road, skinny palm rows

### Future (not automatically authorized)

**v0.9:** one selectable, truly seeded 8–12-min Road Trip, real varied L1/L2 challenge and city/coast/canyon scenery, using v0.8.5 streamer. No repeated canned 2-minute stage; owner evaluates 2–3 long Seeds.

**v0.9.1:** art pass for genuinely supported elevated road/viaduct, richer clustered multi-frond palm/vegetation, city depth and fog; maintain streaming budget. Don't delay architecture proof by trying to perfect all art now.

Preserve accepted core: six gears/~300flat/downhill overrun, 1.75x arcade world pace, Arcade Lateral Balance, variable width/grade, 144px thumb steering, 1s resume, touchpad photo/share fullscreen, screenshots to `captures/YYYY-MM-DD`, warm audio, human BRK/L2 Pilot and Stage reviews and local retrospective praise/issue telemetry. No push/merge/deploy, TopWar changes, traffic/RPG/garage/editor.

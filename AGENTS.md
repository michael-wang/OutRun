# Project OutRun — working agreement

## Branches and releases

- `main` is the latest owner-approved, publicly playable release. Every change to `main` must belong to a new, explicitly approved versioned release; do not make undocumented or silent hotfixes to a released build.
- `dev` is the active development branch. Work directly on `dev`; do not create additional permanent branches.
- At the end of each authorized milestone, run appropriate checks, commit the completed work, and push `dev` to GitHub. Ordinary `dev` pushes must not deploy to the public website; complete release CI and GitHub Pages deployment run from `main` only.
- Promote to `main` only after explicit owner approval. Preserve history; never force-push `main`, `dev`, or a released version tag.
- Never discard uncommitted work. Before deleting any temporary branch, verify its unique commits are already reachable from a maintained branch or a consciously retained preservation ref; do not generate `archive/codex/*` tags routinely. Historical specs, handoffs and human reviews remain in `docs/` and Git history.

## Version identity — mandatory for every publicly shared build

- **A player reports one version string, and that string alone uniquely identifies the build.** Do not ask players for Git SHAs or additional build identifiers. Display the exact release version (for example `v0.9.41`) unobtrusively in the game's main menu; diagnostic SHA data may remain internal but is not part of the player-facing identity.
- `package.json` `version` is the single source of truth for the app version (for example `0.9.41`); keep `package-lock.json` consistent. The public display and published version tag prefix this value with `v`. Do not maintain another manually typed release-version constant.
- **Each public stable release has exactly one immutable annotated Git tag named `vMAJOR.MINOR.PATCH`** (for example `v0.9.41`). The tag must resolve to the **exact `main` commit successfully built, tested and deployed**, whose `package.json` version matches the tag. Verify the target commit after tagging. A GitHub Release using that tag is recommended to preserve release notes and build artifacts.
- A released version/tag must never be moved, deleted, reused or redeployed with different code or assets. Any post-release fix, even a one-line change, requires a strictly new version, new commit, new tag and new deployment. Do not amend or retag an existing release.
- Before promotion, verify the next `vX.Y.Z` tag does **not** exist, bump `package.json` and lockfile to the intended release version, and validate the real app, build and tests. After approved `main` deployment succeeds, create/verify the corresponding immutable tag against the deployed `main` SHA; stop and report any mismatch instead of overwriting a tag. When automated release/tag checks are implemented, they must enforce these invariants; until then the release operator must verify them manually. Configure a GitHub tag ruleset to restrict updates and deletions of official `v*` release tags.
- Development builds must not masquerade as an already released version. If an unreleased `dev` build is shown to testers, give each distinct shared build a unique SemVer prerelease version such as `0.9.42-dev.1`, and display it as `v0.9.42-dev.1`. Do not create official stable `vX.Y.Z` tags for development-only builds.
- For bug reproduction, use the reported version to find its Git tag and check out that exact source; keep the lockfile and any required build-time assets reproducible. Local tag checkout does not automatically redeploy the public site.
- `archive/codex/*` are **legacy development-history pointers, not release versions**. They may be removed only after verifying their commits are reachable from `main` or another intentionally retained ref. Keep unrelated artifact tags such as `art-assets-*` unless their separate purpose has been reviewed. Do not automatically replace legacy archive tags with official release tags.

## Product architecture: finite stages, bounded assets (accepted)

Read **[docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md)** before modifying any level/scenery streaming, GPU warmup, resource lifetime, or stage transitions.

- **No infinite-world requirement.** 極速漫遊 is a journey of finite, authored levels. Each level must have a bounded resource budget. Scenic composition is constrained by that budget.
- **Stage-transition buffers** intentionally provide time to retire previous-stage resources and prepare the next stage, with at most a measured, bounded overlap. The next stage's drivable road remains the highest safety priority.
- Generate all in-game trees with the threejs-nanites tree generator (@dgreenheck/ez-tree). Bake tree variants with `npm run art:trees` and reuse their branch and foliage meshes.
- Build-time scene baking and resource sharing are encouraged for authored stages; keep procedural runtime generation only where it improves gameplay.
- Implement the Scene Resource Pipeline incrementally: P0 task attribution / oversized-work control → P1 stage-scoped road/scenery priority windows → P2 shared resources and hybrid flower fields. Do not rewrite all systems in one PR.
- Do not optimize by removing user-approved golden rice fields or Ultra-Water visuals without device A/B evidence. Use `?startupdiag=1` for startup and `?fpsdiag=1` for driving on physical Pixel 8.
- **Every new scene object, particle effect, water pass, shader or traffic feature needs a mobile FPS gate before release.** On a physical Pixel 8 use `?fpsdiag=1` to record a matched drive; the exported `playtestGate` warns on >50ms frame gaps and marks **`REVIEW_REQUIRED` if any one-second bucket falls below 30 FPS or an individual frame exceeds 100ms**. Never interpret a green GitHub CI build as a measured FPS pass. Only the owner decides whether to promote a version with such warnings.
- The only supported URL query keys are `fpsdiag`, `startupdiag`, `at`, `trafficSeed` and `rivaldebug` (set to 1 for race observation). Optional shadow-technology checkboxes live under the pause dock only while `?fpsdiag=1`; never instruct testers to use `sunshadow=0`, `showcase=coast`, `qa=1`, `fpsbench`, or `autobench`. The owner has paused performance measurement. See `docs/R91_DUSK_POLISH_QA.md`.

## Scope and verification

The owner authorizes each development milestone. Preserve accepted driving behavior, input controls, screenshot archives, telemetry and human reviews unless the owner explicitly requests a change. Work only in this repository; do not deploy publicly or modify other projects without separate authorization. Test actual gameplay as appropriate and clearly distinguish browser emulation from physical-device results.

Release status (2026-11-10): `main` has the owner-approved **v0.9.41 / Racing R0.1** public playtest release; its protected release identity is the annotated `v0.9.41` tag, which resolves to commit `934919be8c61c266ca5ca9b8a3a3505f965e06a8`. The `v0.9.42-dev.1` Racing R0.2 playtest on `dev` adds two coast rivals. Use `?rivaldebug=1&trafficSeed=945` to follow either car, or `?fpsdiag=1&trafficSeed=17` for a matched drive. Promotion requires owner approval and a **new** release version. Existing technical performance and art acceptance requirements remain in force; see `docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md` and `docs/R91_DUSK_POLISH_QA.md`.

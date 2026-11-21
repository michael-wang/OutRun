# R6 — Riviera heroine/driver 1.0 + fine Spring Bone hair + real cabin wind
Date: 2026-11-14
Status: **OWNER APPROVED — all three are ONE integrated playable slice**.
Audience: Julia (art/product/tech) and Codex (local implementation), followed by owner Pixel 8 playtest.

## Product decision

Owner explicitly chooses ONE integrated gamble instead of three independent controls. This **supersedes** the sequential P0 framing -> P1 wind -> later R1 thin-tip -> maybe spring approach in earlier tickets (#45/#44/#42). We accept poorer causal attribution **in exchange for one high-value visual result**. Do not re-open a rigid identical-parameters Shape Keys vs Spring Bones study; each technique should use settings best suited to it. Keep old production behavior as safe rollback/reference, not as an excuse for three elaborate A/B harnesses.

### Single outcome to build

In actual coast race on Pixel 8, **both seated driver and blonde heroine are at person scale 1.0**, the heroine's gold bob keeps its approved glamour and large swept crown, while **distinct slim side/nape tips bend, scatter subtly, flutter independently in a strong, unsteady open-top airstream**, already perceptible at 60–80km/h, graceful at 120km/h and exciting at 280–300km/h. Hair remains styled, not a soft helmet or dozens of glitchy individual hairs. This is an art-directed stylized arcade effect with physically informed inputs, NOT actual CFD or full strand simulation.

**Important:** the owner challenges PC 960×540 as the ONLY art criterion. Always judge the true original-size Pixel 8 game screenshot/video with the actual drawing buffer and visible subject scale; 960×540 remains a *supplemental repeatable comparison*. Pixel 8 hardware is 2400×1080 landscape, but currently the app uses capped renderer DPR=1 for coarse pointer devices. Do NOT increase global DPR as a hidden fourth change: note CSS viewport, DPR and `renderer.getDrawingBufferSize` in QA and keep existing render budget.

## Art-direction constraints

- Character/vehicle design: Style Option B world and accepted blonde heroine `docs/art-review/h1ar/README.md`; driver stays left / passenger right in player's rear chase view. Maintain approved Riviera body and normal 8m camera/FOV as far as possible.
- Beauty priority: **few distinct layered, curved, slender, tapering terminal locks** showing side/back silhouette breaks and controlled highlights, held together by larger static flowing mass. Don't replace the bob with a long-hair wig, noodle hair, or thin alpha ribbons; opaque mesh and cheap materials preferred.
- **No fixed 979-triangle ceiling**. Old 12,000-triangle proxy was sculpt/reference and the 979-tri A/B was a simplification, not a hard target. Spend geometry on a few visible tapered tips, reduce elsewhere; report actual GLB size/triangles/draws and Pixel 8 impact. At game size don't chase subpixel strands that shimmer.
- Both people are genuinely `person.scale=1.0` (old .84). Seat, shoulders, steering wheel grip, door-side driver hand, passenger head and hair clearance must be corrected LOCALLY if needed; don't sneak the scale down, arbitrarily move camera, or change vehicle physics. If 1.0 is genuinely untenable, show evidence/blocker instead of silently overriding the explicit owner decision.
- The future L/R rival shout (#41) is NOT in this R6. Keep head and shoulder pivots usable; no new gestures, animation engine, full-body or portrait polish.

## Single implementation pass: three parts developed together

### 1. Restore driver and passenger to scale 1.0
- `src/car.ts` currently sets `person.scale.setScalar(.84)`; change to 1.0 for both. The scaling is around seat pivots, so check real person-to-seat size, head/windscreen, shoulders, driver arm/wheel and left door contact, passenger earrings/neck/upper back, camera framing. Keep body identities and approved car.
- Compare one baseline/combined full-frame screenshot at the NORMAL 8m chase camera, not arbitrary zoom; avoid changing `src/chase.ts` except with a documented essential visibility blocker. No global renderer resolution changes.

### 2. Spring Bones, BUT art-directed around the desired hair movement
- Existing `src/blonde-groom-asset.ts` preloads the accepted hair GLB, uses morph targets and falls back to procedural bob. Do not rebuild loading. Local Blender spring test `C:/astra-dev/tools/outrun-hair-spring-ab/heroine-tip-spring-ab.blend` and its 19-bone/6-chain model are starting points, **not immutable settings**. Keep full shape/color source outside repo, but commit one optimized runtime hair GLB after local validation.
- Give 4–8 groups of side/back/nape locks genuinely graceful **medium-to-tip** flexible regions with progressive weighting; rigid/near-rigid crown/hairline/big side-swept fringe. A few broad primary locks + visibly thinner tapered daughter tips with small air gaps. Start from accepted Blender design and inspect before modifying; don't formula-generate a new hairstyle or full head. Small cost-conscious geometry increase over the overly coarse 979-tri representation is allowed where visible.
- Independently tune B spring stiffness/drag/settling/collision radius/bone length, wind transfer, follow-through and tiny varied tip turbulence; **DO NOT force B to share A's amplitude, phase, target displacement or 979-tri geometry**. Same physical inputs and camera for old-vs-new end-to-end comparison only. Aim stable small-root, flexible midsection and buoyant tips; wind loading saturated aesthetically, not 300km/h physically unbounded.
- The standalone MIT `@pixiv/three-vrm-springbone` worked in prior isolated test and can be used without a VRM character if integration remains small. No generic physics framework or extra runtime simulation passes. Use CPU updates on small bone chains and GPU skinning on one/few opaque meshes, avoid per-vertex JS animation. Preserve reliable GLB preload, reset on teleport/restart, pause/resume determinism and cleanup. Don't let scenery/race freeze destabilize hair.
- Current B isolated trial was about **+0.29ms CPU per 60Hz PC frame**, GPU near equal; Pixel 8 still requires profiling. Choose bounded simulation step count and correct head/car-local reference frames.

### 3. Cabin wind: provide continuously changing driving airflow
- Existing `src/coast-wind.ts` has deterministic world gust `sampleCoastWind(x,z,time)`, stage baseline 2.6m/s; tire/dust/traffic already consume it. The `src/occupants.ts` driver/passenger hair presently sees merely a speed -> smoothstep(0..84 m/s), turn inertia and periodic `flutterPhase`. **Don't conflate stage ambient breeze, ocean FFT wind and the vehicle-relative cabin airstream.**
- Compute airflow in car/head-local coordinates using `V_air = V_worldWind - V_worldCar`, using actual travel velocity/speed/heading, time and existing stage wind. Avoid HUD-km/h physics and doubling pace/timeScale. Cabin wind should include modest windshield/A-pillar shielding, broad slow buffet, medium gust/recirculation, and quicker low-amplitude independently phased tip flutter. Use continuous deterministic band-limited signals, not per-frame random jitter and not a full CFD or weather engine.
- Reasonable arcade envelopes: **already legible at 60–80 km/h** (even calm day); at 120, visibly fluttering; at 280–300, full dynamic yet glamorous with bounded mean deflection and nonstationary gusts (not constant static back-sweep). Cornering/steer adds lateral inertial lag, fast brakes recover softly, L/R turn and head yaw orientation sensible. Windshield shielding and head exposure are artistic parameters, not simulated geometry.
- Make ONE small compositional function for cabin head wind, reusing `sampleCoastWind` and existing `occupants` motion data; avoid duplicating controller state and a second independent motion engine. Make it easy to test deterministic input -> finite output and pause/restart behavior.
- Ensure scene wind behavior, water/vegetation/traffic physics and car handling remain unchanged.

## Integrated gameplay acceptance (not a factorial experiment)

One before (current dev baseline) vs after (all 3 together) side-by-side at same route/seed and normal 8m camera. Use actual game runtime and **actual Pixel 8** if Codex can access it; if not, provide a direct reproducible URL/seed/steps for owner, and clearly label PC-only results. Record CSS viewport & drawing buffer sizes and frame rate / P95 frame-time. No fake 960×540-as-Pixel8 claims.

**Scenes**: stopped/idle, 60, 80, 120, ~220, 280–300km/h straight; one sustained LEFT and RIGHT bend, deceleration to stop, restart. Verify 1.0-scale seated bodies and steering/door hand contact, hair tips vs collar/shoulders/windscreen, no hair root wobble, no clumpy all-in-phase movement, no thin-strand shimmer, and obvious speed-dependent continual flutter in live chase play. Optional short rear three-quarter closeup only to diagnose flaws, not substitute primary view.

**Performance guardrails**: report vehicle + hair triangles/draws, bundle bytes, GLB load time, CPU time for bone/wind update, moving FPS/P95 baseline vs combined on same Pixel 8 route. Aim <~10% p95 frame-time regression or at least no visually meaningful sustained frame-rate drop, with user choosing trade-off on final playtest. Avoid cold-start hitch, per-frame allocations, missing chunks on restart or telemetry changes.

**Stop & deliver**:
- Produce ONE finished playable `dev` commit + short exact changed-file and tests summary + 10–20s real-game capture/screens for owner/Julia. Run focused unit tests and a single local `npm run verify:dev` prior to push, not repeated GitHub CI loops. If unresolved visual blocker after one corrective pass, report it honestly with before/after and leave a reversible QA toggle/last-good fallback. Don't expand to a new physics framework, whole head/bust sculpt, face polishing, race AI/traffic/road/water changes or extra cinematic cameras.
- **No paid services (NT$0), no `main` promotion** without owner acceptance. Preserve existing accepted files and carefully coordinate with any local Codex uncommitted edits before remote sync.

## What this experiment CAN and CANNOT establish

The owner explicitly accepts losing isolated attribution: one integrated full-look pass can demonstrate improved player experience, **not prove which of the three is the cause**. Keep technical metrics and source change points concise so if the effect still disappoints, Julia can decide which dimension to revisit next. Do not add a 2³ factorial A/B framework; spend Codex quota on player-visible results.

References: [#43 spring trial and limits](art-review/hair-spring-ab/README.md), [R0 headwind/Pixel8 research](COAST_CONVERTIBLE_CABIN_WIND_DESIGN.md), [co-design rules](ART_TECH_CO_DESIGN_PRINCIPLES.md), [current game architecture](CURRENT_ARCHITECTURE.md).

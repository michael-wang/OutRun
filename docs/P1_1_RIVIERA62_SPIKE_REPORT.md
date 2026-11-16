# P1-1 Riviera 62 research — review candidate

> **CURRENT REVIEW STATUS — 2026-11-16:** Judy independently re-reviewed the correction; Julia inspected the source/diff and gave [P1-1 RESEARCH TECHNICAL PASS](https://github.com/michael-wang/OutRun/pull/58#pullrequestreview-5918256565). [PR #58](https://github.com/michael-wang/OutRun/pull/58) has been merged to dev. The original candidate/handoff statements below (`independentReview: pending`, no PR, 11 production blockers) are **dated snapshot evidence**, not an ongoing P1-1 work order. There is **no P1-2 production authorization** and no proven native Blender/GLB/Pixel 8 capability. Reviewer clarifications: first L1 slice needs retrievable/versioned source and offline import, not an elaborate independent backup service or deterministic in-game replay harness (later gates).

2026-11-16. Authority: Issue #57, P1_RIVIERA62_PIPELINE_BRIEF.md (B1/B2/B3), PRODUCTION_PIPELINE_TRACKER.md, TASK_CONTRACTS.md, COAST_ART_BIBLE.md and COAST_HERO_VEHICLE_ART.md. Source inspected at dev `b66d06e67580e1faf35ad9bdc358a694b0ac4a04`. This is a research decision proposal, not a DCC or production PASS. Judy independently reviewed def0da6 and requested a transform/capture clarification. Correction pass 1 is complete; independent re-review is pending. No P1-2 authorization.

## Decision and environment

Recommend an artist-edited Blender hard-surface master with narrowly bounded export assistance. Do not substitute another scripted whole-car mesh. The principal uncertainty is whether the operator can produce an acceptable, repeatedly editable arch/paint surface; only a separately authorized small experiment can resolve it.

Dispatch receipts supplied by supervisor: preflight requested Low; this research requested Medium. Actual model/effort application could not be independently verified. Local default gpt-6-astra/high is not execution telemetry. No token-savings claim or escalation to High/xhigh.

Read-only preflight verified Blender 4.5.13 LTS (daeeeca98fb0), bundled glTF addon 4.5.51, Node 24.21.0, Git 2.50.1.windows.1, LFS 3.7.0, gh 2.104.0, installed Three.js 0.180.0; RTX 5070 Ti 16303 MiB, driver 610.88. GPU rendering/export round trips were not performed. GitHub michael-wang authentication and push permission were read successfully, without credential output. Initial sandbox DNS/access failures were resolved by approved read-only escalation, not evidence of invalid credentials.

Fresh ls-remote confirmed the above base before fetch/worktree creation. Branch research/p1-1-riviera62 is isolated under task-2/outrun-p1-1. Original C:/astra-dev/outrun remains dev at 3fe62dcdb07bde88f212adbdacc5cf092f0e2817, with 11 pre-existing untracked paths and no tracked edits. No checkout/reset/clean/stash there. Neither local nor remote tree has .agents/skills or skills guidance. Current root AGENTS overrides historical character work orders. Existing P0 worktree is untouched.

## Actual interface audit

All references below are repository paths at the pinned base; identifiers permit exact lookup.

| Source | Observed contract | Integration limitation |
|---|---|---|
| src/car.ts, createCar | +Z nose, +X driver; wheel centers (side*1.055, .46, z), z=-1.45 rear / +1.38 front; wheelPivots array order rear -X, front -X, rear +X, front +X | Preserve order or explicitly map names; do not infer left from front view |
| src/wheels.ts | radius .46; rolling angle += distance/.46; front yaw tends toward -clamp(input)*.3 with .07s smoothing; rotor rotates X; advance accumulates, render applies | Retain advance/render/reset/inspect, slip and blurred-spoke behavior; a static imported wheel is insufficient |
| src/hero-hands.ts | steering center (.41,1.065,.075), rotation X=.34, Z=turn*.98; rim radius .17; grip child at (-sin(pi/3)*.173, cos(pi/3)*.173,-.089), rotation Z=pi/3 | Retain THREE Euler XYZ order; proposed tilt-parent plus spin-child must produce Rx(.34)*Rz(turn*.98) |
| src/hero-hands.ts, createDriverArms | right wrist computed from hand position and wheel.matrix; shoulders from body.matrix; upper/lower lengths .278/.265; door elbow (.875,1.004,-.37), wrist (.965,1.011,-.17) | These are car-frame assumptions, not general world-matrix IK. Reparenting independently would break contact; future adapter must explicitly convert into a common frame |
| src/car.ts, pivotAt | body pivot driver (.41,.80,-.48), passenger (-.41,.80,-.48), then Y -=.035; passenger X +=.09; normal scale 1 | Retain effective driver (.41,.765,-.48), passenger (-.32,.765,-.48), head pivot and existing asset offsets; not a new rig |
| src/occupants.ts | turn smoothing .16s; body Z lean .08/.12 times turn, pitch response; calls poseDriverArms, head, hair and passenger performance | Preserve accepted gestures/hair; future sprung-body motion is separate from this existing occupant lean |
| src/hero-classic-geometry.ts | shell merges spider shell and rear tonneau; four tail circles at X=+/- .47/.69, Y=.745, Z=-2.421 | TS mesh is current fallback, not an editable DCC master; no independent turn indicators proven |
| src/car.ts, brakeLights | idle .14 dusk/.035 day; brake 1.0; set/reset/inspect shared rear material | No independent tail-running API; dusk is constructor input |
| src/car.ts, front lamps | emissive intensity 2.5 dusk/.6 day, rectangles centered (+/- .55,.58,2.32) | Emission alone does not demonstrate road illumination; no headlightsEnabled controller |
| src/car-appearance.ts / paintController | red #e51e2c (.38 metal/.23 rough), white #ffffff (.12/.24), seafoam #80b9ad (.25/.25); clearcoat .82/.15, shade half color | Keep palette/storage migration and uniform updates; do not bake sunset or unique texture per paint |
| src/car.ts, batch | merges direct opaque meshes by material, strips attributes except position/normal; special exceptions preserve named shell, lamps, wheel and plate | Never run this blindly over imported UV/tangent meshes or semantic lamp groups |
| tests/hero-car.unit.ts | left drive/scale/plate, paint geometry invariance, opposite steering + reset, wrist contact <.0001, fixed door arm, modest brake values, passenger/hair checks | Inspected source, not newly executed game tests; no GLB round trip, actual GPU/mobile or new headlamp coverage |

## Three routes (engineering assessment, not measured trials)

| Route | Editing, pivots and materials | Traceability / license | Cost, failure risk and decision |
|---|---|---|---|
| A: Blender native meshes, restrained bevel/mirror modifiers, artist surface edits | Separate wheel origins and lamp material slots authored explicitly; inspect topology, silhouette and highlight continuity; reusable paint/trim/glass | Original authored source plus reference rights record, exact blend/export hashes; review any added textures separately | Best artist control; operator skill and highlight quality unproven. Export triangulation/material splits can inflate draw calls. Recommend bounded slice |
| B: same native master with Geometry Nodes or Python assistance only for repeated parts/export | Parameters for repeated wheel trim, mesh and origin validation; keep editable mesh and modifier stack, do not regenerate over manual changes | Commit script/node-group version and parameters alongside blend, exporter version and manifest; dependencies need license inventory | Repetition may help, but scripts can recreate procedural trap. Accept only if a manual arch edit survives two exports and later parameter edits; secondary helper to A |
| C: image-to-3D draft then manual retopology in Blender | Generated shape is reference; wheel/arch separation, pivots, materials and unseen surfaces still need reconstruction | Retain input rights, model revision/license and generation parameters; commercial/territory permission unresolved | Least predictable editability; reject as primary route. No inference run. Hunyuan README reports 10GB shape /21GB texture /29GB combined; local 16GB is not proof full pipeline works |

Primary references: local Blender 4.5.13 addon io_scene_gltf2/__init__.py exposes export_yup, export_apply, export_extras, export_materials; these establish options, not success. Official manual URLs https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html and /modeling/modifiers/generate/bevel.html returned retrieval errors in this session, so no fresh manual verification claimed. Hunyuan primary README: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1 (read 2026-11-16). No paid service, download/install, inference or asset purchase performed. Route license acceptance remains pending; do not equate tool availability with output rights.

## Proposed node and coordinate contract (not implemented)

Use metres and signed axes, independent of camera viewpoint: Blender +X maps to game +X (driver/vehicle-left), Blender +Y maps to game -Z, Blender +Z maps to game +Y. Blender -Y is the nose. Position mapping is G=(Bx,Bz,-By); inverse B=(Gx,-Gz,Gy). Thus front +X wheel G=(1.055,.46,1.38) maps to B=(1.055,-1.38,.46), and back to the audited center. Use one Y-up export conversion, no additional runtime corrective rotation. For rotations use matrix conjugation Rg=C*Rb*C^-1 with this basis matrix C; do not remap Euler components independently. Exported basis/origins still require an actual import test; this is a source-aligned proposal, not round-trip evidence.

All following T/R/S are **local transforms in exported game coordinates**, radians, right-handed THREE Euler XYZ. S=(1,1,1) for every node; R=(0,0,0) unless explicitly stated. vehicleRoot is identity in the asset; the existing runtime road pose acts on it later. No negative scales or bounding-box recentering. For any car-space surface vertex p assigned to a translated parent at q with zero rest rotation, store local vertex p-q; do not also translate its mesh by -q.

| Complete node path | Local T and R / content |
|---|---|
| vehicleRoot | T=(0,0,0), R=(0,0,0), S=(1,1,1) at asset rest |
| vehicleRoot/sprungBody | T=(0,.46,0), R=(0,0,0), S=(1,1,1); chosen roll origin, not identity translation; no dynamic roll implemented |
| vehicleRoot/sprungBody/bodyPaint (also trim, glass) | T=(0,0,0), R=0; each car-space vertex p stored as p-(0,.46,0) |
| vehicleRoot/wheelMount_FL | T=(1.055,.46,1.38), R=0 |
| vehicleRoot/wheelMount_FR | T=(-1.055,.46,1.38), R=0 |
| vehicleRoot/wheelMount_RL | T=(1.055,.46,-1.45), R=0 |
| vehicleRoot/wheelMount_RR | T=(-1.055,.46,-1.45), R=0 |
| vehicleRoot/wheelMount_{FL,FR,RL,RR}/steerPivot | T=0, R=0 at rest; front R=(0,steer,0), rear stays zero |
| vehicleRoot/wheelMount_{FL,FR,RL,RR}/steerPivot/rollingAxle | T=0, R=0 at rest; motion R=(angle,0,0); wheel vertices centered on origin |
| vehicleRoot/sprungBody/cockpitAnchors | T=0, R=0 |
| vehicleRoot/sprungBody/cockpitAnchors/driver | T=(.41,.305,-.48), R=0; reference socket only, existing TS body not reparented |
| vehicleRoot/sprungBody/cockpitAnchors/passenger | T=(-.32,.305,-.48), R=0; reference socket only |
| vehicleRoot/sprungBody/cockpitAnchors/steeringTilt | T=(.41,.605,.075), R=(.34,0,0) |
| vehicleRoot/sprungBody/cockpitAnchors/steeringTilt/steeringSpin | T=0, R=0 at rest; motion R=(0,0,turn*.98); rim centered on origin |
| vehicleRoot/sprungBody/cockpitAnchors/steeringTilt/steeringSpin/gripRight | T=(-sin(pi/3)*.173,cos(pi/3)*.173,-.089), R=(0,0,pi/3); grip/hand reference |
| vehicleRoot/sprungBody/lamps | T=0, R=0 |
| vehicleRoot/sprungBody/lamps/head_L (head_R) | T=(.55,.12,2.32) (T=(-.55,.12,2.32)), R=0; aim along game +Z; independent lens/emission slots |
| vehicleRoot/sprungBody/lamps/tail_L (tail_R) | T=0, R=0; lens vertices from existing car-space geometry minus (0,.46,0), grouped by sign X |
| vehicleRoot/sprungBody/lamps/indicator_L (indicator_R) | T=0, R=0; empty reserved semantic sockets, no invented accepted indicator geometry |

The steering chain composes to T(.41,1.065,.075)*Rx(.34)*Rz(turn*.98), matching the existing wheel matrix; the grip then composes exactly its existing local transform. The driver/passenger sockets sum to (.41,.765,-.48) and (-.32,.765,-.48), matching car.ts after seating adjustments. In Blender the sprungBody translation is (0,0,.46), steeringTilt local translation (.41,-.075,.605), and driver local translation (.41,.48,.305); applying G=(Bx,Bz,-By) recovers the table. Steering rotations must be converted as matrices. Existing arms remain in the current TS car frame until a separately tested adapter handles the common-frame conversion.

P1-2 only authors a subset and empty documented sockets, not full occupants. Do not implement roll. For later integration preserve the existing TS car as default and explicit rollback; build a separate opt-in adapter only in P1-3, fail closed to TS on missing nodes/hash/material contracts. Keep old wheel animation APIs and car.userData controllers; do not silently replace all car instances. New roll would require common-frame arm/door conversion and independent regression tests, not reparenting alone.

Proposed later lighting truth: Stage preset explicitly requests headlights; default day off, dusk on, with future manual override. Do not invent numeric ambient thresholds. tailRunning follows enabled headlights; brake increases intensity independently, indicators animate separate slots. Evaluate emissive plus bounded fake road pool against one limited non-shadow light; Julia selects after image/cost comparison. No per-frame material creation, automatic new shadows or permanent mobile lights authorized.

## P1-2 proposal and falsification gate

Request a separate authorization for one +X front corner: wheel, arch, headlamp housing/emissive slot and small paint surface. Preserve reference wheel center/radius and shell envelope. Deliver one editable blend, exported GLB, versioned export recipe/settings, source/export SHA-256 manifest, reference rights and two edit/re-export records. Exact export command/script does not yet exist: this is an explicit prerequisite for P1-2 dispatch, not a claimed reproducible run.

Proposed acceptance sequence:

1. Julia approves neutral front/side/45-degree shape and topology against original Riviera; full-car production is excluded. Capture orthographic dimensions and origin axes. Verify measured .46 radius and audited center within proposed 1mm tolerance (Julia must accept tolerance).
2. Native-open saved master in fresh Blender process; adjust arch clearance, export A; reopen, change paint/bevel, export B. Preserve modifier controls, authored edits, separate wheel and lamp slots. Record tool/build, commands/settings and hashes for every revision; byte identity of GLBs is not required, semantic transform reproducibility is.
3. Inspect imported node transforms, normals, UVs/material assignments. Sweep front yaw -0.3/0/+0.3 and axle rotation independently in an offline viewer; measure arch clearance and preserve body position. Synthetic future wheel Y +/- .05m is clearance exploration only, not approved suspension range or implemented simulation.
4. Neutral and actual coast dusk, front/side/rear45 and true existing 8m chase camera, identical FOV/resolution/seed/HUD location. Capture baseline and candidate at HUD 350 and 3050, stopped and 65m/s; use the same proposed deterministic input trace, turn inputs -1/0/+1, then reset. No replay harness has been verified or built in this research. Before capture dispatch Julia must freeze a fixture manifest containing source/build SHA, stage and traffic seeds, initial state, timestamped input trace and timestep, exact HUD sample positions, camera world/projection matrices, FOV, resolution/DPR, lighting/exposure and renderer settings. An authorized capture implementation must first prove two baseline runs reproduce these states; otherwise report capture BLOCKED instead of claiming replay comparability. Any in-game adapter/capture requiring runtime changes waits for P1-3 authorization. Log exact resolved camera matrix/exposure/render settings, not just a label. Preserve FZR-123, red/white/seafoam and frozen people.
5. Later P1-3 regressions: existing hero-car tests plus named GLB contracts, grip/door contact at existing .0001 criterion, actual left/right/reset video; head/tail/brake/indicator truth table. Existing tests alone cannot certify imported art.
6. Pixel 8 future paired baseline: same build/browser/OS, thermal state, resolution/DPR, scene seed, replay and settings; three 60s runs after 30s warmup, separately record cold load. Record median/p95 frame time, FPS, available CPU/GPU timings (unavailable fields UNKNOWN), draw calls, triangles, material/texture counts, transfer bytes and load latency. Julia sets allowable deltas after baseline, before candidate acceptance; no fabricated 60 FPS or budget. #45 remains open.

L1 requires one native-edit/export/import slice with correct independent motion; it does not establish art/mobile readiness. L2 additionally requires repeated native edits, legitimate provenance, independent restore, actual required gameplay motion/lighting, reviewed visuals and Pixel 8 budget evidence. No L2/L3 claim here.

Falsify A if editable arch changes cannot preserve pivots/material separation or repeated exports, highlights fail Julia's review after at most two corrections, or measured runtime cost exceeds agreed budget. Stop on missing rights/backup, unexpected transform compensation, broken existing grip/gesture/paint, or scope expansion. Record failed source hashes, commands and captures; propose method review, not another TS shell or automatic AI fallback.

## Real master retention proposal

P0-3 independent backup is still incomplete. Propose a private versioned asset repository with Git LFS for blend and large textures, normal Git for recipe/manifest/license, and an independent versioned object-store backup in a different failure domain/account. Michael must approve provider/access/cost before provisioning. No LFS migration or upload now. Manifest ties source commit + blend SHA-256 + texture hashes + Blender/exporter build + settings to GLB SHA-256; game repo pins that manifest revision. Do not store only a C: path or LFS pointer without reachable objects.

For P1-2 acceptance, second operator restores the exact source revision into a fresh directory from independent storage with primary copy unavailable, verifies hashes, opens natively, performs a small edit, re-exports and validates nodes. Record operator/time/object version/restored hashes and result. Same-machine duplicate is not backup proof. Preserve accepted sources and prior accepted exports; expire temporary captures only after review and retention approval, never delete failure evidence automatically. Storage provider, access separation and actual restore remain UNKNOWN and block L2.

## Review handoff

Only this report and asset-pipeline/p1-1-riviera62-research.json are intended changes. The contract is an actual RESEARCH record with all production capabilities unknown and approvals pending, not synthetic production approval. P0 checker validates records only. No gameplay tests/build, GLB creation, visual capture or device benchmark performed. Validation results are appended after execution. Stop for Judy's independent diff/evidence review; no push/PR/Issue mutation in this handoff. A later authorized Draft PR goes to dev and stops for Julia/Michael; P1-2 needs fresh approval.

### Supervisor audit corroboration and validation

Independently read src/main.ts: groundWheels (627 onward) resets each exposed wheel pivot Y to .46, then corrects contact along its parent's local-up, bounded to +/- .4 from rest. Main pose (1047 onward) already applies slip/impact/weightRoll to world.car and adds road banking. Therefore existing wheel-height adjustment and whole-car roll ARE present; deferred work is a deliberate sprung-body/independent suspension design, not introducing roll from zero. A future adapter must expose mount nodes compatible with groundWheels or explicitly migrate the contact calculation under separate authorization. Keep contact order stable, keep mounts outside sprungBody, and do not apply existing weightRoll a second time. The current whole-car banking/contact behavior remains baseline; separating weightRoll from road banking needs its own reviewed transform change and sloped-road regression proof. P1-2 offline tests cannot certify that integration.

The batch warning above is source-verified. previousLook is character QA rollback (including .84 character scale), NOT a car-model selector. The proposed TS/DCC car fallback does not exist today and must only be implemented/tested in separately authorized P1-3.

Executed on Node 24.21.0 / Windows: default research contract checker VALID (11 production blockers); --production intentionally refuses RESEARCH, six unknown capabilities and four pending approvals. node --test scripts/test-task-contract.mjs: 14/14 pass, exit 0. No production capability or human approval is authenticated by those results. No game tests were run because this handoff changes documents/contract only. Judy's source observations were corroborated before first handoff; these are not completed post-handoff correction passes.

### Correction pass 1 record

Judy independently identified the contradictory sprungBody identity/origin, incomplete steering parent transforms and unspecified replay fixture in def0da6. This pass replaces them with one explicit local T/R/S contract and bidirectional signed mapping, source-matched steering composition, and a mandatory capture-fixture prerequisite. No DCC round trip or replay infrastructure is claimed. Correction count is 1; findings are addressed in this proposal but independent re-review remains pending, rootCauseResolved remains false until that review. All production approvals remain pending and capabilities unknown. Medium was requested; actual model/effort remains independently unverified.

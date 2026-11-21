# 極速漫遊 / OutRun — current project rules


## ACTIVE STAGE GOAL — R2b Working Harbour after Kenting (2026-11-21)

**Latest Michael direction:** leave the uniquely valuable `OutRun-local-archive/` evidence in place; archive cleanup is not today's work. The next coastal scene is **Working Harbour, naturally following Kenting's lighthouse and rocky headland**. [Issue #72](https://github.com/michael-wang/OutRun/issues/72) is the authoritative work order: **Judy independently performs route planning → playable Macro Layout → (only after Michael's personal Macro acceptance) existing/proxy-asset Composition Pass**. No Codex is needed for the phases Judy can really execute; **new Blender/DCC source production remains deferred until Codex returns**, even if Judy can inspect existing files.

**Do not conflate authorization with PASS:** the Harbour's actual entry/exit ports, length and position remain **UNPLACED** in `content/scenery/coast-neighbours.json`. Do not use historical 4600m anchor as current. Preserve approved `immediate` A6→Kenting arrival, white lighthouse near track6020, original ocean and sunset, five-lane race and stream/Worker/AI safety. The existing rocky continuation 6800–8450m may be refitted or extended as a genuine segment, **not automatically used as a mandatory Connector**. Road grades and harbour basin/shore elevations must be coherent; existing cliff challenge begins track8410 and must be intentionally preserved/moved if affected. Old 14.2km stage length is not binding. Update the **existing** [canonical stage composition](docs/route/stage-composition.md) and minimal source data; no repeated trial Markdown.

**Review sequence:** Judy supplies actual moving road Macro before art detail; Michael alone accepts gameplay rhythm/feel. Composition reviews require real game views with non-Blender proxies; cannot mark Composition PASS from schematic or code tests alone. When finished, hand off a small asset-production list to Codex for a separate future Goal, without creating unapproved GLB/Blender assets or publishing `main`.

---



## ACTIVE ASSET SOURCE CUSTODY — simple GitHub-first policy (2026-11-21)

**Owner decision:** 《極速漫遊》是個人 hobby project。對 Michael 已准許公開且已檢查來源／授權的小型可編輯資產，**現有 public OutRun GitHub repository 的 `dev` 就是版本化 Source of Truth**；不必先建立私人 Asset Vault、D 槽備份、第二個 GitHub Repo 或 LFS（超過 GitHub 一般 Git 大小限制才另議）。正式角色頭髮母檔預定 `art/source/characters/r6d-cover-locks.blend`；舊版工作路徑 `art-prototype/output/r6d-cover-locks.blend` 仍在忽略目錄，直到提交驗收成功前不得刪除。這項公開許可**僅適用已經確認可公開的 R6d 母檔**，不自動延伸到 Hunyuan 原始模型、第三方素材、未核准私人檔案。

**責任：** Technical Artist／Codex 製作並交付原生母檔與依賴；**Judy = Asset Librarian**，在本機檢查檔案、來源／授權／雜湊，將獲准公開的小型母檔以 Git 提交並 **Push 到 GitHub**，確認遠端 blob 可取得；**Julia** 審查來源鏈、Manifest、測試與實際 GitHub 路徑；**Michael** 決定美術與公開授權。Judy 不需要為此任務等 Codex 額度或先詢問 D 槽位置。

**關閉門檻：** R6d 的可編輯 Blender 母檔必須從 GitHub 版本還原至暫存位置，實際使用 Blender 開啟、確認基本網格／骨架／材質並做最小可編輯性測試；來源雜湊與原檔一致、必要上游 GLB／匯出腳本仍可取得、回報真實結果。執行 `npm run assets:source:check` 是 Git HEAD 及內容雜湊的機械檢查，不是 Blender 美術、法律或可編輯性 PASS。**未 Push 成功、遠端不存在或 Blender 還原未驗證，不可關閉 Issue #70**。原檔保留直到驗收完成；禁止在 public Repo 上傳未獲准素材。參照 [資產保管制度](docs/ASSET_SOURCE_CUSTODY.md) 與 [保管清單](asset-pipeline/source-custody.json)。

**備註：** GitHub + 工作電腦提供這個 hobby project 的基本版本保存，但不是跨平台災難復原的完整保證。若將來需要額外離線備份再另行決定，不阻擋目前 R6d 任務。美術驗收與來源保管驗收仍分開。


---

## CURRENT WORKFLOW RULE — documentation lifecycle and clean handoff (2026-11-20)

**Applies to Judy, Codex and every collaborator, for each Goal, experiment and art iteration.** This is an active operating rule; older dated checklists remain history, not permission to create another permanent report for each A/B attempt. Michael's explicit current directions and asset/privacy rules still take precedence.

1. **Find the source of truth before editing.** At Goal start, identify the current authoritative design/spec, content data and tests for the affected subsystem. For coast scene order and road assembly, use [docs/route/stage-composition.md](docs/route/stage-composition.md); for approved Kenting visual composition, use [art/reference/coast/kenting-beach-2/README.md](art/reference/coast/kenting-beach-2/README.md) and runtime content. Name the intended canonical document(s) in the task handoff. A historical brief, old HUD station, report or experiment URL must not silently override current implementation or owner acceptance.
2. **One canonical living document per feature/decision, not one Markdown per attempt.** Update the existing authoritative document when the approved decision changes, with a small decision log or link to the relevant commit/Issue if provenance matters. Avoid creating `docs/P2_G1_*_REVISION.md`-style chains of duplicate or contradictory specs. Create a new tracked document only for a genuinely distinct long-lived contract, original approved art/source, essential reference or independently needed evidence; explain why it cannot fit the canonical document. Do not replace an unrelated feature's source of truth.
3. **Keep iteration artifacts outside the permanent source tree by default.** Put disposable A/B reports, screenshots, diagnostics, prototype exports, ephemeral route maps and trial ZIP handoffs in ignored `test-results/<goal>/` or a named **local** archive outside the repository. Do not scatter loose ZIPs, temporary Markdown files or giant logs in the repo root or `docs/`. Never claim uncommitted local reports are published documentation. Keep only the minimal approved/versioned diagrams and regenerated data that the team will actually use.
4. **Preserve irreplaceable evidence before cleanup.** Editable Blender masters, licensed/private assets, source art, failed-experiment evidence, reproducibility metadata, hashes and required compliance/QA traces may need long-term retention. Store them in the approved private/local archive or an explicitly authorized versioned location, not automatically in public GitHub. Do not delete another worktree's untracked or ignored files, publish restricted ZIP/GLB/photos, or use destructive `git clean` / `--force` just to make status pretty.
5. **Goal closure is a mandatory consolidation step.** Before marking a Goal DONE / REVIEW READY: (a) update canonical docs and mark superseded instructions as historical; (b) ensure links, local-vs-track station labels and status claims match the actual source; (c) retain the relevant code, tests and approved design artifacts under source control; (d) inventory `git status --short` **and** task-owned ignored/temporary output; (e) remove or locally archive task-owned scratch docs, ZIPs, duplicated diagrams and dead branches/worktrees only after checking for unique content; (f) report what was committed, what remains local, and anything still UNKNOWN. Never delete unowned/private material by inference.
6. **Honest final handoff.** Give one concise result containing the current canonical file/commit, implementation and test status (distinguish local test, actual device, visual/art and Michael approval), remaining blockers, and the next concrete task. If a historical trial is retained only as regression fixture, label it so; do not advertise the old report as a live specification. New experiments should begin from this handoff, not re-read every superseded A/B note as active instructions.

**Success criterion:** after an accepted iteration, a new contributor can find the current decision in one place and the working tree is not cluttered with that iteration's throwaway artifacts. Git history / Issue records provide audit trails; the current docs describe the currently approved game.

---


## 2026-11-18 — Canonical P2-G1 beach design images in public repo

**Michael explicitly authorized publication of our original concept artwork.** The five original P2-G1 beach design PNGs, survey-linked layout and Michael's road/reveal sketch are now versioned in [art/reference/coast/kenting-beach](art/reference/coast/kenting-beach/README.md), with verified SHA-256 manifest. Use those actual repo files for art/scene decisions instead of requesting the old handoff ZIP or assuming image bytes exist only in Julia's Page. **No publication authorization for third-party lighthouse photography, privately held Hunyuan model files, or assets with separate licensing issues.** The art sheets are not live road measurements or a signoff of the current Macro; Issue #67 remains the active gameplay-experience gate.


## ACTIVE GOALS — Kenting swimming beach P2-G1 + Option B default P1-G4 (2026-11-17)

**Michael's LATEST owner decision:** Instead of beginning with a harbour, **BUILD THE KENTING-MEMORY SWIMMING BEACH FIRST** via [Issue #67](https://github.com/michael-wang/OutRun/issues/67). Prototype site is existing coast `beach-market` hero anchor **HUD 5,980m**, side left; **location not locked** until live camera views are checked. Scene inspiration is Kenting/Nanwan wide sand, bathers, clustered colorful parasols, shallow turquoise-to-deep ocean, surf and green hills under accepted Style B sunset. High-impact near/mid/far composition first, not tiny props. Keep Asset Library → Scenic Package → Stage Layout; member meshes never hard-code metres, adapt local shore terrain AND Ultra Water waterline together, don't globally rewrite coast/AI/road/guardrails. This is **owner-authorized core dev**, not an unapproved Julia harbour suggestion. Judy can autonomously produce one complete playable beach on dev and then request Julia/Michael review.

**Second active Goal:** [Issue #68](https://github.com/michael-wang/OutRun/issues/68): accepted Hunyuan Option B car becomes the **NORMAL default player car without `?hero3d=1`**. `src/main.ts` currently gates the loader behind `import.meta.env.DEV && params.get('hero3d')==='1'` and `src/option-b-car.ts` loads private `/__local/option-b.glb`; these are NOT a production asset path. Judy owns staged-to-default dev implementation, mobile/LAN and real PWA/production-like asset packaging with graceful fallback (legacy car for explicit QA/failure only) and no pop-in on START. Keep the selected owner's private G3 .glb/.blend source and hashes. **A global public `main` release is NOT yet cleared**: Tencent Hunyuan3D 2.1 LICENSE 1.l/5.c excludes EU/UK/South Korea for outputs, and a globally accessible site needs license rights / allowed replacement asset / a properly authorized distribution solution before main. No silent publication of private model source, images or internal logs; public runtime GLB delivery requires a legitimate release-rights decision and correct PWA cache. User wants a real default car, not a no-op query removal that ships the old car.

**Working style:** indie dev-first: Judy leads ONE cohesive result per Goal, not micro-approval after each beach umbrella or model loader change. Both tasks may advance with separate commits, coordinated to avoid collisions; **directly on dev**, no feature branches by default. No paid model services, global CUDA/PyTorch changes, bypassing security, rewriting player yaw/handling, heroine redesign or automatic main release. `main` remains stable; tests and device evidence are honest. Previous P2 harbour proposal and old G3 dispatch paragraphs below are HISTORY, not current work orders. The four accepted G3 car polish notes remain DEFERRED.

---

## GIT WORKFLOW — dev-first after G2 merge (2026-11-17)

**Owner policy:** Core OutRun development—including hero-car geometry, materials, camera/gameplay UX and stages—commits directly to **dev** by default, with meaningful local build/tests and clean commits. Long-lived feature branches/PRs are NOT mandatory and should be exceptional for truly conflicting or destructive experiments. Only **main** is the public release line; main push triggers release CI, dev should NOT run exhaustive CI on every push.

**G1/G2 accepted:** [PR #64](https://github.com/michael-wang/OutRun/pull/64) was reviewed and merged to dev (merge commit `c0e63e8`). Its private Hunyuan GLB/.blend are **not** in the public repository; `?hero3d=1` is local-only and requires the privately staged `.local/option-b.glb`. Old vehicle remains default / missing-asset fallback. **New Goal #66 must use dev directly**, preserve the original code and local asset, and NOT spawn another feature branch just because an Issue exists.

**Branch hygiene:** the now-merged G1/G2 task branch, already merged P0/P1 research branches and closed delivery-test refs are cleanup candidates after checking no unique unretained evidence/commits. #61 remains an open Draft preservation of historical ART FAIL and needs separate review before cleanup; checkpoint branches need audit. No unsafe branch deletion or force rebase, and don't interrupt game work for the branch audit.

**Current final-photo button mapping:** standard controller **R3 is screenshot/photo** (and Touchpad/F8/UI remain photo options). **L3 CLICK is the reset-to-chase button for new camera orbit**—owner explicitly corrected the previous R3 reset idea. Don't accidentally change R3 photo.

---

## CURRENT PROJECT CHECKPOINT — G3 owner PASS; P2 scenery is next RECOMMENDATION (2026-11-17)

**Michael ACCEPTED P1-G3 as a satisfactory indie-game prototype**, after his own playtest and five real car screenshots. [Issue #66](https://github.com/michael-wang/OutRun/issues/66) is closed with [Julia's four nonblocking polish items](https://github.com/michael-wang/OutRun/issues/66#issuecomment-6942153067): Option B front light shape still differs from concept (medium); centered rear plate/brand panel too large (low); bronze/gold exhaust surrounds too subtle (low); open gap behind seats from non-gameplay review angles (low). **Do not reopen or micro-fix now** unless Michael asks. Rear/side/overall look is accepted for current game. G3 stays dev-only with the Hunyuan model sourced from owner's private `.local/option-b.glb`; no public binary asset or worldwide license clearance. Judy's 122 files/524 unit and browser test reports are preserved; **real Pixel 8 and physical controller remain unverified**.

**Next Julia proposal (NOT YET AUTHORIZED): P2 first hero scenic package**, starting from `working-harbour` anchor `roadDistance:4600` in `content/stages/coast/scenic-layout.json`. Use Asset Library → Scenic Package → Stage Layout, generate a few coherent coastal Taiwan-inspired pieces (fishing boats / dock equipment / warehouses), stage them around the existing road without disrupting racing, check at speed in real chase views and on Pixel 8 when possible. Scenic Package is a deliberate next artistic priority now the main player car has reached an acceptable prototype level. DO NOT auto-start P2 just because it is recommended. Keep the future lightweight game-experience roadmap separate, and do not start stage two without new owner direction.

**Core Git policy remains dev-first**. `main` public release is separate and requires device/license/release checks. Preserved failure/source archives, unique commits and historical branches require safe audit before pruning; don't make branch cleanup a blocker for P2.


## ACTIVE WORK — Judy owns the playable Option B hero-car prototype (2026-11-17)

**LATEST OWNER AUTHORITY:** Michael explicitly expanded Judy's autonomy and authorized [Issue #63 — P1-G1 complete playable Option B hero-car prototype](https://github.com/michael-wang/OutRun/issues/63). The approved Hunyuan3D 2.1 sculpt from [Issue #62](https://github.com/michael-wang/OutRun/issues/62) is a **useful rough body** (technical Shape PASS, indie-prototype art CONDITIONAL PASS), not final hero art. **The lower rear bumper's porous/rough geometry is DEFERRED POLISH, not a blocker for local game integration.** This authorization supersedes earlier *no Paint / no P1-3 / one-shot Shape / stop at each milestone* instructions **only for this dev-only, reversible, local prototype**; earlier reports and negative evidence remain historically true.

**ONE BIG GOAL, not micro-approvals:** Judy independently directs Windows Local Codex from preserved raw GLB/.blend → sensible degenerate-mesh cleanup/decimation → good-enough paint/PBR (optional standalone Hunyuan Paint if already available, immediate Blender PBR fallback) → adapter that reuses existing wheel pivots, steering-wheel/driver grip and heroine/traffic logic → **the new car actually driving on the coastal road** via a documented test-only preview flag with the old player car as default/fallback → PC visual and regression tests → **one final Draft PR to dev and handoff for Julia/Michael review**. Judy may make ordinary local implementation choices and iterate without per-step permission. No arbitrary two-correction hard stop; after repeating the same failed approach twice, change tactic and keep moving unless blocked by a material constraint. Accept harmless indie-game cosmetic flaws; judge rear imperfections at actual 8m game chase scale.

**HARD LIMITS still apply:** no paid cloud service, Tripo credits, admin/system/CUDA-PyTorch changes, weakening browser/security permission checks, gameplay physics rewrite, heroine redesign, main/public deployment, destruction of previous sources, or publishing original Hunyuan GLB/.blend, source images and sensitive logs/screenshots to this **public repository** without separate owner disclosure authorization. Authorized local/reversible model preview and code/test Draft PR are OK; if art remains local, explicitly document how Michael can run it and don't pretend a public branch includes the binary. Tencent Hunyuan licensing for worldwide distribution is unresolved: no public shipping claim. Pixel 8 FPS stays UNKNOWN until real device evidence. Issue #63 is current; #62 is the earlier Shape research, #59/#60/#61 remain failure history.

**Work status:** Judy should report IN_PROGRESS at actual start, PLAYABLE when local game integration works, AWAITING_JULIA_REVIEW with real delivery/PR, or BLOCKED with a **material** issue. Do not demand owner attention on every minor artifact/command/fix. Medium Codex reasoning effort by default; Low for simple checks, High for genuine hard root cause; Extra High needs specific approval. Do not invent effort telemetry.

---

## CURRENT GATE — one Hunyuan alpha-mask A/B rescue authorized (2026-11-17)

**Michael explicitly approved ONE further local Hunyuan3D 2.1 Shape-only diagnostic for [Issue #62](https://github.com/michael-wang/OutRun/issues/62#issuecomment-6926838438).** The first Shape result was **ART FAIL** (solid slab, fused details) but the model ran successfully; the input was opaque RGB with an inner rectangular illustrated background. This is an **input-preprocessing root-cause test**, not proof the Shape model passed. The prior first candidate, all originals, failure reports and #59/#60 remain unchanged.

**FIRST:** create real alpha cutout of the original primary image with locally authorized BackgroundRemover; independently inspect a checkerboard/alpha preview for no background rectangle/shadow and intact cockpit/wheels/contour. If mask fails, STOP without GPU run. **ONLY AFTER MASK PASS:** exactly one new Shape-only inference with identical first-run model/checkpoint/seed/steps/settings; only input transparency may change. Record original/new input hashes, actual results and genuine neutral Blender comparison renders. **Do not run Paint**, attempt further rerolls, advance P1-3 or restart Blender-from-scratch. Report ART PASS/FAIL separately from mask quality. Use appropriate Codex effort; no paid/cloud inference.

**PUBLIC DISCLOSURE STILL NOT AUTHORIZED:** the user approved local A/B only, NOT publishing the raw GLB, sanitized Blender, screenshots or logs to the public GitHub repo. Judy may post sanitized **text** status / hashes in Issue #62. If she needs to share binary art evidence, ask for separate explicit disclosure authorization or an approved private handoff; no safety review bypasses. Mark IN_PROGRESS only once actually working, BLOCKED if cutout or Shape fails, and AWAITING_JULIA_REVIEW only with real shareable evidence. Existing prior instructions below are historical snapshots and do not permit extra scope.

---

## CURRENT WORK — Option B Hunyuan3D 2.1 Shape→Paint pilot, Issue #62 (2026-11-17)

Michael accepted the **Option B Modern Grand Roadster** visual direction and authorized a new [P1-2H Hunyuan3D 2.1 local image→3D spike, Issue #62](https://github.com/michael-wang/OutRun/issues/62), supervised by Judy using existing Windows Local Codex. This is **QUEUED** until Judy confirms source-image byte access and starts; it is *not* evidence any inference has run. [Reference image page](https://chatgpt.com/space/page_cdb53387bb3c8191b794fa168c69ec7a) contains original six angles, concept sheet, a prepared single-image 1024px Hunyuan input and SHA-256 handoff. **Verify actual source image bytes/hashes before using them.** If inaccessible, stop for a safe source handoff, do not use the older Style B collage as substitute.

**New hypothesis—not Blender patch #3:** Prior [#59](https://github.com/michael-wang/OutRun/issues/59) STOPPED/BLOCKED and [#60](https://github.com/michael-wang/OutRun/issues/60) ART FAIL with [partial Draft PR #61](https://github.com/michael-wang/OutRun/pull/61) remain preserved; both used their two correction passes. No new freehand manual Blender carving on those failed candidates. Generate **one complete car Shape-only** with local Hunyuan3D 2.1; save raw mesh and real neutral multi-view renders for Julia/Michael ART checkpoint. Only if plausible, run standalone **bounded** Paint/PBR (16GB RTX 5070 Ti vs official ~21GB Paint guidance; no simultaneous ~29GB combination); allow one documented official low-memory retry and otherwise use simple Blender PBR materials as a deliberate fallback. Record actual OOM, GPU and version evidence, source/output hashes, and territorial-license constraints; local research outputs NOT cleared for worldwide shipping.

**STOP CONDITIONS:** no paid/cloud inference, Tripo credit spend, model license claims, P1-3 gameplay integration, changes to existing `src/`/`public/assets/`/`content/`, main release, heroine modifications, or automatically advancing after an ART fail. A draft PR with truthful portable evidence and source retention is required before final Julia/Michael review. Judy must update [Issue #62](https://github.com/michael-wang/OutRun/issues/62) IN_PROGRESS/BLOCKED/AWAITING_JULIA_REVIEW and record actually applied Codex reasoning effort or UNKNOWN. Historical P1-2/P1-2R instructions below do not authorize continuing their failed modeling methods.

---

## CURRENT WORK — P1-2R Blender visual-first method reset (2026-11-16)

**Current authorization:** Michael confirmed the surviving P1-2 Blender files are saved and authorized a **different bounded modeling method**, [P1-2R Issue #60](https://github.com/michael-wang/OutRun/issues/60). Judy → authenticated Windows Local Codex. This issue is **AUTHORIZED/QUEUED, not proof of active work**. Prior [P1-2 Issue #59](https://github.com/michael-wang/OutRun/issues/59) remains **STOPPED/BLOCKED**, with its **two correction passes exhausted** and no Draft PR. **DO NOT start a third #59 correction, clear its old failure, override browser security review, or pretend its asset work passed.** The earlier P1-2 authorization below is historical.

**New method / different hypothesis:** preserve saved #59 .blend, GLB and failure records without overwriting. Start a NEW .blend source revision, emphasize **editable connected fender/arch topology, smooth surface and plausible broad paint highlights** under neutral and dusk views. Deliver real native Blender multi-view and wireframe evidence first. Only if the art gate has credible evidence proceed to independently modeled wheel rim, complete headlamp housing/lens, two genuine source edits, repeated GLB export and legitimate **offline structural Three.js GLTFLoader** validation (when permitted). Don't let a cluster of primitives or a script-rebuilt car shell masquerade as an artist-editable hero model. Blender tools/scripts may assist, but final geometry must remain genuinely editable and visually suitable for Riviera 62.

**Security and stop:** an earlier browser UI safety review stopped the interactive viewer. Do **not** bypass, weaken permissions, reroute prohibited access or claim browser PASS. A permitted in-process, offline Three.js parser check can establish *structural* behavior only; if unavailable mark it blocked honestly. Under the **new** independent method issue Judy can request at most two narrowly scoped corrections, then stop; no third or further self-authorized reset. Preserve existing game/player/character/physics/main; P1-3/P1-4 NOT authorized. Deliver an honest Draft PR with source and authentic evidence if possible, or mark blockers and expose reviewable artifacts.

**Status discipline:** Judy updates [Issue #60](https://github.com/michael-wang/OutRun/issues/60) when actually running (`IN_PROGRESS`), stopped (`BLOCKED`) or when a Draft PR exists (`AWAITING_JULIA_REVIEW`). Record applied Codex reasoning effort (or UNKNOWN), model/tool version, source+export hashes. Michael should not need to copy Judy's chat messages to know if she is working.

---

## CURRENT WORK — P1-2 DCC slice authorized (2026-11-16)

Michael authorized [Issue #59](https://github.com/michael-wang/OutRun/issues/59): Judy supervises Windows Local Codex to create ONE artist-editable Riviera 62 front-wheel/arch/headlamp/paint Blender slice, save and version the native source, actually re-edit/re-export GLB twice, and demonstrate independent wheel yaw/roll and lamp-emission toggles in an OFFLINE Three.js importer. Submit a DRAFT PR for Julia/Michael review and STOP. Issue creation is not proof that Judy already began work.

[PR #58](https://github.com/michael-wang/OutRun/pull/58) has passed P1-1 research and merged to dev; prior P1-0/P1-1 and P0 pending-authorization sections below are HISTORICAL and superseded for dispatch. Use [current Tracker](docs/PRODUCTION_PIPELINE_TRACKER.md), [P1-0 Brief](docs/P1_RIVIERA62_PIPELINE_BRIEF.md) and [P1-1 Research](docs/P1_1_RIVIERA62_SPIKE_REPORT.md).

**Physics clarification:** vehicleRoot position is a scene-graph convention, NOT a fixed real-world center of turn. Front-wheel steering does not mean the whole car always pivots around its front axle. Keep the existing wheelbase, independent wheel mounts, body roll and road banking; preserve the distinction between vehicle path, Yaw, drift slip and body Roll. Do NOT change existing car Yaw/physics in this Blender/GLB task; the user's turning-center question is deferred to a separate gameplay review.

**Limits:** this is a bounded L1 candidate, not P1-3 runtime integration or P1-4 Pixel 8 acceptance; no edits to production gameplay/assets/content, no full-car production, character/R6d changes, main, public release or unapproved spending. Native .blend must be retrievable/versioned, but no elaborate multi-provider backup infrastructure or deterministic in-game replay harness is required for this first OFFLINE slice. Judy verifies tool environment, actual effort/model selection or states UNKNOWN, and independently reviews real Blender/edit/export evidence with at most two correction passes.

**Carry forward:** left-hand-drive steering wheel + driver's right-hand grip and door-resting left hand; independent visible steering left/right; dark-scene front headlamps and permanently lit rear running lamps while headlights are enabled, separate from brake/indicator semantics; future independent left/right suspension travel and arcade body roll (structure now, dynamic effect later). Use an editable Blender source and traceable GLB for future proof, never present hand-coded TS body geometry as a validated DCC pipeline.

**Judy -> Local Codex dispatch:** set a task-appropriate reasoning effort and record the actual choice/reason: Low for deterministic inventory, Medium by default, High for hard/high-rework pipeline tradeoffs, Extra High/xhigh only exceptionally with approval. Preserve tested source, bounded corrections and separate technical/art/device/owner PASS. The current P1-0 work changes only documentation.

---

## P0 pilot checkpoint — read this first

**Current state: P0 branch review-ready; final report/diff review pending before push and Draft PR.** Michael authorized P0-1–P0-4 and a final Draft PR into dev. Julia independently accepted P0-2, P0-3 and P0-4 technical scope with explicit limits. P0-1 remains PARTIAL/unsynchronized; **Michael directs no public Issue edits or retries**. See [Tracker](docs/PRODUCTION_PIPELINE_TRACKER.md), [Brief](docs/DOT_P0_PILOT_BRIEF.md), [final report](docs/DOT_P0_PILOT_REPORT.md) and [task contracts](docs/TASK_CONTRACTS.md). Current delegation is final documentation/status only, then stop for Julia’s final diff review before push/PR. P0-4 used its two correction passes; no third correction. No P1/P2, character work, migration, cleanup, runtime/art/version changes, paid calls, deploy or merge. Technical acceptance does not authenticate human approvals or prove actual car abilities, device results or independent source backups. This temporary review gate preserves the full-pilot authorization.

Authority: current explicit Michael instructions → Tracker/current Brief → this top directive → applicable engineering constraints → dated historical specs. Historical “next”, “active”, “current”, version and acceptance statements below are records at their stated dates, not new work authorization. Preserve valid safety/identity constraints and failure evidence. Character work remains **ON HOLD**; #45 remains an unresolved device release gate.

Snapshot at base `e81272a0e3295c942ece8b3d305bc49b0337fbe0`: package **0.10.30**; authored coast **14,200m**, HUD **350–14,550**. Use source data for current geometry, not old 10km/30km plans. No new visual, device, owner or release acceptance is asserted.

## CURRENT DIRECTIVE — production workflow reset (2026-11-16; overrides historical work orders below)

**Authoritative current priorities / status:** [Production Pipeline Action Tracker](docs/PRODUCTION_PIPELINE_TRACKER.md). **Read before starting any Codex work.** The historical R7 clothing/body/Hunyuan tasks below are records, NOT instructions to resume. **Issue #54 and further heroine fullbody/clothing/hair/facial polish are ON HOLD** unless Michael explicitly reopens. Preserve the currently playable v0.10.30 heroine and approved R6d wind-swept golden bob/gestures; do not change game assets to pursue unapproved character art. Do not claim Pixel 8 hair performance PASS without a real device check.

**Near-term game experience:** arcade racing first, diverse scenery second, additional driving goals (coins, target-car impacts, obstacle courses) later. Focus on P0 production-pipeline governance and original asset tracking, then P1 Riviera 62 DCC→GLB→Three.js proof, then P2 portable scenic kit proof. Do not mass-create scenery, start new racing features, or expand character work until the relevant gate passes. Julia owns method/downstream requirement review; Codex researches/implements only bounded approved tasks; Michael accepts artistic/playable results and public release.

**Budget:** the former blanket NT$0 rule below is superseded. Paid tools/services may be evaluated, but purchases/API fees require Michael's approval after a concrete cost/benefit/licensing recommendation. No unapproved spend.

**Review discipline:** Use explicit RESEARCH/SPIKE vs PRODUCTION tickets; preserve editable originals (designs, Blender masters, source audio/music) with planned source control; proofs and screenshots are temporary evidence, not permanent art sources. Pipeline L0–L3 is separate from feature/test PASS. Stop and reconsider the method before repeatedly patching an unvalidated pipeline. Status-unknown Issue count, not necessarily Open Issue count, must reach zero at the end-of-day review. Use the independent pilot branch for this handoff; main requires Michael approval.

---


> **Historical art record:** all work orders in the following dated R6/R7 sections are inactive. Read for provenance and preservation constraints only; the Tracker and P0 checkpoint above govern dispatch.

## HISTORICAL RECORD — ART WORK — R7 Clothing P1 on approved MPFB body (2026-11-15)

**Body foundation #53 ART/ENGINEERING PASS**: actual Blender four-view/wireframe/rig outputs prove the MPFB 2.0.18 model has a continuous human basemesh, separate feet/fingers/pelvis, functioning 53-bone rig (26,756 tris). It is accepted as a **BODY SUBSTRATE ONLY**. MPFB's TEMP face/head is not the final heroine identity, and the figure without clothes does not mean the final heroine art is approved. Do NOT generate any more bodies, graft old procedure limbs, retopo a broken Hunyuan skirt, or move head/hair now.

**Active next bounded Codex task: [Issue #54 — independently made ivory B-2 dress](https://github.com/michael-wang/OutRun/issues/54)**. Use MPFB MakeClothes/helper-skirt or the smallest genuinely separate Blender clothing-mesh/weight-transfer route; the dress MUST be its own skinned garment over an intact human body, not replace the pelvis or be sliced from the old Hunyuan mesh. Outfit: two bands FROM FRONT BODICE over shoulders DOWN to BACK WAIST (NO neck loop), open upper/middle back and covered lower waist, flattering ivory asymmetrical wrap and gathered side knot. ONE garment candidate + front/profile/back45/rear and pose bend proof, then STOP for owner/Julia. No face graft, hairstyle, five game gestures, whole-body GLB into runtime or male/car modifications yet. **DEV v0.10.30 playable heroine is frozen**, no `src/`, `public/assets/`, version or `main` changes. NT$0, offline-only so no verify:dev needed. The prior #53 body task is COMPLETE, not an instruction to recreate another candidate.

## HISTORICAL COMPLETE — R7 Body Foundation P0 with MPFB (2026-11-15)

**CURRENT NEXT LOCAL CODEX TASK: [Issue #53](https://github.com/michael-wang/OutRun/issues/53)**. Complete human anatomical basemesh+rig FIRST, using **official free MPFB (MakeHuman Plugin for Blender)** with existing Blender 4.5. Do **NOT** continue R7T mesh grafting, old ellipse-ring body generation or run Hunyuan3D on the same clothed image again. R7T provenance [audit](docs/art-review/r7t-audit/README.md) CONFIRMED old R7H procedural arms/hands/shoes and overlapping garment joined to incomplete Hunyuan torso and manually reconstructed mirrored legs; a CLOTHED surface was falsely treated as a complete body under the dress.

For MPFB, check official CC0 bundled assets / generated mesh licensing (addon code GPL but generated mesh not GPL), create **one standalone female full-body neutral A-pose**, adjust silhouette to owner-approved illustration, produce a functional simple rig with independent separated fingers/legs and intact pelvis, render 4 views + one relaxed pose with anatomical joint-bend proof, then **STOP for owner/Julia**. No new heroine head/face (frozen approved sculpt), no R6d hair edits, no B-2 dress yet, no game action changes. If MPFB unusable, REPORT and propose fallback licensed Blender Studio Rain v3 rig (CC-BY) rather than silent tool switching. No cloud/paid services (NT$0). Offline-only, no source/runtime GLB or package version changes, no verify:dev, no main. Playable v0.10.30 B-2 heroine stays untouched.

## HISTORICAL RECORD — R7T ART GATE — hybrid failure CONFIRMED; no automatic rebuild (2026-11-15)

[Full R7T source-provenance audit](docs/art-review/r7t-audit/README.md) is now in dev. **NOT A HYPOTHESIS ANYMORE:** the failed fullbody combines the Hunyuan-generated torso/upper arms with OLD R7H mathematical forearms, hands, shoes and some dress geometry. The legs were derived from the Hunyuan mesh but cut, mirrored, straightened and voxel-remeshed, destroying knee/calf shape. Hunyuan's one-piece CLOTHED mesh did not contain a continuous anatomical waist/pelvis beneath the skirt, so cutting out the dress did not reveal an intact usable human body. Many cut boundaries and pose transforms caused disconnected arms / torn garment. Earlier 'just retopo/sculpt the Hunyuan candidate as a finished body' advice is superseded; the green source shape is useful silhouette evidence, NOT a validated complete underlying body.

**NEXT ART-DIRECTION DECISION, not yet authorized for Codex execution:** produce a separately coherent human base (prefer a suitably licensed high-quality 3D stylized rigged body, or one bounded locally generated clean neutral separated-limb A-pose input) and author the B-2 dress as a SEPARATE fitted garment. The design reference must show separated hands/legs at sufficient native resolution; the prior crop was only ~140×484px and hid legs/hands. No mixing old cylinder limbs back into the generated mesh. Once a fullbody shape is itself good, add the frozen heroine face/R6d hair and correct B-2 ribbons. No automatic new inference/sculpt/reconstruction until Julia+owner choose route.

**PROTECT PLAYABLE v0.10.30**: existing seated R7H B-2 heroine, R6d Spring hair + wild dev wind, 1.0 bodies, 8m camera, five gestures, runtime GLBs and source are unchanged. Continue using GitHub docs/images for remote Julia review; large C: Blender/GLB models stay local unless genuinely required for programmatic surgery. No main, NT$0 extra spend, conserve Codex quota.

## HISTORICAL RECORD — OWNER-AUTHORIZED R7S PRODUCTION PIVOT — IMAGE-to-3D BEFORE BLENDER (2026-11-15)

**One authorized Shape-only attempt is now complete; STOP for owner/Julia review.** See [R7S image-to-3D evidence](docs/art-review/r7s-image3d/README.md). Torso/waist/hip improved, but legs are fused, hands/shoes lose detail and the unseen B-2 back ribbons are incorrect. Do not retry generation, sculpt a procedural body, or integrate this candidate without new authorization. Original v0.10.30 game assets and Blender master are unchanged.

**Active next Codex task: [Issue #52 — LOCAL Hunyuan3D-2.1 fullbody gray sculpt](https://github.com/michael-wang/OutRun/issues/52), superseding the older "manually sculpt standing body from the existing Blender ring mesh" instructions.** The local R7S [first Blender rework study](docs/art-review/r7s/README.md) is already complete and **visually inadequate**: ratio/waist improved but mannequin anatomy remains, despite ~183,887 triangles in the experimental standing body+dress. It has NOT changed playable assets. **DO NOT do more mathematical-body rings, mesh-subdivision polishing or attempt to sculpt like a human art director using Blender Python.**

The successful earlier head pipeline was **approved isolated 2D concept → already-working local RTX 5070Ti Hunyuan3D-2.1 Shape-only inference → genuine editable 3D gray sculpt → Blender visual art gate → only later optimize for gameplay**. Reuse that SAME local Python/CUDA environment and shape model, not a fresh expensive installation. Input must be a **clean isolated complete standing FRONT figure crop**, NOT the whole multi-panel board. B-2 dress reference `docs/art-review/r7h-revb/approved-b2.png` supplies outfit design and side/back checking. Hunyuan will invent unseen rear and may warp limbs: **one bounded shape-only candidate**, real Blender front/45/side/back and wireframe against actual design; STOP for owner/Julia. The generated head is NEVER a replacement for the **approved existing heroine face**, and the frozen **R6d blonde hair** stays untouched. The result is an art source, NOT automatically rigged/colored/release-ready. No new paid tools (NT$0), no main.

**Important:** the R7H v0.10.30 in-car heroine is ACCEPTABLE and MUST NOT CHANGE in this trial: gameplay `src/`, `public/assets/`, events, 5 poses, B-2 shoulder-ribbons outfit (NO neck loop), 1.0 people, wild DEV wind, 8m camera all stay bit-for-bit; high-poly Hunyuan output under local ignored tool/workspace only. For offline art inference only, no `npm run verify:dev` and no version bump. Original Hunyuan/Tencent Community License requires separate global release review; no public ship implied.

## HISTORICAL RECORD — REVIEW CANDIDATE — R7H Rev. B-2 shoulder ribbons, v0.10.30 (2026-11-15)

**Owner explicitly resolved the reference conflict: use attached B-2, NO neck loop.** Two ivory ribbons start at the front bodice, pass over the shoulders and converge toward the back waist. This supersedes Issue #51's earlier nape-to-waist wording and the ZIP's older construction notes. The rear center edge is 1.000m (10cm below v0.10.29), with continuous lower-back coverage. See [B-2 review](docs/art-review/r7h-revb/README.md). Only costume geometry changed; exact non-cloth attributes, morphs, skin bind, clips and R6d hair are audited unchanged. Editable v0.10.29 master is preserved; use `scripts/blender/revise_r7h_revb.py` for this revision, not the older `build_r7h.py` recipe. STOP for Julia/owner art acceptance. No further character, hair or vehicle work authorized.

## HISTORICAL (SUPERSEDED BY B-2): R7H Rev. B halter ribbons (2026-11-15)

**Active next local Codex task is [Issue #51](https://github.com/michael-wang/OutRun/issues/51), costume-only**. Owner prefers R7H v0.10.29 to the earlier overly open-backed design but wants the **rear ivory dress panel lowered modestly** (~8–12cm trial below the current 1.100m upper edge; NOT all the way to the old waist-baring .855m), while **TWO true ivory halter satin ribbons** run from the front neckline around back of neck diagonally down to left/right rear waist seam, making an elegant inverted-V. Lower back stays covered. The previous v0.10.29 prohibition on rear straps is superseded. Required latest visual reference is the user-supplied `OutRun_R7H_RevB_Ribbon_Back_Reference.zip` and [canonical Rev B specification](docs/COAST_HEROINE_FINAL_PRODUCTION.md). Do not claim to have inspected the ZIP if it has not been provided to local Codex.

No face, hair, motion, five gestures, overtake event, seat, car or game changes. Keep accepted R6d hair + WILD, characters 1.0 and 8m chase. Rebuild both fullbody and race garment versions from existing Blender master, preserve v0.10.29 assets as fallback, one local `verify:dev`, one dev push, no `main`, NT$0. Do not start male or Riviera work. Art review is the actual rear chase/standing left pose and back45 attachment; Pixel 8 release perf still unconfirmed.

## HISTORICAL (SUPERSEDED): R7H garment coverage correction — v0.10.29 (2026-11-15)

Latest owner direction supersedes the deep waist-level back opening below: ivory halter MINI DRESS with **bare shoulders / upper back only**, a continuous back panel rising below the shoulder blades, and fully covered lower back. No diagonal straps or separate underwear-like band. Only garment geometry changed; face/body, frozen R6d hair/wild, five clips, 1.0 scale, camera and overtake logic remain unchanged. See `docs/art-review/r7h-coverage/README.md` for before/after evidence. STOP for Julia/owner review.

## HISTORICAL RECORD — R7H review candidate — v0.10.28 (2026-11-15)

Issue #50 is implemented on dev for owner/Julia art review. See `docs/art-review/r7h/README.md` for fullbody/race sources, five rear-camera gestures, event/lifecycle evidence and remaining art limitations. DEV defaults to the R7H race GLB; `heroine=r7a` retains the prior model. R6d hair asset, Spring Bones, wild wind, 1.0 people and chase camera are frozen. Side targets follow actual rear view: +X driver/LEFT, -X passenger/RIGHT. Do not begin male/vehicle/hair work until explicitly requested. Pixel 8 was not connected; no mobile performance acceptance is claimed. Older R6 direction below is historical and does not authorize a new hair pass.

Original Three.js / TypeScript / Vite arcade racing game. **Only the coastal race is playable.** Future stages will be hand-authored; the former L1/L2/L3 random route catalogs, procedural director and dead
canyon asset loaders have been deleted; they are **not** requirements. See [current architecture](docs/CURRENT_ARCHITECTURE.md) only when making architectural changes.

## HISTORICAL RECORD — OWNER-AUTHORIZED WORK — finish the blonde heroine (2026-11-15)

**Canonical active Codex task: [Issue #50 — R7H fullbody/backless/5-gesture heroine](https://github.com/michael-wang/OutRun/issues/50)**. Full production contract at [docs/COAST_HEROINE_FINAL_PRODUCTION.md](docs/COAST_HEROINE_FINAL_PRODUCTION.md). This **supersedes the older R7A partial-bust and R7 roadmap advice** to defer fullbody until later. Owner has approved the final fullbody appearance and three rear-chase pose groups in ChatGPT and will provide the offline design-reference ZIP for local Codex use. NO more 2D character design needed; execute one 3D fullbody/editable master plus optimized race upperbody and LIVE rear-facing gesture animations.

**Critical handedness:** From the genuine rear chase view, driver is SCREEN LEFT (vehicle +X), heroine is SCREEN RIGHT (vehicle -X). RIGHT-side target: she stays SEATED and looks SCREEN RIGHT to shout/blow kiss. LEFT-side target: she RISES and looks SCREEN LEFT to shout/blow kiss (not mirrored). VICTORY: both hands raised OVERHEAD. These five physical gestures must be demonstrated from actual rear game camera, and the tracking event must occur while overtaking alongside, not only after 5.5m final score clearance. Illustrative reference labels are subordinate to actual car coordinates.

**Fashion:** Ivory front-tied halter-neck mini dress with genuinely BARE BACK **NO diagonal back straps**, waist-side wrap knot, gold earrings/bracelet and strappy heels for the fullbody master. Correct R7A shoulder/arm skin seam, lower garment joining and eyelid pigment edges; preserve approved heroine face identity. **Frozen R6d gold hair, wild DEV wind, person 1.0, 8m chase camera** absolutely untouched. R7A v0.10.27 is a playable first 30,502-tri / 1.3 MiB bust, NOT final. Run Pixel 8 when possible; old hair spring FPS issue and Hunyuan3D license territory remain release gates. No male or vehicle art in this task. NT$0 extra services, no `main` promotion.

## HISTORICAL RECORD — ART DECISION — hair FROZEN to R6d (owner, 2026-11-14)

**The owner rejects R6f (Medusa) and R6g (controlled layered) and chooses the last visually acceptable R6d from v0.10.23. R6e was a proposed concept only, never a shipped or tested game hair version.** In dev v0.10.26+, the **default heroine model is `coast-blonde-r6d.glb` (3,559 tris, 25 bones / 18 spring joints)** and the **default dev wind is `wild`**. Keep both seated characters at **1.0** and the existing **8m chase camera**. All later R6f/R6g GLBs remain DEV-only comparison assets under `?hairStyle=r6f|r6g`; they are not approved or production candidates. The R6d game URL accepts `?hairWind=wild` explicitly. Do not continue experimenting with hairstyle, hair count, hair physics or scalp colours without a *new explicit owner request*. Preserve existing morph fallback/restart.

**Critical release caveat:** production wind remains its previous `baseline` (DEV-only presets, including WILD, do not auto-publish); R6 full-size/Spring hair previously caused a Pixel 8 FPS regression (22.87→18.05 in one sample), and later versions have not been re-profiled. **Art direction frozen ≠ mobile performance or public release acceptance.** Pixel 8 performance optimization/QA remains a later engineering gate. Never publish `main` without owner authorization.

**NEXT: [R7 — heroine + driver upper-body identity and in-game seating](docs/COAST_HERO_ASSET_R7_PLAN.md).** Prioritize real approved 3D faces/heads + torsos, shoulder and clothing consistency, proper male character asset, expressive left/right head-turn pivots, and alignment with R6d hair; then art-direct an improvement pass on the Riviera 62 player car. NO more over-optimizing the hair. Budget NT$0 added services; Codex quota last reported around 50%. First get actual front / 45° / side + rear chase screenshots and owner approval before trying major car remodeling.

## HISTORICAL RECORD — R7A dev candidate — v0.10.27

Owner authorized Issue #49 female upper-body integration on dev. The approved coloured Blender bust now supplies the face/neck/shoulders/halter/earrings; see `docs/art-review/r7a/README.md` for actual six-view comparisons, source hashes and remaining shoulder/cloth seam defects. R6d hair/wild, 1.0 occupants and chase camera stay frozen. DEV defaults to this candidate; `heroine=previous` restores the preceding passenger. Production still uses the preceding passenger pending art and mobile acceptance. Local verify:dev passed 118 files / 512 tests; no Pixel 8 FPS claim. STOP for owner + Julia art review. Do not begin male character, Riviera 62 redesign or another hair pass without new authorization.

## HISTORICAL RECORD — Coastal art production (November 14)

**R6f delivered experiment, dev v0.10.24:** 16 independently sprung locks / 64 active joints / 8,000 triangles, dev-only default; `hairStyle=r6d` restores unchanged R6d. See `docs/art-review/r6f/README.md` for actual comparisons and negative art assessment: motion is independent, but excessive dark inner-layer exposure makes the hairstyle sparse and is NOT an accepted visual improvement. One prototype completed; stop for owner + Julia review, no automatic additional modelling. Wild field, 1.0 people and chase camera unchanged. Production remains R6d; Pixel 8 not retested.

- Art direction: **Style Option B for vehicles, people, scenery and coastal sunset mood**. Read `docs/COAST_ART_BIBLE.md`, `docs/COAST_HERO_VEHICLE_ART.md` and `art/reference/coast/README.md`. The reference README lists the approved PNG and its checksum.
- Female protagonist: the owner-approved heroine 3-view sheet is **new canonical character identity** (see `docs/art-review/h1ar/README.md`, Issue #38); do NOT remodel this identity from the older Style B sample or treat old procedural H1a face as accepted. First produce real Blender-editable 3D mesh and owner-approved renders, not game integration.
- **Technique-first art gate:** before assigning Codex any new detailed asset family or recurring effect (hair, forest, grass, rocks, fields, ocean, crowds), Julia compares domain-appropriate techniques/tools, chooses the smallest credible method for Style Option B and Pixel 8, and defines ONE visual/efficiency experiment. Do not reflexively generate meshes/vertices in TypeScript or default to Blender for every problem. Record a short rationale, keep the accepted baseline, and avoid large implementation until a representative prototype earns owner approval. Minimize Codex quota; no paid services without an explicit budget decision (currently NT$0 extra). See `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md` for Julia/Codex's 7-question preflight, visual gates, and when to remind owner about costly decisions.
- The recurrent Riviera 62, driver/passenger, rivals and traffic are **S-tier focal assets**. Keep approved identity; audit before remodelling. This vehicle/character track runs early, in parallel with scenery.
- Make scenic content portable: asset library → `content/scenery/packages.json` → `content/stages/coast/scenic-layout.json`. Run `npm run scenic:build` to regenerate the existing runtime `scene.json` and hero positions in `direction.json`. Do not hard-code a site kilometre into an asset. See `docs/COAST_PORTABLE_SITES.md` for R0 limits.

## Engineering

- Optimize for the **smallest relevant context**. Prefer composition over inheritance; avoid speculative frameworks, deep abstractions, duplicate implementations and future-proofing without a concrete use.
- Separate engine capabilities (geometry, rendering, physics, effects, streaming), game rules (racing, traffic, controls), and stage content (authored geometry, placements, assets). A scene-content edit should not require a gameplay engine edit.
- Preserve the approved coastal gameplay, physics, water, visuals and Pixel 8 performance unless the task explicitly changes them.
- Stages are **finite**. Keep road safety, bounded asset lifetime, shared resources and chunked loading. Never drive into missing road. Details: [ADR-009](docs/ADR_009_BOUNDED_STAGES_SCENE_PIPELINE.md).
- **Data format debt:** JSON is provisional. Dense stage assets need measured transfer/parse/memory costs and range-queryable tool access; readability is not the goal. See [ADR-010](docs/ADR_010_STAGE_DATA_FORMATS.md).
- Before adding an effect, check existing reusable capabilities. Do not keep old code because it *might* be needed later. First remove dependencies, then delete obsolete code; Git history preserves it.

## Workflow / release

- Work on `dev` by default. Only promote to `main` on **explicit owner approval**; never force-push or move released tags. Ordinary `dev` pushes must not deploy.
- Development snapshots increment the patch version in `package.json` and lockfile (`0.9.44`, `0.9.45`, etc.), with no `-dev.N` suffix and **no development tag**. Untagged `dev` version numbers are not public releases. Public releases still require owner approval, a new `main` commit and an immutable annotated `vX.Y.Z` tag for the deployed commit. The owner accepted R4 architecture on 2026-11-12; `dev` now uses untagged `0.10.0` (not a public release). Never reuse a previously tagged version.
- **P0 / Blocker:** cannot load, start, or meaningfully play; blocks release.
- **P1 / Critical:** significant gameplay loss, serious crash or broken recovery; **tell the owner**, who decides whether to publish. P2/P3 cosmetic or tuning defects do not block.
- Keep release CI lean: dependency install, production build, deterministic P0 checks; P1 checks are advisory. Visual feel, controller behavior and device FPS are primarily owner playtests. Do not turn slow/flaky Playwright screenshots into deployment gates.
- Run only relevant verification for the task and state clearly what was not run. See [tests guidance](tests/AGENTS.md) for tests-only work.

- Retired chapter handoff is removed from `main.ts`. Never restore it for future scene changes; extend authored stages only when an actual multi-region experience is specified.

> **R3–R5 implementation history:** retain safety invariants, but dated “next” tasks, environment claims, versions and coordinates do not override current authority/source data.

## R3 closure
- Only `content/stages/coast` is a playable stage. Removed Brick/L2/Pilot/Stage01/Trip generators and their old reviews and Journey-mode tests: do not restore dead pipelines.
- Authored C02/E02 math is in `src/content/road-shapes.ts`; the game and Worker share `coast-worker-road.ts`. Review the small active flow in `docs/CURRENT_ARCHITECTURE.md` before adding new road logic.


- R4a/R4b/R4c stage effect settings live in `content/stages/coast/effects.json`
  and are validated by `src/content/coast-effects.ts`; do not recreate
  hard-coded ocean/vegetation/flower/sunset/shadow/wind defaults in their producer modules.
- When working with local Codex, run `npm run verify:dev` (build + all
  retained unit tests) **before** pushing to GitHub. GitHub release
  validation remains a separate authority for `main`; physical play
  is still owner acceptance.

- CI cost policy: `dev` pushes and draft PR synchronizations never
  trigger automatic builds. For local Codex first run `npm run verify:dev`
  before pushing; optionally dispatch `Dev checks (manual)` from Actions.
  Main-push release validation remains automatic.

## R4c shared environmental wind

- `content/stages/coast/effects.json.wind` is the directional world-XZ air
  velocity. `src/coast-wind.ts` owns the accepted RG8 gust pattern and its
  CPU sampler. No per-particle gust sampling or ad hoc wind randomisers.
- Airborne effects receive an optional wind callback; do not tie weather to
  steering, collisions or the graphics engine. Keep skid marks anchored.
- `ocean.windSpeed` is a wave-spectrum excitation setting, **not**
  physical wind speed in metres per second. Do not conflate the two.
- Light/shadow overlaps and inactive legacy fallback paths are documented
  in `docs/R4_LIGHT_SHADOW_WIND_AUDIT.md`; remove only with targeted
  tests and visual/FPS acceptance.

## R4d: readability and acceptance

- `heroWaves.{rice,flowers}` in coast effect data are *visual* wave
  parameters. The `travelSpeedMps` phase velocity is **not** the air
  velocity sampled by particles and must not change car physics.
- Keep sea Tessendorf FFT exclusively in Ultra Water. Field waves are
  wind-aligned shader bands using the existing gust field and shader
  time: no new FFT render targets, texture uploads or worker.
- Rivals' starting smoke is intentionally sparser and deterministically
  distinct per car. Preserve the same bounded particle geometry and
  independent skid marks.
- R4 architecture is owner-accepted on 2026-11-12. The known R4c signed-zero
  assertion was corrected in `0.10.0`; rerun the full local tests before
  considering any public release. No automatic `main` promotion.

## R4e finishing pass / next material capabilities

- `TireEffects` keeps one bounded instanced shader/material family and
  deterministic smoke palettes/curls per rival. All plumes share the same
  real sea breeze, but local turbulence and shading may differ. Do not
  change drift physics or create one independent GPU program per car.
- The next engine/material work is **not** a prerequisite to `v0.10.0`.
  See `docs/NEXT_SURFACE_CONTACT.md`: surface identity (per wheel),
  obstacle geometry, impact response, sound, particles, and road relief
  must meet via small explicit inputs, without a generic entity system.
 
## Historical R5 work order — authored map remake

- Prioritize road driving feel: bold sustained sweeps, truly distinct S-bends,
  larger deliberate banking and height transitions, and readable recovery
  straights. Build and drive the road whitebox before placing hero scenery.
- See `docs/MAP_REMAKE_KICKOFF.md` for the first authoring/acceptance slice.
  Do not revive the procedural Scenic Director or historical second-stage data.
- Mountain and foreground geometry need consistent spatial depth. Avoid
  using a near-visible midground as an infinitely distant fake backdrop;
  inspect motion parallax at speed as well as screenshots. Current old coast
  mountain implementation is not a required map-remake target.

## R5 first-map onboarding and art workflow

- The first coast remake is a **progressive driving introduction**, not
  a maximal-intensity corner demo. Lesson sequence: straight acceleration,
  non-drift sweeper, first civilian traffic, banked S-curve, first avoidable
  multi-car accident, two progressively harder drift corners. Afterward
  alternate hero scenery with racing challenges and finish sprint.
- Eight race rivals remain from the start; control *civilian* traffic
  and staged hazard unlock zones independently, with reproducible seeds.
  Do not spawn unavoidable accidents or completely block the tutorial.
- Read `docs/R5_FIRST_MAP_DIRECTOR.md` before road/traffic changes and
  `docs/R5_ART_PIPELINE.md` before Blender asset workflow changes.
  For new geometry, author one road-space truth shared by Worker, player,
  AI, renderer and collision. Validate at speed and on Pixel 8.
- Blender is an **offline production tool**, not a second gameplay engine.
  Prefer Geometry Nodes, light meshes, LOD and glTF for gameplay scenes.
  Blender 5.3 Gaussian Splat import is an optional static-scene
  reference/POC, not required mobile runtime art or renderer migration.

## R5a.1 (first playable slice, v0.10.2 on dev)

- The first three old road turns have been replaced with A0/A1/A2/A3
  onboarding beats, a dramatic banked first sweeper, and two
  authored S-curve bank envelopes in
  `content/stages/coast/road.json`. The rest of the coastline is
  still the old playable placeholder.
- `content/stages/coast/onboarding.json` is the single source for
  teaching windows, the first civilian encounter, the traffic gap
  around the S, and the earliest possible random breakdown.
- The eight racing rivals still launch together. R5a disables the
  separate 300m *civilian* entry feeder, preserving a clear first
  lesson. R5b must implement actual crash-tableau events.
- `?r5qa=1` is development-only and overlays exact lesson IDs and
  HUD metres. `?at=1400&r5qa=1` targets A1; `?at=3050&r5qa=1`
  targets A3. Use `?trafficSeed=42` for deterministic encounters.
- No Blender terrain or Geometry Nodes art is in this first
  whitebox. Verify the road and steering first, then run a single
  Geometry Nodes asset experiment for scenery before scaling production.

## R5a art-guide bridge

- `npm run r5:road-guide` exports the game/Worker's exact road
  sampler into an ignored local JSON guide.
- `scripts/blender/r5_guides.py` loads the guide as Blender curves
  and creates a **preview** Geometry Nodes scatter. It does not
  own road physics, collision, terrain material decisions, or a
  shipping GLB. Blender execution/inspection remains a local Codex
  responsibility until a Blender runtime is available.

## R5a.1: source-of-truth and light-index limitations

- Only the first civilian encounter is curated for teaching. Past the
  opening S, encounters remain **seeded random** with differing vehicles,
  gaps and behavior. Don't turn the rest of the road race into a script.
- Preserve a forgiving high-speed first sweep; use a large, readable
  bank instead of surprising the player with drift-only curvature.
- Tests asserting fixed old sunset viewpoints are obsolete after
  the road remake, but seam/geometry/collision safety is not.
- Legacy `coastLampAtlas` indexes nearest lamps in world Z only;
  curved road segments can overlap lighting volumes. A proper
  2D/road-space lookup belongs to new-map scenic/night-lighting QA.

## R5a.2 / R5b drift whitebox — dev v0.10.3

- R5a lesson windows: A0 350–900m acceleration; A1 900–1900m
  big banked sweep; A2 1900–2700m first sparse civilian; A3
  2700–4340m continuous S. Left curve END = right curve START
  at 3520m, no 140m artificial straight. Its authored C02
  `rampFraction=.08` shortens only the S's transition; other
  bends retain the original 0.2 C02 default.
- R5b drift whitebox: A5 5100–5640m demand +.82, A6
  6280–6760m demand -1.02. Keep a long clear recovery between
  them, with the second requiring greater driving precision.
  Developer-only `?r5qa=1` can preview both lessons; the first
  road-side accident (A4) is still a future physical hazard task.
- Only the first civilian introduction is curated, at/after
  2200m. General highway traffic resumes seeded randomness
  at/after 7120m, following the second drift; random breakdowns
  are excluded until/after 7560m. Do not hard-code ordinary
  traffic encounters beyond the teaching corridor.
- Geometry and collider share the authored road and Worker
  sampler. Drift curves should never collide with a nonlocal
  part of their road, create an unstreamable chunk or make
  the player face a sudden scenery obstacle.
- These are code/data commits, not a claim of local Vite,
  Vitest, browser or Pixel 8 verification. Use
  `npm run verify:dev` before accepting R5b.

## R5b.1 A4 incident rules

- The new A4 is a **moderate curving-road** obstruction,
  not just two cars on a straight. It uses the same world
  sample as the driver, the Traffic pool and rival obstacle AI.
- `coastAccidentLayout()` places 2–3 real stationary vehicle
  actors with seeded positions and yaw, leaving at least
  TWO full lanes physically passable. Preserve these safety
  guarantees when changing seed variants.
- `stopYaw` must agree across traffic body matrices,
  shadow pose, swept collision and AI projected bounds.
- One three-triangle warning approach is enough; don't
  duplicate warnings for each incident actor.
- A5/A6 drift roads have passed owner play acceptance;
  DO NOT move or retune them while polishing this scene.

## CI and Codex local verification

This GitHub-only editing environment cannot run the owner's Windows
local Vite/Vitest/Playwright or Pixel 8 tests. For code changes, local
Codex should check out latest `dev`, run `npm run verify:dev`,
fix **all** failing tests in the same task, then push the corrected
commit. GitHub `dev` push must not trigger expensive CI.
Never mark a source-only static audit as passing Vitest.

## R5b.2 player-feedback constraints

- The first A4 accident is a forgiving RIGHT OUTSIDE lane teaching
  event with two angled cars; normal seeded highway traffic and
  later random-lane incident capability remain intact.
- Movable wreck impulses live only in `RaceTrafficWorld`, which
  owns all traffic and race obstacle state. Don't move rendering
  instances independently or run an additional rigid-body engine.
- Warning reflector collisions are processed from player sweeps
  and rival/civilian sweeps against the same one-shot pool.
  Off-camera contacts remain authoritative.
- Gamepad: first fresh confirm MUST act on the first press;
  held button across screen transition MUST NOT confirm twice.
  Include menu first-press and first driving-frame regression tests.
- Repo-only commits still need local `npm run verify:dev`
  performed by Codex before calling the work technically verified.

## R5b.3 — warning signs / stage exit bug regressions

- R5b.4 supersedes the R5b.3 sign decision. RivalRace plans around
  traffic and displaced wrecks. Player, rival and civilian sweeps can
  knock warning signs through the shared RoadCones pool at race speed.
- Each small prop takes one impulse per race. After the throw, its
  displaced pose persists through streaming and checkpoint recovery.
  Reflectors settle face-down or face-up on the banked, pitched surface.
- Exiting through pause `回到主選單` must hide the full-screen
  `#game-loading` overlay before re-mounting the stage selector,
  or the stage select is present but covered by the old loading art.
- Run `npm run verify:dev` and exercise these cases with local
  Codex and one real PS4/PC gamepad before shipping main.

## Sunset sprint implementation record — v0.10.13 (not current package version)

- The first 4.0km of racing teach the seven lessons (stations 350–4350m).
  The slow bus already moves during the opening sweeper. Test catching it on
  the exit before the S. All coastal incidents share one approach per group.
  The race covers 14,200m from HUD 350m to 14,550m with 600m of relief.
  The first sweep is level. Keep the seaward shoulder low at the visitor beach and sunset seawall.
  Current geometry and lesson windows supersede the historical R5a/R5b coordinates.
- Road turns/elevations/banks are authored in
  `content/stages/coast/road.json`; ten named acts, nine hero
  slots and three overtake-pressure gates are authored in
  `content/stages/coast/direction.json`. No general Scenic
  Manager, random road re-generation or rank-dependent speed boost.
- Sea-side safety **always** has visible low guardrail/linked beach
  bollards and matching physical boundary/contact materials.
- Offline coast shore map now uses an exact 2D segment AABB index,
  instead of an extremely costly Z-only full scan. Never change
  the wet-sand/FFT appearance simply because the road grew longer.
- Legacy far mountains are bounded to the old coast footprint;
  physically plausible Hero Scenery must be created later in
  Blender/Geometry Nodes using the shared road-guide export.
- Road whitebox acceptance is separate from Hero art acceptance.
  The 30km R5c brief is historical. Test the current hero slots and contest gates
  at driving speeds, and run `npm run verify:dev` on the local
  Codex workstation before marking R5c QA green. Never auto-push
  to `main`.

## R5d — coastal scenery art direction / production (2026-11-14)

- **Owner-selected aesthetic is canonical:** read [Coastal Art Bible](docs/COAST_ART_BIBLE.md) before any new scene, character, vehicle, house, boat or prop art. Use the Style Option B board for its slightly chunkier forms, simplified materials and warm coastal sunset. These are *art references*, not GLB assets and not authorization to redesign Riviera 62.
- **Scenery production work order:** [Coastal Scenery Production Plan](docs/COAST_SCENERY_PRODUCTION_PLAN.md) defines art/engineering ownership, phased gates, pilot anchors, visual/safety/performance acceptance and Codex usage protection. Start with approved pilots, not full-route prop scatter or speculative engines.
- The active authored coast is **14,200m from HUD 350 to 14,550**, with ten chapter offsets, nine absolute-HUD hero slots and three pressure gates in `content/stages/coast/direction.json`. Historical 30km R5c documents are not a current road plan. Before touching Blender exports, use the current shared road guide and check existing visual masks; preserve road/Worker/AI/collision single source, visible seaward protection, and Pixel 8 budgets.

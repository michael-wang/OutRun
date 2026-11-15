# P0 pilot — final branch review package

Current task: **final documentation/status handoff only**; implementation and independent technical stage reviews are complete. Observed 2026-11-15 UTC / 2026-11-16 Taiwan time (project decision dates use Taiwan time). Builder: Codex; coordinator: Dot; independent review: Julia/Dot; final acceptance: Michael + Julia. **Overall PARTIAL because P0-1 live synchronization is unfulfilled; P0-2/3/4 independently accepted only within technical scope.**

## Final status, identity and independent acceptance

Branch `p0/dot-pipeline-pilot`; starting dev SHA **`e81272a0e3295c942ece8b3d305bc49b0337fbe0`**. Last implementation SHA `93f05edeba1ff0b8645a34fdf221cb57a443ca26`. Final report commit identity must be obtained with `git rev-parse HEAD` and, once created, the Draft PR head SHA; this file deliberately does not try to embed its own commit SHA. Exact full diff: `git diff e81272a0e3295c942ece8b3d305bc49b0337fbe0 HEAD`. **Draft PR not created; branch not pushed.** Stop for Julia's final diff review before that authorized handoff.

| Stage | Final technical status | Remaining boundary |
| --- | --- | --- |
| P0-1 | **PARTIAL** | Authority correction accepted, 14 Issues/PR31 inventoried; Issue synchronization denied and later explicitly prohibited. No writes succeeded. |
| P0-2 | **PASS (technical only)** | Hash/reference and L3 record checks; no authenticated approvals, legal/native-source/art/device proof. Windows symlink-test privileges untested. |
| P0-3 | **PASS (technical scope only)** | Same-machine five-file byte restore; no editable-master recovery, independent backup, LFS hydration or live deployment test. |
| P0-4 | **PASS (technical scope only)** | Final independent code/diff review and 14+36 tests passed after exactly two corrections. No actual P1 abilities or human approval authentication. |

**Final independent review:** Julia inspected correction 2 and actual code, confirmed failed/missing/incompatible receipt outcomes reject, reviewed second-pass advancement vs third-correction refusal and >2 violation, then reran **14 task tests, all 36 asset tests and `git diff --check`**, all passed. She accepted P0-4 technical scope only. Correction 1 fixed a real receipt bug but Julia's own over-restrictive instruction contributed to conflating correction dispatch with advancement; correction 2 repaired that distinction. Both actual findings, changes and red/green test evidence remain below. No third correction is permitted.

**Issue mutation history:** #6 initial body update and one evidence-supported retry were denied; each read-back was unchanged. Other 13 writes never attempted; all 14 re-read unchanged. Exact automatic-review errors are retained below. Michael then explicitly prohibited live Issue edits because they take effect outside the Draft PR; this instruction is active, not a request to seek another approval or bypass. Keep branch-local recommendations for full Draft PR review.

### Final local verification

- `npm run assets:check`: **exit 0**, with explicit source/license/device gaps and metadata-only disclaimer.
- `npm run assets:test`: **exit 0, 36 passed, 0 failed/skipped**; intentional invalid promotion CLI **exit 1** (`traceable editable source file required`).
- `node --test scripts/test-task-contract.mjs`: **exit 0, 14 passed, 0 failed/skipped**, including all 40 incompatible receipt-result cases and separate correction/advancement checks.
- `git diff --check e81272a0e3295c942ece8b3d305bc49b0337fbe0`: **exit 0**, no output. Final Python scope/link check: `PASS: 23-file full inventory; 6 Markdown-only final edits; 99 local links; runtime/assets/content/config/lock unchanged; package only 2 opt-in commands; exact denial quotations retained; 4 Node syntax checks`. The four syntax commands were `node --check` on `scripts/check-task-contract.mjs`, `scripts/test-task-contract.mjs`, `scripts/validate-asset-manifest.mjs`, and `scripts/test-asset-manifest.mjs`, all exit 0.
- npm retained the environment warning `Unknown env config "http-proxy"`; suites still pass. No tests were silently waived.

No full game build/verify:dev was run: opt-in built-in-only tooling is not imported by runtime/build/CI; no dependency, gameplay, assets, shader, deployment config or version changed. P1/P2 work, visual/device/owner acceptance, native-master recovery, independent source-backup verification and live deployment tests remain **unperformed**. No paid service/inference API, purchase or billing change; Codex/agent token usage and total cost are unavailable, not asserted zero. Further review of sources/licenses, Windows tooling, actual device gates and storage decisions needs separately bounded work, not inference from green metadata tests.

### Complete changed-file inventory (23 paths versus starting dev)

- `AGENTS.md`
- `README.md`
- `asset-pipeline/pilot.json`
- `asset-pipeline/riviera62-task.example.json`
- `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md`
- `docs/ASSET_MANIFEST_PILOT.md`
- `docs/ASSET_STORAGE_AND_RETENTION.md`
- `docs/COAST_HEROINE_FINAL_PRODUCTION.md`
- `docs/COAST_HERO_ASSET_R7_PLAN.md`
- `docs/COAST_SCENERY_PRODUCTION_PLAN.md`
- `docs/CURRENT_ARCHITECTURE.md`
- `docs/DOT_P0_PILOT_BRIEF.md`
- `docs/DOT_P0_PILOT_REPORT.md`
- `docs/P0_3_STORAGE_TRIAL.json`
- `docs/PRODUCTION_PIPELINE_TRACKER.md`
- `docs/R5C_30KM_ROAD_DIRECTOR.md`
- `docs/TASK_CONTRACTS.md`
- `package.json`
- `scripts/check-task-contract.mjs`
- `scripts/test-asset-manifest.mjs`
- `scripts/test-task-contract.mjs`
- `scripts/trial-asset-backup.py`
- `scripts/validate-asset-manifest.mjs`

Only docs, two JSON contracts plus trial-result JSON, isolated tooling/tests and two opt-in npm script entries changed. `package.json` version remains 0.10.30; dependencies/lockfile and existing commands unchanged. Existing historical documents/evidence remain; no binary migration/deletion.

The remaining sections preserve stage-by-stage history. Their past tense/status/stop instructions are historical evidence, superseded for current dispatch by this final summary and the top authority pointers.

## P0-4 historical checkpoint — bounded task-contract tooling

Start `749f35ac8bc8d7f110c7566dbcb9fedbcee4436d`, same pilot branch, clean worktree. `git ls-remote --heads origin dev` returned unchanged `e81272a0e3295c942ece8b3d305bc49b0337fbe0`; Brief/current instructions re-read, no conflicts. No checkout `.agents/skills` or scripts-specific AGENTS exists.

**Independent P0-3 review received:** Julia inspected actual storage inventory, deployment analysis, full restore script and diff; reran five-file trial against `30d2fea` (PASS/status unchanged) and `git diff --check`. She reports an additional reviewer repeated trial/refusal tests and inspected Netlify/Pages workflows with no blocking defect. Accepted technical scope only: same-machine byte restore, not native-master recovery, independent backup, LFS hydration or live deployment. No migration or deletion approved. No invented correction findings.

Deliverables: [small task templates and limitations](TASK_CONTRACTS.md), [explicit example-only SPIKE contract](../asset-pipeline/riviera62-task.example.json), [record checker](../scripts/check-task-contract.mjs), [targeted tests](../scripts/test-task-contract.mjs). Six missing P1 prerequisites and four pending approvals each block production; example-only/non-PRODUCTION, unresolved review at two correction passes, or a greater-than-two pilot violation also block production. A separate correction-dispatch check always prohibits a third correction. Verified/accepted assertions require hash-checked, task/candidate/check-bound receipts with reviewer/observations and successful result (requirement `pass`, approval `accepted`). No command execution, production build, legacy enforcement, package change or build/CI integration.

This is record validation, not authentication or semantic proof of source editability, licensing, pivot/material quality or device performance. Synthetic complete test receipts are not real P1 approvals. Clearing records never grants execution, merge or release authorization. Windows execution remains untested.

### P0-4 correction pass 2 — historical handoff, subsequently accepted

Start `61721d076b2d4cf9811ce8f1ac8a860f8cedcf8b`. Julia independently accepted the receipt-result fix and reran 11 tests, but rejected the permanent production block at two corrections even after successful independent acceptance. The prior correction conflated **no third correction** with **no advancement after a successful second correction**. This real semantic defect is corrected, not waived. The pass-1 record below describes the historical implementation and is superseded by this section.

Mechanical separation: `checkCorrectionDispatch` / CLI `--correction` prohibits dispatch at two completed corrections regardless of resolution or review. `checkContract` / `--production` allows exactly two to advance only when `rootCauseResolved` is true, `independentReview` is `accepted`, and all normal production capability/approval receipts pass. At two, false resolution or pending/rejected review blocks pending review/method decision. Above two is a violation in both checks regardless of state. At 0/1, correction dispatch need not have verified production prerequisites, but contract/receipt integrity is still checked. Example-only contracts cannot be dispatched. No field authenticates an actual review, grants authorization, or permits resetting counters; human independent review remains mandatory.

- `node --test scripts/test-task-contract.mjs`: **exit 0; 14 passed, 0 failed, 0 skipped**. Includes exactly-two resolved/unresolved across pending/rejected/accepted review, third-pass violations for both resolution values, separate correction dispatch with unknown production capabilities, and real CLI refusal of a third correction after accepted review. All 40 invalid receipt-result cases remain covered.
- `node --check scripts/check-task-contract.mjs`: **exit 0**; `git diff --check`: **exit 0**. `node --check scripts/test-task-contract.mjs` also exited **0**. Final Python scope/link/CLI check: `PASS: exact 6-file scope; 41 local links; example production exit 1 / 12 blockers; asset tooling unchanged`. Only checker/tests, example JSON, contracts, Tracker and report changed.
- Editing helper emitted Python `SyntaxWarning: invalid escape sequence '\/'` for the JS test regexp string; generated JS parsed and all tests passed. No functional test failure or warning was hidden.

The earlier asset tooling is unchanged and not imported; no asset tests/build rerun needed for this isolated contract correction. This is correction pass **2 of 2**, final: stop for independent review, no push or further correction work. P0-4 remains PARTIAL; no P1/P2/Issue work.

### P0-4 correction pass 1 — real independent defects

Julia read actual gate/contract/fixture and reran the original 10 tests and example (exit 1 / 12 blockers). Additional adversarial review showed that all ten hashed receipts could explicitly say `result: "failed"` while their parent entries claimed readiness; the checker ignored the contradiction. This is a genuine record-integrity bug, not covered by the authenticity disclaimer. She also identified that `rootCauseResolved` bypassed the Brief's absolute maximum two supervisor correction passes per subtask. Both findings are accepted and corrected, not waived.

Requirement receipts now require exact `result: "pass"`; approval receipts require exact `result: "accepted"`. Tests independently mutate all ten receipts to failed, missing, pending and cross-category outcomes, rehashing them to prove hash validity cannot conceal the contradiction (40 cases). The schema documentation defines `correctionPasses` as completed supervisor correction passes for this subtask; counts >=2 block further dispatch for either root-cause flag value. Counts 0/1 remain eligible when other records are complete. This does not prevent independent acceptance of the second correction, nor install a future generalized policy.

Before fixing the gate, `node --test scripts/test-task-contract.mjs` returned **exit 1, 9 pass / 2 fail**: failed receipt incorrectly accepted and pilot limit regression. A focused `node --test --test-name-pattern='pilot maximum' scripts/test-task-contract.mjs` then tested resolved=true first and returned **exit 1**, showing the old checker returned no blocker at two passes. These expected red tests are preserved as defect evidence. After repair:

- `node --test scripts/test-task-contract.mjs`: **exit 0; 11 pass, 0 fail, 0 skipped** (includes 40 contradictory-outcome cases).
- `node --check scripts/check-task-contract.mjs` and `node --check scripts/test-task-contract.mjs`: **exit 0** each.
- `node scripts/check-task-contract.mjs asset-pipeline/riviera62-task.example.json --production`: **exit 1 / exactly 12 blockers**, verified by subprocess and CLI tests.
- `git diff --check`: **exit 0**. Python scope/link check: `PASS: exact 6-file correction scope; 41 local links; production CLI exit 1 / 12 blockers; asset validator/tests unchanged`.

Changed only the contract checker/tests, example stop text, task-contract documentation, Tracker and this report. P0-2 asset validator, tests and manifest are unaffected and share no imports with this checker, so earlier asset tests were not rerun. No full build/verify:dev warranted for this isolated record-check change; no runtime/build dependencies changed. This is supervisor correction pass **1 of at most 2**; stop for Julia re-review, no further work or push.

### P0-4 commands/results

- `node --test scripts/test-task-contract.mjs`: initial run **10 passed, 0 failed/skipped**, including CLI exit 0/1 checks, synthetic positive, every unknown/failed prerequisite and pending/rejected approval, two-pass stop, missing/changed/wrong-subject receipts and malformed contracts. Final rerun after relative path-escape coverage: **10 passed, 0 failed, 0 skipped; exit 0**.
- `node scripts/check-task-contract.mjs asset-pipeline/riviera62-task.example.json`: **exit 0**, valid records with `PRODUCTION BLOCKED` and 12 reasons (example/type, six unknown capabilities, four pending approvals).
- `node scripts/check-task-contract.mjs asset-pipeline/riviera62-task.example.json --production`: direct subprocess verification returned **exit 1 with exactly 12 blockers**, also asserted by CLI tests. No P1 execution.
- `node --check scripts/check-task-contract.mjs` and `node --check scripts/test-task-contract.mjs`: **exit 0**.

- `git diff --check`: **exit 0**, no output. Python scope/link check: `PASS: exact 10-file scope; 81 local links; package/runtime/assets/content/config unchanged`. Changed files: `AGENTS.md`, `README.md`, Brief, Tracker, this report, `docs/ASSET_STORAGE_AND_RETENTION.md`, `docs/TASK_CONTRACTS.md`, `asset-pipeline/riviera62-task.example.json`, `scripts/check-task-contract.mjs`, `scripts/test-task-contract.mjs`.

Full build/verify:dev is not warranted: only opt-in Node-built-in tools/tests and docs/JSON, no runtime imports/build/dependency/package changes. Focused tests execute the actual CLI and integrity checks. No functional test failure waived. P0-4 remains PARTIAL awaiting independent review. P0-1 remains PARTIAL with no Issue edits/retries; prior denial evidence is retained below.

## P0-3 historical checkpoint — subsequently accepted technical scope

Starting branch checkpoint: `30d2fea0693f86c20cbb023825cbdd9b2a6f2176`; clean worktree and no conflicts. Latest dev rechecked unchanged at `e81272a0e3295c942ece8b3d305bc49b0337fbe0`; Brief and deploy/ignore configurations read. No `.agents/skills` in the checkout. Source inventory uses the Git tree rather than sparse file visibility. Art/masters, runtime, deployment configs and public Issues remain untouched.

Deliverables: [inventory, source/backups recommendation, deployment impact and approval-driven retention](ASSET_STORAGE_AND_RETENTION.md), [machine-readable trial result](P0_3_STORAGE_TRIAL.json), [reproducible local trial](../scripts/trial-asset-backup.py). Snapshot has 1,033 paths, 17 GLBs, 333 PNG/JPGs, 18 videos and three runtime audio files. No tracked Blender/common layered-image/DAW project extensions; no tracked LFS config. Windows master references are documented/inaccessible, not backed-up by assertion. R7T’s documented overwritten early snapshot is retained as a loss caveat. Whole-history sizes, owner-disk inventory and source license/backup completeness are unknown.

**Independent P0-2 review received:** Julia read actual manifest, validator, tests, package diff and docs; reran `assets:check`, `assets:test` (36 pass; expected invalid CLI exit 1) and `git diff --check`. She reports a separate adversarial review of malformed, false-L3, missing-source and path cases with no blocking defect. Accepted **technical PASS only**. No correction requested for appearance; no invented review findings. Records cannot authenticate reviewers, prove native editability/license rights or establish visual/device acceptance. Windows was not tested; symlink-test privilege portability remains a caveat.

### P0-3 exact commands/results

- `git ls-remote --heads origin dev`: `e81272a0e3295c942ece8b3d305bc49b0337fbe0 refs/heads/dev`.
- `git ls-tree -r --name-only 30d2fea0693f86c20cbb023825cbdd9b2a6f2176`: 1,033 paths; extension counts reproduced by the trial JSON. `git ls-files --others --exclude-standard` and `git ls-files --others --ignored --exclude-standard` were empty before P0-3 changes (this Linux clone only).
- `git check-ignore -v art-prototype/output/example.blend captures/example.png .cache/watercraft/example.zip docs/evidence/example.png`: matched `.gitignore` lines 38, 29, 50, 35 respectively. This does not prove owner-local files exist.
- `python --version`: **Python 3.12.14**.
- `python scripts/trial-asset-backup.py --ref 30d2fea0693f86c20cbb023825cbdd9b2a6f2176`: **exit 0**, five allowlisted committed files (2,376,952 bytes), ZIP/restore hashes match; repository status unchanged. Final archive `/tmp/outrun-p0-3-restore-jf7l2d97/sample.zip`, SHA-256 `60ded6a6d267251fdb5f4983b96dc501f181283318a231cbfae2a1122fc83ab5`; [full result](P0_3_STORAGE_TRIAL.json). Outputs retained, no deletion.
- Intentional negative with `--output /tmp/outrun-p0-3-restore-7u1y8nyv` on the earlier trial: **exit 1 / FileExistsError**; existing archive hash unchanged. Refusal works without overwriting evidence. Final-script negatives also passed as recorded below.
- Final focused Python heredoc check used `ast.parse` on the script, SHA-256 comparisons of all five originals/restores and archive, `git ls-tree` snapshot count, exact nine-path diff/untracked allowlist and Markdown local-link resolution. **Exit 0**: `PASS: Python syntax; 5 original/restored hashes + archive; 1033-path snapshot; exact 9-file scope; 71 local links; negative checks preserve status/archive`.
- Final negative commands: `python scripts/trial-asset-backup.py --ref 30d2fea0693f86c20cbb023825cbdd9b2a6f2176 --output /tmp/outrun-p0-3-restore-jf7l2d97` returned **1 / FileExistsError**; the same command with `--output /workspace/scratch/09cfb53f0c02/OutRun` returned **1 / output must be outside repository**. Captured subprocess checks confirmed both expected failures, unchanged archive hash and identical Git status. No overwrite/deletion occurred.
- `git diff --check`: **exit 0**, no output. P0-3 changes exactly nine files: `AGENTS.md`, `README.md`, `docs/ASSET_MANIFEST_PILOT.md`, Brief, Tracker, this report, `docs/ASSET_STORAGE_AND_RETENTION.md`, `docs/P0_3_STORAGE_TRIAL.json`, `scripts/trial-asset-backup.py`. Package, runtime, assets, content, workflows, Vite/Netlify config and ignore rules are unchanged from P0-2.
- Evaluated the exact `netlify.toml` ignore command via `sh -c` with four explicit CONTEXT/BRANCH combinations: production/main exit **1** (build); deploy-preview/main, production/dev and branch-deploy/dev exit **0** (skip). No build or deployment triggered.

Provider docs verified read-only: Vite public-copy behavior; checkout v4 LFS download default=false; GitHub Pages’ direct LFS limitation; Netlify LFS environment requirements and deprecated Large Media; GitHub mirror/LFS backup caveats. Links and concrete repository consequences are in the storage report. Account quotas/billing, Netlify UI variables, live deploys, a hydrated LFS build and Windows native restores remain unverified. No external storage or paid tool used.

Failure record: initial direct `.gitignore` read failed because sparse checkout omitted it, resolved by materializing existing config. Initial restore trial failed on omitted `asset-pipeline/pilot.json` before output creation; existing committed metadata was materialized and trial passed. Final temp-directory guard was added to reject repository-local temporary roots before creating output; trial reran successfully. No functional failure waived.

No full build/verify:dev warranted: only docs, a standalone Python local-trial script and its small JSON result were added/updated; no runtime or deployment integration changed. No source migration, history rewrite, LFS setup, asset edits, mass upload, deletion, paid calls or public Issue writes. **Local restore trial PASS is not disaster-recovery or editable-master PASS.** Historical handoff was PARTIAL pending review; Julia subsequently accepted technical scope and delegated P0-4, as recorded above.

## P0-2 checkpoint — PRODUCTION/tooling, subsequently accepted technically

Julia explicitly delegated P0-2 as safe independent work while P0-1 live synchronization remains blocked. **Michael subsequently instructed no changes to any of the 14 public Issues now, no retries or bypass, and review of branch-local recommendations after the full P0 Draft PR.** P0-1 stays PARTIAL/unsynchronized; actual rejection evidence remains below. This supersedes the earlier suggested approval/retry follow-up. **No issue retry or write was made in this stage.** Starting branch checkpoint: `e3ca36090634e75bacf3aa91d79eec41aeb30d82`. Re-read the current Brief and remote dev before work: `git ls-remote --heads origin dev` returned unchanged `e81272a0e3295c942ece8b3d305bc49b0337fbe0`; worktree was clean, no conflicts. Repository `.agents/skills` is absent; root AGENTS and relevant content/tests instructions were read. Same independent branch, no push. Ending SHA is supplied in the handoff and available with `git rev-parse HEAD`.

Deliverables: [contract and limitations](ASSET_MANIFEST_PILOT.md), [one real pilot record](../asset-pipeline/pilot.json), [validator](../scripts/validate-asset-manifest.mjs), [behavior/CLI tests](../scripts/test-asset-manifest.mjs). `package.json` adds only `assets:check` and `assets:test`; version stays **0.10.30**, dependencies/lockfile and existing build/verify scripts unchanged.

The R6d fixture is **pilot / L1**, with the existing GLB bytes/hash verified. Source `.blend` exists only as a reported C: location; file/hash are deliberately null. Source licensing, repeated export and current Pixel 8 evidence are not verified. Technical/visual/device/repeatability pipeline acceptance is pending, with explicit notes preserving historical art decisions. No fake source or owner acceptance was created.

Production declarations require a hash-verified editable-source reference, author/tool, provenance and license record; exports/runtime bytes must match. L3 additionally requires no blockers and hash-bound technical, visual, device and repeatability review receipts for the exact asset/source/export. Naked pass assertions, mismatched receipt subjects, missing abilities/device measurements and single-run repeatability claims fail. A green validator checks **record integrity**, not the truth/authenticity of human assertions, license permission, visual quality or actual device behavior. Synthetic positive L3 tests are not real asset approvals. Independent inspection remains necessary; no receipt-signing or broad task-gate framework was added.

### P0-2 commands and evidence

- `node --version`: **v24.22.1**; `npm --version`: **11.9.0**.
- `sha256sum public/assets/characters/coast-blonde-r6d.glb docs/art-review/r6d/README.md`: GLB `8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519`; report `c78b0cda2c9610b1619f3df424103f88cd5d3973eb394d5c3fb27f2ae960c823`. Matches manifest and historical export hash.
- `npm run assets:check`: **exit 0**, emits pilot/blocker/incomplete-acceptance notes, then `VALID metadata/evidence references only — NOT art, license, device or release certification.`
- `npm run assets:test`: **exit 0**, **36 passed, 0 failed, 0 skipped** (14 top-level tests plus nested cases). Its deliberately invalid production/L3 promotion invokes the real CLI and asserts **exit 1** with `INVALID r6d-hair-pilot: production: traceable editable source file required`.
- `node --check scripts/validate-asset-manifest.mjs` and `node --check scripts/test-asset-manifest.mjs`: syntax checks before commit.
- `git diff --check`: **exit 0**. Both `node --check` commands above also exited **0**. Python scope checks returned `PASS: exact 10-file P0-2 scope; 52 local doc links; package unchanged except two opt-in scripts; asset hash preserved; no runtime/assets/content/lockfile diff`.

No dependencies were installed. `npm run build` / `npm run verify:dev` were **not run**: the utility/tests import only Node built-ins, are opt-in, and are not imported by runtime, Vite, existing build/verify or release gates. Existing command behavior is unchanged. Focused CLI and filesystem-integrity tests are the relevant execution path; this does not claim game regression, visual or device PASS. If later integration changes runtime/build behavior, run the corresponding full checks then.

Setup failures retained: an initial read of unmaterialized Git blobs failed because the read-only sandbox could not write Git’s partial-clone object cache. Authorized sparse materialization resolved it. `git sparse-checkout add --no-cone ...` failed because this Git version does not accept that option on `add`; rerunning `add` with the existing non-cone configuration succeeded. Source/tests/content and one existing GLB were materialized, not modified. npm reports an existing `Unknown env config "http-proxy"` warning; checks still exit 0. Staging the new `asset-pipeline/pilot.json` initially stopped at the sparse-checkout boundary; `git add --sparse asset-pipeline/pilot.json` stages that explicitly authorized new file without expanding asset scope. No functional test failure was waived.

Changed in P0-2: `asset-pipeline/pilot.json`, `scripts/validate-asset-manifest.mjs`, `scripts/test-asset-manifest.mjs`, `docs/ASSET_MANIFEST_PILOT.md`, `package.json` (two commands only), plus `AGENTS.md`, `README.md`, Brief, Tracker and this report for stage status. No runtime/gameplay/asset/shader/source-master/version changes, paid calls, source migration, legacy enrollment or P0-3/P0-4 implementation.

**Historical stage result at the P0-2 handoff: PARTIAL / independent review pending.** Subsequently Julia accepted technical PASS with the explicit limits recorded above and delegated P0-3. No owner/art/device PASS is asserted. P0-1 remains PARTIAL with live synchronization blocked and no Issue mutations permitted.

## P0-1 scope and provenance (historical checkpoint)

- Repository: `michael-wang/OutRun`; branch: `p0/dot-pipeline-pilot`.
- Starting SHA: `e81272a0e3295c942ece8b3d305bc49b0337fbe0`. `git ls-remote --heads origin dev p0/dot-pipeline-pilot` returned that dev SHA and no existing remote pilot branch. Local branch was new; initial worktree clean.
- Initial checkpoint SHA: `c8dfb25298aad9e0d223db7b4fe393e18b837f0e`; a follow-up documentation correction fixes the UTC/Taiwan date label without rewriting history. Ending checkpoint SHA: obtain with `git rev-parse HEAD` on this branch after the checkpoint; the exact resulting SHA is supplied in the handoff. It cannot be embedded in its own commit without changing that SHA.
- Sparse, blob-filtered local clone: docs and reference metadata only; binary art was not downloaded or modified. `git ls-tree -r --name-only HEAD .agents docs/AGENTS.md` returned no entries: no checkout `.agents/skills` or nested docs instructions were available. Root AGENTS was read completely, along with the Brief and Tracker.
- **Michael authorized the full P0-1–P0-4 pilot and final Draft PR into dev. Julia delegated P0-1 first** with local checks/checkpoint commits, then a temporary review pause: no P0-2, push or PR yet. This stage gate does not revoke later pilot authorization or inherently require new Michael approval. No Draft PR was created; existing PR #31 is unrelated to this pilot.
- No gameplay, runtime, shader, art, package version, main/dev ref, release, deployment, history rewrite, binary migration, issue/PR mutation or paid API operation.

## Active authority and stale directives

Read [Tracker](PRODUCTION_PIPELINE_TRACKER.md) → [Brief](DOT_P0_PILOT_BRIEF.md) → top of [AGENTS](../AGENTS.md), with Julia’s current P0-1 stage review pause within Michael’s full-pilot authorization. The next action is **independent review of this checkpoint**, not P0-2 or an old R7 task. README now links this route.

| Source / classification | Evidence and rationale | Next action / unknown |
| --- | --- | --- |
| Tracker + Brief + top AGENTS: **ACTIVE** | New production reset supersedes older dispatch; racing first, scenery second; character HOLD; P0 before P1/P2. | Review P0-1; preserve review and release boundaries. No independent PASS yet. |
| AGENTS dated R6/R7 orders: **HOLD / SUPERSEDED** | Multiple former CURRENT headings and “active next” #49–54 contradict the reset. Headings now explicitly historical; original prose preserved. | Read only as dated provenance/identity constraints; do not resume clothing, body, face or hair. |
| [R7 plan](COAST_HERO_ASSET_R7_PLAN.md), [heroine contract](COAST_HEROINE_FINAL_PRODUCTION.md): **HISTORICAL / HOLD** | Occupants-before-car ordering, ready-for-production text and backless/neck-loop variants are superseded. B-2 shoulder-to-waist clarification remains preserved as design history. | No new modeling; final costume/showcase acceptance is not inferred from in-car usability. |
| [Architecture](CURRENT_ARCHITECTURE.md), [30km director](R5C_30KM_ROAD_DIRECTOR.md): **HISTORICAL dimensions/work orders** | Architecture says both 10km and 30km; director says HUD 350–30,350. Base `road.json.length` is 14200; direction revision is `sunset-sprint-14k`, 10 chapters, 9 heroes, 3 gates. | Banners identify current 14,200m / HUD 350–14,550; keep lifecycle/shared-road invariants. No geometry change or drive acceptance. |
| AGENTS old version/environment claims: **HISTORICAL** | References to dev 0.10.0/0.10.13 and GitHub-only execution are dated. Base `package.json.version` is 0.10.30; this pilot has a local Linux checkout. | Snapshot given at entry point; no version bump. Windows Blender/device availability is not implied. |
| [Scenery plan](COAST_SCENERY_PRODUCTION_PLAN.md): **REFERENCE; sequencing superseded** | Parallel hero/people/scenery order predates P0 → P1 → P2. Asset/site/layout separation remains useful. | No #34/#35 execution; use bounded P2 contract later. |
| [Portable sites](COAST_PORTABLE_SITES.md): **CURRENT limited reference** | R0 covers static GLB placement/hero markers; one farmhouse at 1085m, not completed bay/terrain pipeline. | Preserve limitations; do not infer L3 or full relocation capability. |
| [Art/engineering principles](ART_TECH_CO_DESIGN_PRINCIPLES.md): **CURRENT principles, historical example/budget** | R6 integrated “current” example and blanket NT$0 conflict with reset; downstream/visual gates remain useful. | Banner routes priority/budget/source-control decisions to Tracker. No paid use authorized. |
| [Clothing failure report](art-review/r7-clothing/README.md): **RETAIN evidence** | Raised-arm wing deformation and relaxed-pose clipping are recorded; no runtime export/FPS acceptance. | Keep evidence and source references; no repair in P0-1. Local C: masters/backups unverified. |

No archival document or evidence was removed. Broad cleanup, source inventory/backup design and a mechanical task gate belong to later P0 stages. Banners at the misleading entry points avoid rewriting all historical specifications.

## All open issues — branch-local dispositions

GitHub connector searches `is:issue is:open` (topn 100) returned **14** issues; each was fetched directly and confirmed `state=open`; all issue comment pages were fetched. PR search `is:open` (topn 100) returned **one** PR. These are snapshot observations, not permanent counts. No issue was closed, relabeled, edited or commented on. Dispositions below are proposed dispatch classifications, not GitHub labels or acceptance verdicts. `SUPERSEDED` means old instructions superseded, not all underlying concerns resolved. `NEEDS_OWNER_REVIEW` explicitly preserves unresolved completion/acceptance; no forced zero-unknown claim.

| Issue (all live OPEN) | Disposition | Evidence / rationale | Next action and unresolved evidence |
| --- | --- | --- | --- |
| [#54 clothing](https://github.com/michael-wang/OutRun/issues/54) | **HOLD** | Body is accepted only as substrate; [clothing report](art-review/r7-clothing/README.md) records failed deformation. Tracker CH1 freezes further work. No issue comments. | Julia/Michael decide any later reopening after scene capability; no garment PASS or new correction. |
| [#51 Rev B](https://github.com/michael-wang/OutRun/issues/51) | **NEEDS_OWNER_REVIEW** | [Owner comment](https://github.com/michael-wang/OutRun/issues/51#issuecomment-6882206822) says B-2 implemented/in-car acceptable, standing form inadequate; original neck-loop order superseded. | Preserve current asset; confirm final costume signoff separately. Comment’s #52 “next” is now historical under CH1. |
| [#50 R7H](https://github.com/michael-wang/OutRun/issues/50) | **SUPERSEDED** | [Comment](https://github.com/michael-wang/OutRun/issues/50#issuecomment-6881767199) routes costume to #51 and says do not rerun fullbody generation. [R7H report](art-review/r7h/README.md) is implementation evidence, not current acceptance. | Retain gesture/identity history; do not repeat #50. Remaining art/device acceptance stays with owner and #45. |
| [#49 R7 roadmap](https://github.com/michael-wang/OutRun/issues/49) | **SUPERSEDED** | [Comment](https://github.com/michael-wang/OutRun/issues/49#issuecomment-6880730989) supersedes bust-only direction with #50; newer Tracker puts characters on HOLD and car proof after P0. | Preserve unfinished male/character concerns as deferred; do not execute old R7/R8 sequence. |
| [#45 hair/device](https://github.com/michael-wang/OutRun/issues/45) | **BLOCKED** | Current issue prefix and Tracker R1 explicitly retain Pixel 8 release gate; comments record old 22.87 → 18.05 FPS and no newer device retest. | Michael/device operator must provide actual R6d/WILD moving-device evidence under a separate bounded task. Do not revive older hair-art directions in body/comments; not release-ready. |
| [#35 farmhouse](https://github.com/michael-wang/OutRun/issues/35) | **HOLD** | Issue says queued/not started, depends on #34; body says board A while newer scenery plan uses Option B. Existing farmhouse is not proof this requested art kit passed. | Julia reconcile style and P2 contract before implementation; no completion or visual acceptance inferred. |
| [#34 Blender bridge](https://github.com/michael-wang/OutRun/issues/34) | **HOLD** | Relevant P2 dependency; issue requests import/GLB/real-game evidence. No comments establishing completed rehearsal. | Reuse scope in later P2 preparation; actual local Blender/import/device evidence remains unverified. |
| [#33 R5b.4](https://github.com/michael-wang/OutRun/issues/33) | **NEEDS_OWNER_REVIEW** | Issue requests AI, prop landing and held-confirm fixes on 0.10.6; AGENTS later describes implementation constraints, but issue has no closure/playtest evidence in comments. | Julia reconcile later implementation with specific PS4/play acceptance; no bug-fix work here and no PASS from newer version alone. |
| [#32 startup lag](https://github.com/michael-wang/OutRun/issues/32) | **HOLD** | Explicit P2/nonblocking deferred observation; device/phase/root cause not established; no comments. | Profile cold/warm target-device startup when separately prioritized. Do not guess cause. |
| [#20 finish HUD](https://github.com/michael-wang/OutRun/issues/20) | **HOLD** | Explicit future UI follow-up from old rural release; no acceptance/completion comments. | Owner revalidate relevance to current finish screen before new work; no HUD change now. |
| [#14 old roadmap](https://github.com/michael-wang/OutRun/issues/14) | **SUPERSEDED** | Comments progress old seeded route/interchanges/Scenic Director; root AGENTS R3 says retired procedural routes must not return. Tracker is new action list. | Keep design lessons and pending historic playtest details; Julia may extract relevant future needs, not restore old generators. |
| [#9 scenery/streaming](https://github.com/michael-wang/OutRun/issues/9) | **NEEDS_OWNER_REVIEW** | Old seeded-r7 issue overlaps #7 reliability but concerns scenery starvation and full-drive baseline, so not a proven duplicate. No comments. | Map remaining symptoms to authored coast and real Pixel 8 evidence; do not mark fixed merely because architecture changed. |
| [#7 empty sky](https://github.com/michael-wang/OutRun/issues/7) | **NEEDS_OWNER_REVIEW** | [Hotfix comment](https://github.com/michael-wang/OutRun/issues/7#issuecomment-6533727994) says interim safety fix shipped but original trigger/full-device journey still unproven; explicitly do not close. | Preserve root-cause/device unknowns; Julia/Michael assess relevance and release risk separately. No new safety test claimed. |
| [#6 bridges](https://github.com/michael-wang/OutRun/issues/6) | **SUPERSEDED** | Generated-trip frequency request conflicts with authored finite-coast direction; no comments proving general scenic desire satisfied. | Keep scenic intent for future owner-led planning; no procedural-route restoration or automatic closure. |

Overlaps: #49 → #50 → #51 are successive/umbrella orders, not three independent active jobs; #54 is a failed separate garment experiment. #34 is a prerequisite to #35, not a duplicate. #7 and #9 share reliability context but preserve different unresolved symptoms. No open issue is authorized as a new implementation task in this P0-1 handoff.

## Open PR disposition

[#31](https://github.com/michael-wang/OutRun/pull/31): **NEEDS_OWNER_REVIEW**. Direct metadata: OPEN, draft=true, merged=false, mergeable=false; `dev` at `e81272a0e3295c942ece8b3d305bc49b0337fbe0` → `main` at `bc22a1dee6151607e462f4defbbcc5ef18d54dfc`. Title says R4; body still describes R2a / 0.9.44-dev.4 / `861701e`. API reports 181 commits and 985 changed files, so that description does not represent its current scope. The only returned discussion entry is a [Netlify preview canceled notice](https://github.com/michael-wang/OutRun/pull/31#issuecomment-6806505572), not successful validation or owner approval. Mergeability is a transient API observation; no conflict repair attempted.

Next: Julia/Michael separately reconcile integration scope, stale description, review/device evidence and main release decision. Leave draft and main untouched. This is not a substitute for the later pilot-to-dev PR. Inspection here covers metadata and complete returned discussion, **not an independent review of the 985-file integration diff**; no readiness verdict.

## Stage status and review gate

| Stage | Status | Evidence / caveat |
| --- | --- | --- |
| P0-1 | **PARTIAL** | Authority correction independently accepted; live synchronization never completed and Michael now prohibits Issue edits. Dispositions/errors retained for final review. |
| P0-2 | **PASS (technical)** | Julia independent review and reproduced checks; limitations retained. |
| P0-3 | **PASS (technical scope)** | Julia reviewed and reran trial; same-machine bytes only. No migration/native-master/independent-backup acceptance. |
| P0-4 | **PASS (technical scope)** | Julia inspected final code/diff and reran 14 task + 36 asset tests; no authenticated human/actual-car/device acceptance. |

**Independent review received — correction pass 1 of maximum two.** Julia reports reading the actual diff and verifying the clean worktree, `git diff --check`, and road/package snapshot. She rejected a material authority error: Codex had attributed the temporary P0-1-only delegation/pause to Michael rather than Julia. Codex corrected AGENTS, README, Brief, Tracker and this report to preserve Michael’s full-pilot/final-Draft-PR authorization and identify Julia’s temporary stage gate. Julia also required an exact, minimal live-issue synchronization proposal and permission verification before mutation. Those are supplied below. Julia subsequently accepted the authority correction and reviewed the 14 exact prefixes, then instructed Codex to perform the body-only synchronization. Final P0-1 verification remains **PENDING**; the reported checks are not owner/art/device acceptance.

Live issue synchronization is **BLOCKED BY AUTOMATIC APPROVAL REVIEW**, not complete or waived. Julia reviewed and accepted the proposal and instructed execution within Michael’s pilot authorization. The first body-only update on #6 and one evidence-supported retry were denied; read-backs confirm no changes. The remaining 13 writes were not attempted. Do not dispatch from stale issue bodies; exact denial and verification details follow.

## Historical approved issue-sync proposal — never executed successfully; do not retry

**Permission evidence (read-only checks):** GitHub `get_user_login` returned `michael-wang`; `get_repo(michael-wang/OutRun)` reported `admin`, `maintain`, `pull`, `push`, and `triage` all true; `get_repo_collaborator_permission` for that returned login reported `admin`. The available `update_issue` tool supports a body-only update. At that permission-check step, no Connect/Reconnect prompt, permission denial or write attempt had occurred. Reported repository permission was verified; subsequent automatic approval review denied the body edit despite those repository permissions. Actual write success is not claimed.

**Exact target set:** issues **#6, #7, #9, #14, #20, #32, #33, #34, #35, #45, #49, #50, #51, #54**. All 14 have a current disposition in the inventory, so one consistent short body prefix per issue satisfies the dispatch-status requirement without introducing label taxonomy or closing history. No title, label, state, assignee, milestone, comment, PR #31, branch or asset changes proposed. PR #31 retains its separate review disposition; editing its integration scope is not required for issue dispatch synchronization.

**Historical proposed operation (superseded by Michael’s no-live-edit direction; not an execution instruction):** fetch each issue’s latest body/state/comments again, stop and reconcile any materially changed evidence, then call `update_issue` with only `repository_full_name`, `issue_number`, and `body`. Body = the following prefix with its two placeholders replaced verbatim by that issue’s table cells, followed by **the complete latest existing body unchanged**. The marker prevents duplicate prefixes; if already present, inspect it instead of adding another. Re-fetch after each update to verify the prefix and original-body preservation. A changed/uncertain outcome is checked before any retry. Original proposal status was **PROPOSED; NOT EXECUTED**. Julia subsequently accepted the proposal; current status is **BLOCKED: #6 denied, all bodies unchanged**.

```text
<!-- p0-pilot-dispatch-status -->
> **P0 pipeline dispatch status: {STATUS}.**
> {ISSUE_NOTE}
> The [Production Pipeline Tracker](https://github.com/michael-wang/OutRun/blob/098da47c485cb9521a6fb9c66b2e8bccd1f733b4/docs/PRODUCTION_PIPELINE_TRACKER.md) supersedes older work orders below. Michael authorized the P0-1–P0-4 pilot and final Draft PR into dev; this issue is not a separate implementation assignment. Character expansion remains on hold. This notice changes dispatch classification only, not GitHub open state or technical, visual, device, owner or release acceptance. Existing evidence and unresolved concerns below are retained.

```

Use these exact substitutions; the shared prefix links the already-published production reset, not the unpublished pilot branch. It deliberately does not embed Julia’s temporary stage pause as a permanent issue restriction.

| Issue | STATUS | ISSUE_NOTE (verbatim) |
| --- | --- | --- |
| 6 | SUPERSEDED | The generated-trip bridge-frequency work order is superseded by the authored finite-coast direction. Preserve the scenic intent for future owner-led planning; do not restore procedural routes or infer the request was completed. |
| 7 | NEEDS_OWNER_REVIEW | The recorded interim safety hotfix does not establish the original Pixel 8 trigger or full-journey verification. Keep this issue open; Julia/Michael must reconcile the remaining root-cause/device evidence with the current authored coast before any closure or release conclusion. |
| 9 | NEEDS_OWNER_REVIEW | Scenery starvation and the full-drive Pixel 8 baseline remain unverified here. This overlaps #7 but is not a proven duplicate; reconcile remaining symptoms against the current authored coast before choosing follow-up work. |
| 14 | SUPERSEDED | The old seeded-route/Scenic Director roadmap is superseded by the current Tracker and authored-coast direction. Retain design lessons and historical pending acceptance; do not restore retired generators or treat old next-step comments as dispatch. |
| 20 | HOLD | This remains a deferred finish-screen UI request. Revalidate its relevance and acceptance criteria against the current finish screen when separately prioritized; no completion or new UI work is implied. |
| 32 | HOLD | The startup-lag observation remains a deferred nonblocking performance follow-up. Device, startup phase and root cause are not established; profile cold/warm target-device startup when separately prioritized. |
| 33 | NEEDS_OWNER_REVIEW | Later implementation records do not establish all requested AI, prop-landing and controller play acceptance. Julia/Michael must reconcile specific implementation and PS4/device evidence before deciding remaining work or closure; a newer version alone is not PASS. |
| 34 | HOLD | The road-to-Blender/GLB rehearsal remains relevant to later P2 preparation, not current implementation dispatch. Verify actual import, round-trip and in-game evidence under a bounded later task; no completed rehearsal is inferred here. |
| 35 | HOLD | The farmhouse/roadside kit remains a later P2 candidate dependent on #34. Julia must reconcile the older board-A wording with newer Option B direction before implementation; an existing farmhouse does not prove this art kit passed. |
| 45 | BLOCKED | Keep the Pixel 8 R6d/WILD release-performance gate open. The recorded prior regression and absence of newer real-device evidence do not establish performance PASS. Older hair-art implementation/recovery orders below are historical; no new hair work or release readiness is implied. |
| 49 | SUPERSEDED | The old occupant-first R7/R8 dispatch sequence is superseded by later #50/#51 work and the production reset. Preserve unfinished character concerns as deferred; current character work is on hold and Riviera proof follows P0 under the Tracker. |
| 50 | SUPERSEDED | The original fullbody/backless generation order is superseded by the recorded costume revisions and production reset. Do not rerun fullbody generation; preserve existing gestures and identity. Remaining art/device acceptance is not inferred from implementation and #45 remains unresolved. |
| 51 | NEEDS_OWNER_REVIEW | The B-2 shoulder-to-waist revision superseded the earlier neck-loop instructions. Recorded in-car usability is not final costume/showcase signoff; preserve the playable asset and seek Julia/Michael’s disposition of outstanding acceptance. The old comment routing to #52 is historical under the character hold. |
| 54 | HOLD | Further garment work is on hold under Tracker CH1. The recorded independent MPFB dress candidate failed raised-arm deformation and relaxed-pose clipping checks; accepted body substrate is not accepted clothing. Preserve the failure evidence and current playable assets; no correction or integration is dispatched. |

Julia confirmed this exact wording and directed execution. The following block is an actual automatic-approval rejection, not a newly inferred permission requirement or a change to Michael’s full-pilot authorization.

## Synchronization execution result — 2026-11-15 17:23 UTC

Preflight re-fetched all 14 issue bodies/states and all comments: every issue was OPEN, every body/comment set matched the original inventory, and no status marker was present. #6 was fetched again immediately before its write; its snapshot was unchanged. Thus no material source drift was observed.

Attempted action: GitHub `update_issue` on `michael-wang/OutRun#6`, supplying **only** repository, issue number and body. Intended body was the approved prefix plus the complete unchanged current body. Automatic approval review returned `isError=true` and this reason:

> This publicly mutates GitHub issue #6 by adding a dispatch-status notice, creating an external project representation; the trusted user instructions authorize local P0-1 documentation and review but do not explicitly authorize this live issue-body edit.

A read-back confirmed #6’s body was unchanged. As required after a denial, Codex used `user_message_read.read_messages(before=19)` and retrieved Michael’s original full-pilot instruction (message `Sentinel_c1b542ffac4c8191b213efae1b961ff6`, 2026-11-15 17:07:57 UTC), which directs P0-1–P0-4 under the Brief/Tracker and permits delegated small steps without asking him at every step. This was newly retrieved authorization evidence. Codex retried **the same #6 operation once**, without altering tool arguments or adding evidence to the issue body. Automatic approval review again returned `isError=true`:

> This retries the same unauthorized public issue-body mutation after an explicit safety rejection; the available trusted user authorization covers local P0-1 documentation and issue inspection, not editing live GitHub issues, and the retry does not add valid user approval.

The second read-back also confirmed #6 unchanged. Codex stopped all live mutations: no alternate tool, account, issue, comment or workaround was used. There is no uncertain write outcome; **zero successful writes**.

| Targets | Exact outcome | Verification |
| --- | --- | --- |
| #6 | **DENIED**, initial attempt + one retry | Body equals preflight body; still OPEN; title, labels, assignees, milestone, state reason, closed time, comment count, creation time and author unchanged. |
| #7, #9, #14, #20, #32, #33, #34, #35, #45, #49, #50, #51, #54 | **NOT ATTEMPTED** after #6 denial | All 13 fetched again after stop: bodies and the same metadata fields equal preflight snapshots; all remain OPEN. |

No live issue, PR, label, comment or state was changed. Available repository admin permission and accepted supervisor direction did not satisfy automatic approval review’s interpretation of trusted user authorization. **Historical blocker at that attempt:** automatic approval review did not recognize live-issue-body-edit authorization. **Subsequent Michael decision supersedes any retry follow-up: leave all 14 Issues unchanged and retain unsynchronized recommendations/errors for the full P0 Draft PR review. Do not seek a workaround or retry.** This is an external public project-representation change, which is the risk identified by the reviewer. P0-2 remains NOT STARTED pending independent verification.

## Local verification and reproducibility — P0-1 historical commands

Commands run from the repository root; results recorded after execution before committing. Documentation-only scope does not warrant npm install/build/verify:dev under Brief boundary 5. No JS/tooling changed, no app/device/visual tests were run, and no code-test PASS is claimed.

Initial `git diff --check` failed (exit 2) on two newly edited Markdown lines with trailing spaces (Brief/Tracker); those spaces were removed. Because the shell used `&&`, the Python check did not run in that failed attempt. Rerun passed (exit 0): 11 Markdown-only files, 56 local links, all 14 issue IDs and PR31, package/road snapshot, and original R6/R7 prose preservation. No failures were waived.

Historical P0-1 focused check, as run before checkpoint `e3ca360` (not the current P0-2 scope check; it assumes 11 Markdown files and P0-2 not started):

```sh
git diff --check e81272a0e3295c942ece8b3d305bc49b0337fbe0
python - <<'CHECK'
import json, re, subprocess, posixpath
from pathlib import Path
base = 'e81272a0e3295c942ece8b3d305bc49b0337fbe0'
def git(*args):
    return subprocess.check_output(['git', *args], text=True)
changed = set(git('diff', '--name-only', base).splitlines())
changed.update(git('ls-files', '--others', '--exclude-standard').splitlines())
assert len(changed) == 11
assert all(p.endswith('.md') and (p in ('AGENTS.md', 'README.md') or p.startswith('docs/')) for p in changed)
tracked = set(git('ls-tree', '-r', '--name-only', base).splitlines()) | changed
links = 0
for name in changed:
    for target in re.findall(r'(?<!!)\[[^\]]*\]\(([^)]+)\)', Path(name).read_text()):
        if '://' in target or target.startswith('#'): continue
        target = target.split('#', 1)[0]
        assert posixpath.normpath(posixpath.join(posixpath.dirname(name), target)) in tracked, (name, target)
        links += 1
report = Path('docs/DOT_P0_PILOT_REPORT.md').read_text()
ids = {int(n) for n in re.findall(r'^\| \[#(\d+)', report, re.M)}
assert ids == {6, 7, 9, 14, 20, 32, 33, 34, 35, 45, 49, 50, 51, 54}
assert '[#31]' in report and 'P0-2 | **NOT STARTED**' in report
assert json.loads(Path('package.json').read_text())['version'] == '0.10.30'
assert json.loads(Path('content/stages/coast/road.json').read_text())['length'] == 14200
d = json.loads(Path('content/stages/coast/direction.json').read_text())
assert d['revision'] == 'sunset-sprint-14k'
assert [len(d[k]) for k in ('chapters', 'heroSlots', 'contestGates')] == [10, 9, 3]
old = git('show', base + ':AGENTS.md')
old = old[old.index('## CURRENT ART WORK'):old.index('## Engineering')]
new = Path('AGENTS.md').read_text()
assert all(line in new for line in old.splitlines() if line and not line.startswith('## '))
# Correction pass 1: authority attribution and exact proposal coverage.
for name in ('AGENTS.md', 'README.md', 'docs/DOT_P0_PILOT_BRIEF.md', 'docs/PRODUCTION_PIPELINE_TRACKER.md', 'docs/DOT_P0_PILOT_REPORT.md'):
    text = Path(name).read_text().split('## Local verification', 1)[0]
    assert 'Michael authorized' in text and 'Julia' in text
    assert not re.search(r'Michael.{0,25}(?:requested only|limits this checkout|handoff stops after)', text)
proposal = report.split('## Approved live issue synchronization proposal', 1)[1].split('## Synchronization execution result', 1)[0]
proposed_ids = {int(n) for n in re.findall(r'^\| (\d+) \|', proposal, re.M)}
assert proposed_ids == ids
assert 'BLOCKED: #6 denied, all bodies unchanged' in proposal
assert 'zero successful writes' in report and 'P0-2 | **NOT STARTED**' in report
print('PASS: correction 1 authority attribution and all 14 proposed issue prefixes')
print(f'PASS: 11 Markdown files; {links} local links; 14 issues + PR31; source snapshot; historical prose preserved')
CHECK
```

Correction pass 1 rerun: **exit 0**, `PASS: correction 1 authority attribution and all 14 proposed issue prefixes`; existing focused checks also returned `PASS: 11 Markdown files; 56 local links; 14 issues + PR31; source snapshot; historical prose preserved`.

This checks local link targets against the tracked Git tree, not HTTP availability or anchor validity; binaries need not be downloaded. Evidence of live issue states came from direct connector reads, not this syntax check. Complete diff: `git diff e81272a0e3295c942ece8b3d305bc49b0337fbe0 HEAD`; checkpoint identity: `git rev-parse HEAD`; cleanliness: `git status --short`.

Changed files: `AGENTS.md`, `README.md`, `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md`, `docs/COAST_HEROINE_FINAL_PRODUCTION.md`, `docs/COAST_HERO_ASSET_R7_PLAN.md`, `docs/COAST_SCENERY_PRODUCTION_PLAN.md`, `docs/CURRENT_ARCHITECTURE.md`, `docs/DOT_P0_PILOT_BRIEF.md`, `docs/DOT_P0_PILOT_REPORT.md`, `docs/PRODUCTION_PIPELINE_TRACKER.md`, `docs/R5C_30KM_ROAD_DIRECTOR.md`. All are documentation; report is new, the others change authority framing/status only.

## Dot Supervisor Evaluation — pending independent assessment

Builder-observed evaluation evidence: Julia required real diff inspection and local tests, caught the P0-1 owner/stage attribution error, and accepted its correction. She reviewed P0-2 and P0-3 with reproduced checks and explicit evidence limits. Her P0-4 adversarial review found the genuine failed-receipt defect. The first correction instruction also over-restricted the two-pass rule: it led to treating two successful corrections as a production blocker. Julia acknowledged her instruction's role and required correction 2 to separate no-third-correction from acceptance/advancement. Final actual-code re-review and both suites passed. No third correction was attempted. These findings support substantive supervision, but also expose an avoidable correction cycle; they are not a self-awarded supervisor score.

The worker preserved failed-test/denial records, stopped at each review gate, used bounded local tools and left runtime/assets/releases intact. The issue update and one retry were denied by automatic approval review, with read-backs showing no changes; after Michael's explicit no-live-edit direction, no further attempts occurred. P0-1 therefore remains honestly PARTIAL. Communication and exact commits make decisions reviewable; token savings, latency and cost efficiency were not measured. Julia/Michael retain final judgement on adopting this supervision workflow.

Known unknowns: unresolved owner/device evidence in table; C: Blender masters and backups not accessible/verified; global source licensing not assessed; PR #31 integration not code-reviewed; no timing study proves the under-one-minute newcomer criterion. Token/agent cost is not measurable here; no paid services or inference APIs were invoked. Preserve recorded failures and existing release status.

**Exact follow-up:** Julia reviews the final branch documentation/status diff, then the already-authorized push and Draft PR into dev can proceed under bounded delegation. Stop at Draft PR for Julia + Michael review; no merge or P1/P2 execution. No push/PR has occurred at this report checkpoint. Preserve P0-1’s PARTIAL/unsynchronized state and actual errors; Michael directs no public Issue changes/retries. The full pilot authorization remains in force through bounded delegations. No asset migration, cleanup or P1/P2 production is authorized by this checkpoint.

# P0-3 — source storage, restore trial and evidence retention

> **CURRENT NOTE (2026-11-21):** 以下是 2026-11-16 的 P0-3 歷史研究與提案，並非現行 R6d 的執行門檻。Michael 已決定個人 Hobby Project 對可公開的小型原生母檔採 [GitHub-first 方案 A](ASSET_SOURCE_CUSTODY.md)；不強制 D 槽、私人 Repo 或多地備份。歷史風險分析與試驗證據保留，但不要再拿它要求 Judy 找外接硬碟才能將 R6d 提交到 Git。


**RESEARCH / non-destructive local trial; technical scope independently accepted by Julia.** She inspected the actual inventory, deployment analysis and complete script/diff, reran the five-file trial against `30d2fea` and whitespace checks; an additional reviewer reran trial/refusal checks and inspected workflows without a blocking defect. This acceptance does not verify native master recovery, independent backups, LFS hydration or live deployment, and authorizes no migration/deletion. Policy adoption remains a separate decision. Snapshot: `30d2fea0693f86c20cbb023825cbdd9b2a6f2176`. Latest remote dev is still `e81272a0e3295c942ece8b3d305bc49b0337fbe0`. No storage service, migration, retention automation, cleanup, upload, deployment or issue edit was performed.

## What was actually verified

Inventory uses `git ls-tree -r --name-only 30d2fea0693f86c20cbb023825cbdd9b2a6f2176`, not the sparse worktree’s visible files. It contains **1,033 tracked paths**. Counts refer to that snapshot, not historical revisions or the owner’s disk. [Machine-readable counts and trial hashes](P0_3_STORAGE_TRIAL.json).

| Inventory | Verified fact | Limit / next evidence |
| --- | --- | --- |
| Original design references | Three PNGs + README in `art/reference/coast/`; 109 PNGs and 224 JPGs across Git overall. Style B board was materialized, its 2,213,841 bytes and SHA-256 match the recorded approved reference. | PNGs are flattened image originals, not proof of layered design masters. Other images were counted from the tree, not all downloaded or visually inspected. Approval is historical documentation, not a new verdict. |
| Runtime exports | 17 `.glb` paths, all under `public/assets/`; R6d bytes verified at 153,240 bytes and SHA-256 `8273fe14...399f519`. | Other GLB path presence is verified, not byte completeness, editability, loadability or provenance. An export is not a substitute for its editable master. |
| Audio | `src/assets/passenger-nice-pass.mp3`, `passenger-yes.mp3`, `passenger-palm.wav`; `src/sound.ts` imports each with `?url`. | Two MP3 + one WAV are runtime files. WAV alone does not prove a raw recording/master. No DAW session, stems, recording provenance/consent or source license was found in this bounded audit; owner workstation not accessed. |
| Editable-master candidates | Zero tracked `.blend`, `.blend1`, `.psd`, `.kra`, `.xcf`, `.ai`, `.svg`, `.rpp`, `.aup`, `.aup3`, `.als`, `.flp`, `.logicx`, `.mid`, `.midi` paths. | Extension inventory is not an exhaustive proof that all possible source formats are absent. It establishes no tracked Blender/these common project files at this commit. |
| Procedural/source tooling | 21 Python and 58 MJS files overall; 13 files under `scripts/blender/`. Scripts and runtime TS geometry are tracked. | Scripts may depend on local files/earlier exports. Presence does not prove reproducibility or that the latest `.blend` matches a patched GLB. |
| Review material | 341 paths under `docs/art-review/`, 128 under `docs/evidence/`; 17 MP4 + one WEBM overall. | Counts include reports/data, not only media. No bulk download, byte-size total, duplicate analysis or deletion classification by filename alone. |
| Git/LFS configuration | No `.gitattributes` or `.lfsconfig` tracked anywhere in the snapshot. | Not a full history audit or proof no legacy pointer exists. Five trial files are ordinary hydrated bytes, not LFS pointers. |
| Local untracked/ignored files | Before P0-3 changes, `git ls-files --others --exclude-standard` and `git ls-files --others --ignored --exclude-standard` returned empty in this Linux checkout. | This sparse clone is not the owner’s Windows workspace. It is not evidence that owner-local masters or caches do not exist. No owner C: drive is mounted/verified. |

`.gitignore` excludes `/art-prototype/output/`, `/captures/`, `docs/evidence/`, `.cache/watercraft/` and `.cache/farm/`. `git check-ignore -v` confirmed the relevant rules. Existing tracked evidence still appears in Git despite ignore rules. The stale ignore comment about release-hosted generated GLBs does not establish a current build-time download path; no such fetch appears in the inspected build script/config. The clone is blob-filtered/sparse, so it is **not a complete repository backup**.

## Documented owner-local masters — not accessible or verified here

| Source family / reported location | Evidence | Status and risk |
| --- | --- | --- |
| Approved head/color and hair studies under `C:/astra-dev/tools/outrun-h1ar3d/` (`heroine-color-study.blend`, `heroine-hair-motion-study.blend`) | [R7A report](art-review/r7a/README.md), [hair trial](art-review/hair-spring-ab/README.md) | Documented only. No current existence, byte hash, license completeness, backup or successful open verified. |
| R6d `C:/astra-dev/outrun/art-prototype/output/r6d-cover-locks.blend` | [R6d report](art-review/r6d/README.md) | Documented only; pilot manifest deliberately has no source hash. R6b report notes a direct GLB weight update without access to the master, so source/export parity must not be assumed. |
| R7H `r7h-heroine-fullbody.blend`, `r7h-heroine-review.blend`, older v028/v029 variants in `art-prototype/output/` | [R7H](art-review/r7h/README.md), [B-2 provenance](art-review/r7h-revb/README.md) | Reports include saved-original hashes/paths, not a backup this environment can verify. Do not overwrite or regard a Git GLB as recovery of the Blender scene. |
| MPFB `.../r7-base/heroine-mpfb-body.blend` and `.../r7-clothing/heroine-mpfb-b2-dress.blend`; scripts/presets beside them | [body report](art-review/r7-base/README.md), [failed dress report](art-review/r7-clothing/README.md) | Source/preset files documented, ignored and inaccessible here. Preserve the separate accepted substrate and failed garment; no new modeling authorized. |
| R7S/R7T candidate, neutral/review and failed-preserved scenes in `art-prototype/output/` | [R7S](art-review/r7s/README.md), [R7T audit](art-review/r7t-audit/README.md) | Historical failure sources matter. R7T audit explicitly says the initial broken `.blend` was overwritten; surviving snapshots do not reproduce that initial state. This is documented loss, not a claim that it can be restored from Git. |
| Original music/voice projects, takes, stems, author/license records | [asset caveats](ASSETS.md), tracked runtime audio imports | No specific verified master path or backup located. Keep UNKNOWN; request a workstation inventory under a later bounded task, not a claim of safe storage. |

## Recommended storage plan — decisions, not a migration

Keep current playable exports and existing tracked design references exactly where they are. First protect/editably inventory sources on the workstation, then choose storage based on measured bytes/change frequency, restore needs and rights. No evidence or file is deleted merely to reduce Git size.

| Option | Appropriate use | Tradeoffs / prerequisite |
| --- | --- | --- |
| Ordinary Git | Source scripts, manifests, license/provenance text, selected stable design PNGs, small approved exports already consumed by builds. | Reviewable history and simple builds. Frequently changing large binaries add history cost; Git alone is not independent/offline backup. No blanket binary threshold or mass conversion chosen. |
| Git LFS, potentially a separate source-only repository | Large `.blend`, layered artwork, audio sessions where commit-linked versions/locking improve collaboration. | Pointer/object availability, hydration, quota and bandwidth must be checked. Keep runtime exports out of any migration until both deployment paths are tested. No LFS tracking/configuration or history rewrite in this pilot. |
| Existing versioned asset storage + checksum catalog in Git | Large editable masters/dependencies and immutable revision bundles, using storage the owner already controls if capacity permits. | Requires stable IDs, retained versions, permissions and tested restore; a mutable shared-folder link or sync mirror alone is insufficient. No provider chosen, purchased or contacted. |

Git LFS keeps pointer files in Git; actual objects require separate availability. GitHub explicitly says Pages does not support LFS directly. Do not rely on a pointer being served as model data. [GitHub LFS documentation](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage).

Proposed practical source bundle for each accepted revision: asset ID/revision, immutable original `.blend`/layered image/audio session, dependent textures/fonts/linked libraries/samples where redistribution permits, author/tool versions and export settings, license/origin records, hashes, exported bytes and mapping to a Git commit. Keep the actual source and export separate. Open the restored master in its native application and reproduce one export before calling it recoverable. A hash comparison alone only proves byte identity.

Proposed backup target: working source plus **two independently recoverable copies**, with one on separate/offline or geographically independent storage already approved by Michael. Start with one real master after access/storage authorization, record the destination and restore receipt, then expand deliberately. Preserve immutable milestones; propose daily changed-source snapshots with 30 daily/12 monthly retention, subject to capacity/owner decision. This is a policy proposal, not an installed schedule. Protect against synced deletion and ransomware; test restore quarterly and after tool/storage changes, again as a proposed operational cadence.

A future complete Git backup should include history and, if introduced, actual LFS objects; GitHub describes mirror cloning plus a separate LFS fetch. This trial does neither and makes no disaster-recovery claim. [GitHub backup documentation](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository).

## Deployment compatibility findings

| Surface | Observed locally / documented behavior | Consequence and unverified boundary |
| --- | --- | --- |
| Vite | `package.json` prebuild bakes shore; `vite.config.ts` uses default public directory and `OUTRUN_SITE_BASE`. Vite copies `public/` assets as-is; source audio is imported via `?url`. | Unhydrated LFS pointer bytes could be copied as a GLB or bundled as audio without becoming media. Masters in `public/` would be published. Keep masters outside `public/` and runtime imports. No live/build experiment with LFS was performed. [Vite asset rules](https://vite.dev/guide/assets). |
| Offline coast plugin | `vite.config.ts` hashes built bundle/static files and writes service worker precache data, including selected public GLBs. | Pointer text could get hashed/cached as if it were data; a successful checksum/build is not GLB validity. Preserve paths and actual byte hydration before any future migration test. |
| Netlify | `netlify.toml`: `npm run build`, publish `dist`, Node 22; ignore expression allows only production/main. Local evaluation returned production/main=1 (build), deploy-preview/main=0, production/dev=0, branch-deploy/dev=0 (skip). | This validates the expression, not account configuration/live deployment. Netlify UI environment variables, access and storage settings were not inspected or changed. |
| Netlify + LFS | Official docs specify UI-level `GIT_LFS_ENABLED` and fetch filters; excluded types may remain pointers. Netlify Large Media is deprecated and not recommended for new setup. | Do not add a Netlify Large Media dependency. A future reviewed hydration trial must verify actual bytes and filters before Vite runs; no such configuration was made. [Build environment](https://docs.netlify.com/build/configure-builds/environment-variables/), [Large Media status](https://docs.netlify.com/build/git-workflows/large-media/setup/). |
| GitHub Pages | `.github/workflows/r90-validate.yml` runs only on main, builds with `/OutRun/` base, uploads `dist`, then deploys/tagging. Both existing workflows use `actions/checkout@v4` without `lfs: true`; official v4 default is false. | Current workflows are not an LFS hydration guarantee. An explicit artifact build that produces ordinary bytes is conceptually separate from direct Pages/LFS support; it would require a reviewed disposable build/deploy proof, not an assumption. No workflow, tag, main or Pages site was touched. [Checkout v4 inputs](https://github.com/actions/checkout/blob/v4/action.yml). |

Provider documentation checked 2026-11-15 UTC. Plan/account-specific quotas, actual costs, legal rights, Windows support and live Netlify/Pages behavior remain unverified. No paid call or account-setting inspection was needed for this recommendation. Recheck current provider terms before proposing a priced migration.

## Non-destructive trial and exact results

```sh
python scripts/trial-asset-backup.py --ref 30d2fea0693f86c20cbb023825cbdd9b2a6f2176
```

The script uses Python standard library only. It inventories the chosen commit; checks five allowlisted files against their committed Git blob IDs; refuses LFS pointers, >10 MiB per file or >20 MiB total; creates a new directory **outside the repository**; writes one ZIP; restores only fixed allowlisted paths into new files; verifies every restored/source SHA-256 and unchanged Git status. No network, Git write, overwrite, delete or native-app execution. It leaves all temporary output in place for review.

Result: **PASS local byte-restore trial only**, five files totaling **2,376,952 bytes**: Style B PNG, its reference README, R6d GLB, historical R6d README and pilot manifest. Full bytes, Git blob IDs and SHA-256s are in [result JSON](P0_3_STORAGE_TRIAL.json). Final archive `/tmp/outrun-p0-3-restore-jf7l2d97/sample.zip` SHA-256 `60ded6a6d267251fdb5f4983b96dc501f181283318a231cbfae2a1122fc83ab5`; restored siblings are retained. A previous successful trial directory is also retained. These ephemeral same-machine copies are **not** permanent independent backups and contain **no `.blend` or audio project**.

Initial trial failed before output creation because sparse-checkout had omitted committed `asset-pipeline/pilot.json`; materializing that existing directory resolved it. This was not a missing remote asset. Re-running with an already existing `--output` directory is an intentional negative: exit 1 / FileExistsError, archive hash unchanged. No error was waived. Native Blender/audio opens, independent-volume failure recovery, all-history Git backup, LFS hydration and deployed site tests were not run.

## Approval-driven retention proposal

| Class | Proposed retention | Before any removal |
| --- | --- | --- |
| Original approved designs, masters, source dependencies, licenses and immutable milestone exports | Preserve for project life; never treat as temporary screenshots. Keep provenance even if an asset is retired. | Separate explicit owner decision for any source retirement, verified independent backup and native restore. |
| Canonical review conclusions, representative before/after, failed-method/root-cause evidence, device performance records | Keep the smallest sufficient permanent review package and link its exact source/export revision. Unresolved failures and #45 device evidence do not expire automatically. | Julia checks that the record still explains decisions and reproduces relevant findings. |
| Raw captures, redundant renders, trial videos/logs | Candidate for review **30 days after** explicit acceptance and extraction of canonical evidence; age alone grants no deletion permission. | An explicit path/hash/size list, reason, references check, replacement evidence links, restore-tested backup and Michael’s approval. No cleanup script or automatic TTL now. |
| Current tracked history and unverified Windows folders | Preserve unchanged during this pilot. | Inventory actual files first; no `git filter-repo`, LFS history rewrite, mass upload or speculative cleanup. Removing a file from a new commit would not remove old Git history. |

Future cleanup proposal format: exact path + hash + class + owner/reviewer + acceptance/evidence links + backup location/hash + successful restore date + proposed action + approved-by/date. Julia prepares the list, Michael approves the specific list, and Codex executes only that approved scope in a separate task. References in docs/issues/PRs and license/source obligations must be checked; no public issue mutations are permitted now.

Next bounded decision after P0 review: locate one actual editable master on the owner’s workstation, measure it/dependencies, verify a native open and independent restore, then choose storage/cost policy. Until then **source-backup coverage is UNKNOWN**, regardless of this five-file trial’s success. No P0-4 started.

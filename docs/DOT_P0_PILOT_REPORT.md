# P0-1 local checkpoint — independent review pending

Type: **RESEARCH / documentation governance**. Observed 2026-11-15 UTC / 2026-11-16 Taiwan time (project decision dates use Taiwan time). Builder: Codex; coordinator: Dot; independent review: Julia/Dot; final acceptance: Michael + Julia. **PARTIAL, not self-approved.**

## Scope and provenance

- Repository: `michael-wang/OutRun`; branch: `p0/dot-pipeline-pilot`.
- Starting SHA: `e81272a0e3295c942ece8b3d305bc49b0337fbe0`. `git ls-remote --heads origin dev p0/dot-pipeline-pilot` returned that dev SHA and no existing remote pilot branch. Local branch was new; initial worktree clean.
- Initial checkpoint SHA: `c8dfb25298aad9e0d223db7b4fe393e18b837f0e`; a follow-up documentation correction fixes the UTC/Taiwan date label without rewriting history. Ending checkpoint SHA: obtain with `git rev-parse HEAD` on this branch after the checkpoint; the exact resulting SHA is supplied in the handoff. It cannot be embedded in its own commit without changing that SHA.
- Sparse, blob-filtered local clone: docs and reference metadata only; binary art was not downloaded or modified. `git ls-tree -r --name-only HEAD .agents docs/AGENTS.md` returned no entries: no checkout `.agents/skills` or nested docs instructions were available. Root AGENTS was read completely, along with the Brief and Tracker.
- Current explicit handoff authorizes **only P0-1**, focused local checks and one checkpoint commit; **no push or PR yet**. No Draft PR was created. Existing PR #31 is unrelated to this pilot.
- No gameplay, runtime, shader, art, package version, main/dev ref, release, deployment, history rewrite, binary migration, issue/PR mutation or paid API operation.

## Active authority and stale directives

Read [Tracker](PRODUCTION_PIPELINE_TRACKER.md) → [Brief](DOT_P0_PILOT_BRIEF.md) → top of [AGENTS](../AGENTS.md), subject to the narrower current Michael handoff. The next action is **independent review of this checkpoint**, not P0-2 or an old R7 task. README now links this route.

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
| P0-1 | **PARTIAL** | Authority pointers, preserved history, all open issue/PR dispositions and local checks; independent review and live issue synchronization still pending. |
| P0-2 | **NOT STARTED** | No manifest or validator implemented. |
| P0-3 | **NOT STARTED** | No source-control migration, backup verification or cleanup. |
| P0-4 | **NOT STARTED** | No production task gate implemented. |

Independent review is **PENDING**: Codex has prepared changes, but Julia/Dot must read the actual diff, inspect sources and reproduce focused checks. No fabricated review findings or approvals. Current correction passes: zero requested by independent reviewer. Maximum two focused correction passes under the Brief.

Live issue synchronization is **PENDING**, not silently waived. Tracker requires affected issues to reflect current dispatch status; this checkpoint deliberately reports branch-local classifications for review and does not claim that requirement complete. Next decision: review proposed dispositions and explicitly authorize any external synchronization. Do not use stale issue bodies to dispatch work in the meantime.

## Local verification and reproducibility

Commands run from the repository root; results recorded after execution before committing. Documentation-only scope does not warrant npm install/build/verify:dev under Brief boundary 5. No JS/tooling changed, no app/device/visual tests were run, and no code-test PASS is claimed.

Initial `git diff --check` failed (exit 2) on two newly edited Markdown lines with trailing spaces (Brief/Tracker); those spaces were removed. Because the shell used `&&`, the Python check did not run in that failed attempt. Rerun passed (exit 0): 11 Markdown-only files, 56 local links, all 14 issue IDs and PR31, package/road snapshot, and original R6/R7 prose preservation. No failures were waived.

Final reproducible focused check (run from repository root; works before or after the checkpoint commit):

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
print(f'PASS: 11 Markdown files; {links} local links; 14 issues + PR31; source snapshot; historical prose preserved')
CHECK
```

Final focused run: **exit 0**, `PASS: 11 Markdown files; 56 local links; 14 issues + PR31; source snapshot; historical prose preserved`.

This checks local link targets against the tracked Git tree, not HTTP availability or anchor validity; binaries need not be downloaded. Evidence of live issue states came from direct connector reads, not this syntax check. Complete diff: `git diff e81272a0e3295c942ece8b3d305bc49b0337fbe0 HEAD`; checkpoint identity: `git rev-parse HEAD`; cleanliness: `git status --short`.

Changed files: `AGENTS.md`, `README.md`, `docs/ART_TECH_CO_DESIGN_PRINCIPLES.md`, `docs/COAST_HEROINE_FINAL_PRODUCTION.md`, `docs/COAST_HERO_ASSET_R7_PLAN.md`, `docs/COAST_SCENERY_PRODUCTION_PLAN.md`, `docs/CURRENT_ARCHITECTURE.md`, `docs/DOT_P0_PILOT_BRIEF.md`, `docs/DOT_P0_PILOT_REPORT.md`, `docs/PRODUCTION_PIPELINE_TRACKER.md`, `docs/R5C_30KM_ROAD_DIRECTOR.md`. All are documentation; report is new, the others change authority framing/status only.

## Dot Supervisor Evaluation — pending independent assessment

Builder-observed constraints: bounded branch, local checks, no production/art changes, no paid calls and stopped after P0-1. This is **not** an independent supervisor score. Dot/Julia must assess diff review, correction quality, stop discipline, traceability and communication; supervisor effectiveness cannot be concluded from a documentation commit alone.

Known unknowns: unresolved owner/device evidence in table; C: Blender masters and backups not accessible/verified; global source licensing not assessed; PR #31 integration not code-reviewed; no timing study proves the under-one-minute newcomer criterion. Token/agent cost is not measurable here; no paid services or inference APIs were invoked. Preserve recorded failures and existing release status.

**Exact follow-up:** Julia/Dot independently inspect this local checkpoint and its evidence, request bounded P0-1 corrections if needed, and resolve synchronization scope. Stop until that review; do not start P0-2, P1, P2, further character work, a push or PR.

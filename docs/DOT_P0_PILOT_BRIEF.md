# Dot × Codex — P0 supervision pilot (2026-11-16)

**Status: P0-1 PARTIAL/unsynchronized; P0-2 PASS (technical only); P0-3 PASS (technical scope only); P0-4 task-contract checkpoint awaiting independent review.**

**Current stage checkpoint:** Michael authorized the full P0-1–P0-4 pilot and final Draft PR into dev. Julia independently reviewed P0-2 and accepted its limited metadata/evidence contract as technical PASS, then accepted P0-3’s limited same-machine restore scope and delegated P0-4. Michael directs no modifications to the 14 public Issues; preserve branch-local recommendations and actual approval errors for the full P0 Draft PR review. Stop after P0-4 for independent review; no push, migration, cleanup or P1/P2 work yet. This temporary stage gate does not revoke later pilot authorization. See [checkpoint report](DOT_P0_PILOT_REPORT.md).
**Owner:** Michael. **Art/technical acceptance:** Julia + Michael. **Coordinator:** Dot (once Michael launches the task). **Builder:** Codex.  
**Source of truth:** [Production Pipeline Action Tracker](PRODUCTION_PIPELINE_TRACKER.md), followed by current top directive in \`AGENTS.md\`. This file authorizes only a bounded **P0 pipeline-governance pilot**, not P1/P2 production.

## Purpose / hypothesis

Evaluate whether Dot can act as a *responsible supervisor* for several small Codex tasks: understand requirements, delegate, inspect actual code/diffs/tests, send precise corrections, enforce stop conditions, update status, and present a coherent review package. Do **not** use P0 merely to benchmark how fast Codex writes files. A successful result must improve **governance that actually gets used**, not only add more documentation.

**Product priorities:** racing first, scenic variety second, optional driving minigames later. Preserve the current playable Riviera 62, opponents, stage and heroine. Character body/hair/clothing/facial art is ON HOLD. Do not re-open old R7 issues as the next task. No new game features in this pilot.

## Safety and change boundaries

1. Start from the latest \`dev\`; use one clearly named temporary working branch (suggested \`p0/dot-pipeline-pilot\`, unless that name already exists). Open a **Draft PR into dev** when the work is ready for external review. **No merging** to \`dev\` or \`main\`; no releases/tags. Do not rewrite Git history.
2. Prefer changing docs, asset metadata/validation tooling, and focused tests. Do **not** touch gameplay, handling, art assets, shaders, game scene/runtime code, current playable GLBs, \`package.json\` version or public deployment. Escalate if unavoidable.
3. Do not delete historical screenshots, videos, model files, old issues, review records or PRs; classify first and propose cleanup, to be separately approved. Do not migrate binaries to Git LFS without review. Do not assume local \`.blend\` paths are Git-tracked backups.
4. The no-extra-cost policy has been relaxed, **but no paid service, API inference, asset purchase, subscription, billing change, credential exposure or paid add-on is authorized** in this pilot. Research options only.
5. Codex runs relevant tests **locally before committing**, not repeatedly via GitHub Actions. Build/verify:dev when JS/tooling changes warrant it, otherwise focused tests; preserve pass/fail outputs. Never silently waive failed checks.
6. One active Codex subtask at a time. Maximum **two focused correction passes** per subtask before Dot must record unresolved blockers and stop or explicitly ask for a method decision. No endless autonomous loop. No assumption that green code tests = visual art PASS.
7. Dot must do an **independent review of actual diff and evidence**, not just accept Codex's self-report. Note any disagreement between requirements, code, tests, issue state and docs. If Dot cannot access Codex, local files or GitHub, stop and report exactly which connection/permission is missing; do not pretend to have executed steps.
8. No unauthorized project-scope change. A large unknown, conflicting policy, safety/performance regression, or tool switch should be escalated to Michael/Julia, not "solved" by substituting unrelated code that matches the words of the ticket.

## Ordered experiment: small, reviewable stages

### P0-1 — authority and issue hygiene
**Task:** Read the Tracker and current root AGENTS; inspect key current/historical docs and all open Issues/PRs. Identify stale "CURRENT" instructions, out-of-date versions/road lengths, duplicates, and unresolved approvals. Consolidate the *active* pointers and label older directives historical without wiping valid archival knowledge. Produce an accurate issue disposition table (\`ACTIVE\`, \`HOLD\`, \`SUPERSEDED\`, \`NEEDS_OWNER_REVIEW\`, \`BLOCKED\`), including rationale and next action.
**PASS candidate:** a newcomer starting Codex can identify the actual next task in under a minute; no old R7 clothing order can override the freeze; issue status unknowns explicitly tracked; no issue is closed just for neatness.
**Stop:** no speculative mass cleanup; no unilateral closing/deleting, no changing character release status.

### P0-2 — minimal Asset Manifest + honest validator
**Task:** Specify a small machine-readable source-to-runtime asset record for source artwork (\`.blend\`, artwork, audio project), author/tool, source license/provenance, exported GLB/audio/texture, runtime path, intended downstream abilities (transform/rig/wind/LOD/material etc.), Pipeline level L0–L3, technical/visual/device acceptance and unresolved blockers. Implement one **tiny** validation command with meaningful tests that requires traceable source and prohibits false L3 on **declared production** entries. Use one existing asset as a clearly labeled pilot fixture; do not force all legacy assets to pass a new rule overnight.
**PASS candidate:** a positive and negative test prove the validator rejects an intentionally invalid declared asset; no bogus claim that source file existence equals successful animation or art.
**Stop:** no sweeping asset refactor, no huge generic framework, no touching gameplay.

### P0-3 — editable assets vs ephemeral evidence
**Task:** Inventory what is already in tracked Git, referenced local paths and untracked source masters; note what Dot can **actually verify** vs merely documented. Recommend a reliable plan for versioning final design images, original Blender projects, source audio/music, exports and provenance. Compare Git/Git LFS and asset storage/backups pragmatically; verify potential impact on Vite/Netlify/GitHub Pages before recommending changes. Separate short-lived renders/videos/screenshots and propose an approval-driven cleanup and retention policy.
**PASS candidate:** a practical migration/backup policy and a **non-destructive** trial are reviewable; no missing original assets are misreported as safely backed up.
**Stop:** NO mass upload, deletion, LFS history rewrite or irreversible repository cleanup in this pilot.

### P0-4 — task contract and enforceable gate
**Task:** Provide lightweight RESEARCH/SPIKE vs PRODUCTION templates with goal, game experience relevance, downstream needs, source of truth, tools rationale, stage stop criteria, reproduction command, expected/failed evidence and approval state. Ensure at least one check is mechanically enforceable; use P1 Riviera 62 as an **example task contract**, not a production build.
**PASS candidate:** Dot can state what would block P1 production when the car's editable master, origin/licensing, wheel pivots, material response, GLB export or device performance have not been verified. A small targeted automated test passes and a failure example is shown.
**Stop:** do NOT start P1 car modeling, P2 scenic mass production, or further character work.

## Dot supervision cycle (repeat at every stage)

1. Read latest \`dev\` state + this brief; check if prior subtask changed files/conflicted.
2. Write one narrowly bounded Codex request, clearly marked RESEARCH or PRODUCTION (P0 tasks are generally research/tooling, not new game art).
3. Receive Codex changes; **read files and diff yourself**, check real tests/evidence, verify scope.
4. Return specific review findings and request fixes only for real defects. If unclear/blocked, say so. Limit corrections to two passes.
5. Commit small checkpoint(s) on the pilot branch with evidence and status. Update the Action Tracker *on the pilot branch* so it and the code agree.
6. Move to next subtask only when its **technical criteria** are met or the blocker is recorded and the next step can safely proceed.
7. At the end, create/leave a Draft PR targeting dev, with a final summary and evidence links. **Stop for Julia + Michael review**, do not merge. Do not claim "owner-approved" or "production-ready".

## Final evidence package (required)

Make a compact \`docs/DOT_P0_PILOT_REPORT.md\` on the work branch. Include:

- Starting and ending branch commit SHA; Draft PR, changed files, tests/commands and outputs.
- A P0-1…P0-4 table: \`PASS (technical)\` / \`PARTIAL\` / \`BLOCKED\` / \`NOT STARTED\`, with linked artifacts and precise caveats.
- At least **one substantive independent Dot review**: what Codex proposed, what Dot inspected, what was accepted/rejected, and what changed as a result. If there was genuinely no correction needed, show actual inspection details; do not invent feedback for appearances.
- Outstanding unknowns/uncertain sources, any failed validation, costs (including any Codex/agent usage if measurable), and additional permissions or human decisions required.
- Exact suggested follow-up, **without starting P1**.
- A separate **Dot Supervisor Evaluation**: did it enforce constraints, halt at gate, independently review, preserve tokens, keep work traceable, and communicate unresolved uncertainties? A successful code change alone is not enough.

**Review authority:** Julia and Michael will review the result, including whether this style of Dot supervision should be adopted for later small tasks. Nothing in this pilot authorizes Dot or Codex to approve itself.

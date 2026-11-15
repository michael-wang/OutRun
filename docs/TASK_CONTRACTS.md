# P0-4 — bounded task contracts and prerequisite check

**Tooling checkpoint, awaiting independent review.** These templates govern dispatch records; they do not authorize P1/P2 work. Current Michael instructions, [Tracker](PRODUCTION_PIPELINE_TRACKER.md) and [Brief](DOT_P0_PILOT_BRIEF.md) govern scope. Existing playable assets remain unchanged; character work stays on hold.

## RESEARCH / SPIKE template

- Type / ID / goal: RESEARCH for a question or SPIKE for one explicitly authorized experiment. State one decision to resolve and its game-experience benefit.
- Downstream needs: transforms, animation, replaceability, lighting, reuse, platform performance and source editability that the method must support. Identify unknowns before choosing a tool.
- Source of truth: current authority, exact design/source revisions, author/license/provenance and export mapping; label inaccessible sources UNKNOWN.
- Tool and rationale: why the tool supports those downstream needs; alternatives and limits. A tool substitution, paid call or expansion requires the appropriate method/scope decision.
- Scope / stop: one candidate and bounded experiment; preserve failures. Stop on a large unknown or regression. For this pilot, the Brief allows at most two supervisor-requested correction passes per subtask, regardless of root-cause resolution or method. At two completed passes, stop for independent review and no further correction dispatch. This absolute pilot cap is distinct from the Tracker's future same-method/root-cause policy.
- Commands / expected evidence: exact reproducible commands, tool versions, input/output hashes, success criteria and expected exit values. Commands not yet known are an explicit planning blocker, not invented executed evidence.
- Failed evidence: command/exit, logs, candidate revision, failed images/measurements, cause hypothesis and next decision. Do not delete the failed candidate or silently replace the method.
- Approval states: technical, visual, device and owner separately pending/accepted/rejected with evidence; research findings do not authorize production or release. Stop for independent review.

## PRODUCTION template

Use the same fields, then name the **bounded output and candidate revision**, authorized scope, downstream acceptance protocol and budgets, exact repeatable export/build/device commands, source/export manifest and rollback/preservation plan. Reference independently reviewed evidence for each prerequisite. Record separate technical, visual, device and owner decisions; never infer one from another. Any unknown/failed prerequisite or pending/rejected required approval blocks production dispatch in this example gate. Future exploratory P1 work must be a separately delegated SPIKE, not mislabeled as verified production. Neither this check nor technical PASS permits mass production, merge, release, spending or cleanup.

## Riviera 62 example — not a build assignment

[Machine-readable SPIKE example](../asset-pipeline/riviera62-task.example.json) explicitly sets `exampleOnly: true`. It describes racing relevance, future wheel steer/roll, material response, export replacement and Pixel 8 needs. All six prerequisites are UNKNOWN, all four approvals PENDING; no candidate has been built. Missing editable-master/native reopen proof, provenance/license records, wheel pivot behavior, reviewed paint/glass response, repeatable GLB export and measured device performance each independently block production. Current in-game playability proves none of these DCC production capabilities.

Before a future spike, Julia must specify one representative part, exact native/export reproduction commands, camera/lighting comparisons, wheel transform protocol and Pixel 8 measurement conditions/budgets. Such a spike may gather missing evidence under its own bounded authorization. This P0 example only validates the contract and demonstrates refusal.

```sh
node scripts/check-task-contract.mjs asset-pipeline/riviera62-task.example.json
# exit 0: structurally valid contract, prints PRODUCTION BLOCKED and 12 reasons
node scripts/check-task-contract.mjs asset-pipeline/riviera62-task.example.json --production
# exit 1: refuses the example/type + six unknown requirements + four pending approvals
node --test scripts/test-task-contract.mjs
```

The opt-in checker runs locally before dispatch; it is not wired into game build/CI and does not enforce arbitrary external agent actions. It never executes contract commands. A supervisor must run it and obey the result; this is a real nonzero exit gate, not a prose-only condition. No legacy task enrollment or generic workflow framework is added.

For this deliberately narrow `riviera62-pilot` profile, all six requirement keys and four approval keys are mandatory. A `verified`/`accepted` entry needs a repository-relative JSON receipt and SHA-256. The receipt must name `taskId`, exact `candidate`, `check` (the requirement/approval key), `reviewer`, `observations` and `result`. Requirement receipts must have `result: "pass"`; approval receipts must have `result: "accepted"`. Missing, failed, pending or cross-category outcomes are invalid even with a correct hash. The checker rejects missing/changed files, path escape and mismatched subjects; other states require `evidence: null` with an explanatory note and failure information in `failedEvidence`. `correctionPasses` counts completed supervisor-requested correction passes for the current subtask, not original implementation attempts. At `>= 2`, this pilot profile blocks further dispatch regardless of `rootCauseResolved` (retained as informational only). A passing second correction may still be independently accepted; the block prevents further automated dispatch, not human review. No flag resets or exemptions are implemented; a later general policy needs separate explicit design. Example-only or non-PRODUCTION tasks always fail `--production` even if their records are filled.

This check verifies **record completeness and byte integrity**, not authentic reviewer identity, truthful observations, native editability, license rights, wheel motion, artistic quality or real device measurements. Candidate is an exact revision identifier supplied by the author, not an independently attested asset digest. Reviewers must inspect receipts and source/export hashes and use the [asset manifest](ASSET_MANIFEST_PILOT.md) where applicable. Synthetic positive receipts exist only in temporary test files; they are not asset approval. Clearing this gate merely removes recorded prerequisites, never grants authorization. Windows execution was not tested.

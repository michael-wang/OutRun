# P0-2 opt-in asset manifest

**PRODUCTION/tooling checkpoint — Julia technical PASS only.** This adds a metadata/evidence integrity check, not an asset producer, runtime loader or acceptance authority. No legacy-wide enforcement, CI hook or build dependency is added.

```sh
npm run assets:check
npm run assets:test
# Optional explicit manifest; referenced files remain relative to this repository:
node scripts/validate-asset-manifest.mjs path/to/manifest.json
```

Exit 0 means the declared metadata and referenced bytes meet this limited contract. It does **not** certify visual quality, motion, source editability, license rights, actual device performance, truthful authorship or release approval. The validator does not run Blender, play the game, contact a service or promote an asset’s level. Reports and receipts must still be independently reviewed by Julia/Michael.

## One existing-asset pilot

[Manifest](../asset-pipeline/pilot.json): existing `coast-blonde-r6d.glb`, explicitly `declaration: pilot`, `level: L1`. Its SHA-256 matches the [historical R6d report](art-review/r6d/README.md) and the actual downloaded bytes. The `.blend` is only a documented Windows path: `source.file` is null, not a fabricated hash or backup claim. All acceptance gates remain pending for this traceable-source pipeline assessment; this does not revoke or reinterpret existing hair identity/art decisions. Source licensing and Pixel 8 #45 remain unresolved. No file from the playable asset set was changed.

The recorded Blender tool/author and path are attributed historical information. `export_r6d_locks.py` also depends on earlier R6b/R6c exports; its presence alone is not a verified editable source or reproducible pipeline. No real production/L3 entry is introduced. Positive production/L3 test data is synthetic and exists only in temporary directories during tests.

## Small version-1 contract

Top level: `schemaVersion: 1`, nonempty `assets` array. Only explicitly listed entries are checked; no directory scan, automatic enrollment or network fetch.

| Field | Meaning / check |
| --- | --- |
| `id`, `description` | Unique identity and honest scope label. |
| `declaration` | `pilot` or `production`. Production opts into source/license requirements; it is not a release approval. |
| `level` | L0–L3 claimed pipeline maturity, separate from game functionality. L3 requires production, no blockers, and all four recorded review gates. Lower levels are recorded claims, not automatically awarded capabilities. |
| `source.kind` | `blend`, `artwork`, `audio-project`, or `procedural`. Content/editability is not inferred from kind or suffix. |
| `source.author`, `source.tool`, `source.reportedLocation` | Attribution/tool information and reported location; production rejects explicit unknown placeholders for author/tool. Reported location is never fetched. |
| `source.file` | Repository-relative file + SHA-256, or null for an unverified pilot. Production requires it present and hash-matching. |
| `source.provenance` | Required file + SHA-256 for the source history/report. Human review must check completeness and authenticity. |
| `source.license` | Identifier + evidence reference (file/hash). Pilot may explicitly use UNVERIFIED/null. Production requires known identifier and evidence. This is a record check, not a legal determination. |
| `export` | File + SHA-256 for GLB/audio/texture or other export; bytes must match. |
| `runtimePath` | Repository-relative runtime file; bytes must match the declared export hash. It may be the same file. No loader semantics are inferred. |
| `downstream` | Unique nonempty list of required abilities, e.g. rig, wind, material, LOD or transform. A technical recorded-pass receipt must cover every ability. |
| `acceptance` | Required `technical`, `visual`, `device`, `repeatability` objects, each with status, notes and evidence (reference or null). |
| `blockers` | Explicit list of unresolved problems; any entry forbids L3. Empty does not prove no unknowns exist. |

All file references use `{ "path": "repo/relative/path", "sha256": "64 lowercase hex characters" }`. References must exist inside the repository (including after resolving symlinks); traversal/absolute paths are rejected. No external C: drive or URL is read. To use an external master, a future reviewed storage/retrieval policy must first make the exact source available; that policy is P0-3, not implemented here.

## Exact bytes across Windows and POSIX checkouts

Every SHA-256 is over the raw file bytes, including text. The validator never
normalizes newlines, whitespace, Unicode, or binary data. The pilot's hashed
`docs/art-review/r6d/README.md` is explicitly pinned to `text eol=lf` in
`.gitattributes`, so Git materializes the same bytes with `core.autocrlf=true`
or `false`. Its recorded hash and committed content are unchanged. This rule
does not alter other Markdown or any playable asset. Future Git-tracked text
references must likewise declare their exact checkout representation before
their hashes are recorded; untracked receipts must retain their original bytes.

For an existing checkout, Git may retain the old CRLF file until it is checked
out again. Preserve any local edits first; refresh only that clean path from
the index with the new attributes in effect. Do not change a declared hash to
match a platform conversion or make the validator accept alternate byte forms.

Containment is checked after resolving symlinks, using the native path separator
returned by Node's `path.relative`. Parent traversal and cross-drive absolute
results are rejected before file bytes are read. In-root links remain allowed.
This is validation of a stable local checkout, not a sandbox against concurrent
filesystem mutation between path resolution and reading.

Run `node --test scripts/test-asset-manifest-portability.mjs` for matching-hash
file-symlink and directory-link escapes, allowed in-root links, byte tampering,
and actual Git LF/CRLF checkout coverage. It uses disposable local repositories
without commits or network calls. Symlink creation must be supported; no tests
are skipped to hide missing Windows privileges. See the bounded
[Windows correction evidence](P0_WINDOWS_COMPATIBILITY.md) for execution results.

## Recorded review evidence, not inferred acceptance

Statuses: `pending`, `failed`, `recorded-pass`. Pending/failed entries can retain a hashed evidence file; null explicitly means none recorded. A `recorded-pass` cannot be supported by an arbitrary existing image or a status string alone: it requires a hashed JSON receipt containing:

- `assetId`, `gate` (one of the four gate names), `result: "pass"`.
- `sourceSha256` and `exportSha256` matching the current asset’s exact bytes.
- Named `reviewer`, non-future `reviewedAt` date and nonempty `observations`.
- For technical: `abilities` covering every declared downstream need.
- For device: `device` and `measurements` describing the actual run, not capture frame rate.
- For repeatability: `reproductionCommand` and at least two distinct `runs` records.

These receipts are ordinary review records, not cryptographic signatures, media analysis or proof that a human actually approved anything. A dishonest author could fabricate a self-consistent manifest and receipts: this tool cannot detect that. Independent review must inspect originals, licensing, actual media/device logs and reviewer authority before accepting the claim. The CLI deliberately prints **NOT art, license, device or release certification**, even when a synthetically complete L3 record passes. Do not use a green result to raise the real pilot from L1.

## Verification scope

Node built-ins only; no dependency install, API cost or runtime imports. `assets:test` covers the real pilot/CLI, a clearly synthetic complete production record, missing/tampered source, missing provenance/license, missing gates, naked pass assertions, stale evidence bindings, capability/device/repeatability omissions, blockers, duplicate IDs, malformed input and escaping paths.

The intentional negative CLI test changes a temporary copy of the pilot to production/L3 and expects exit 1 (`production: traceable editable source file required`). This is a successful rejection, not a silently waived test failure. Existing npm build/test/verify:dev commands and all dependencies/versions remain unchanged. Full app build/verify:dev is not warranted for this isolated opt-in Node utility; no runtime/build integration was introduced. Run those if later work connects it to the app or changes existing tooling behavior.


Independent review: Julia inspected the actual manifest, validator, tests, package diff and documentation; reran `assets:check`, `assets:test` (36 pass, negative CLI exit 1) and `git diff --check`. She reported a separate adversarial review of malformed/false-L3/missing-source/path cases with no blocking defect. Acceptance is limited to the technical contract above, not reviewer authentication, native editability, license rights or art/device acceptance. **Portability caveat:** symlink tests may require Windows privileges/Developer Mode; Windows was not tested. No portability PASS is implied.

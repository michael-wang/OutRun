# P0 Windows compatibility correction — local review checkpoint

Michael authorized this separately bounded correction after Julia's initial
review of Draft PR #56. Parent checkpoint is
`4c7e3b634bc52965c0e5d7f16791f290ef25302d`; the original ten commits remain
unchanged ancestors. This correction is local only, pending Julia's independent
diff/evidence review. No push or PR update is part of this handoff.

## Change and integrity rule

- `validate-asset-manifest.mjs` uses Node's native `path.sep` when rejecting a
  resolved relative parent path. Windows `..\outside` and POSIX `../outside`
  are both rejected before reading the resolved target. Cross-drive absolute
  results remain rejected. In-root symlinks still work.
- `.gitattributes` pins only the pilot's hashed provenance Markdown file to
  `text eol=lf`. Its Git blob and manifest SHA-256 remain unchanged:
  `c78b0cda2c9610b1619f3df424103f88cd5d3973eb394d5c3fb27f2ae960c823`.
  The existing clean isolated worktree file was refreshed from a temporary Git
  checkout after verifying its original CRLF hash. Merely running
  `checkout-index --force` in place had retained Git's cached worktree bytes;
  an actual separate checkout produced the required LF bytes.
- SHA-256 continues to cover exact raw bytes for text, receipts and binaries.
  No newline fallback, hash substitution, decoding or content normalization is
  added to the validator. A CRLF edit after checkout still fails integrity.
- Six additional tests exercise real file symlinks/junctions with matching
  outside-target hashes, a sibling sharing the root's name prefix, an allowed
  in-root symlink, text/binary tampering, and real Git checkouts with both
  `core.autocrlf=true, core.eol=crlf` and `false, lf`. An unpinned control file
  actually changes newline bytes while the pinned reference stays identical.
  Temporary test repositories have no commits and use no network.

## Preserved failures

The [original pilot report](DOT_P0_PILOT_REPORT.md) and PR #56 retain historical
Linux results, P0-1 PARTIAL, the Issue denials and both P0-4 correction passes.
They are not rewritten into a Windows PASS.

The initial Windows recovery ran 50 focused tests: 45 passed / 5 failed.
Default CRLF checkout changed the provenance SHA-256 to
`cfd82c028be237430d116fe50aef9fde29e273a416f71539d4a23fef90ced77d`.
With exact committed provenance bytes, assets were 34/36: the symlink subtest
and parent failed because containment fell through to a hash mismatch.

Before this correction, [the expanded regression run](p0-windows/before.json)
exited 1: 42 tests, 34 passed, 8 failed, none skipped. The matching-hash file
symlink was incorrectly accepted (`errors: []`). The directory-junction test
could not create its junction inside the Codex sandbox (`EPERM`), and the
checkout test failed because the new `.gitattributes` did not yet exist.
The remaining failures reproduced the original CRLF/containment defects.

After the code/config change, sandboxed assets were 36/36 and contracts 14/14;
portability was 5/6 solely because directory-junction creation returned EPERM.
Scoped local execution was then approved to test real native Windows junctions.
No test was skipped or assertion relaxed. This was an execution-environment
limitation, not an automatic approval denial or an ignored validator failure.

## Actual Windows results

Executed on Windows with Node **v24.21.0**. All commands below completed before
the additive correction commit; full TAP output is preserved alongside this file.

| Command | Exit | Tests | Pass | Fail | Skip | Exact output |
| --- | --- | --- | --- | --- | --- | --- |
| `node --test --test-reporter=tap scripts/test-asset-manifest.mjs` | 0 | 36 | 36 | 0 | 0 | [assets.tap](p0-windows/assets.tap) |
| `node --test --test-reporter=tap scripts/test-asset-manifest-portability.mjs` | 0 | 6 | 6 | 0 | 0 | [portability.tap](p0-windows/portability.tap) |
| `node --test --test-reporter=tap scripts/test-task-contract.mjs` | 0 | 14 | 14 | 0 | 0 | [contracts.tap](p0-windows/contracts.tap) |

The manifest CLI exits 0 with its existing source/license/device caveats. The
example production CLI still exits 1 with 12 blockers. Both changed/new Node
scripts pass `node --check`. The staged `git diff --check` initially reported
trailing spaces in the failed TAP diagnostic's indented blank lines; that raw
output is preserved in a JSON string instead of trimming evidence or changing
whitespace rules. The final staged whitespace check passes. These are record checks,
not actual capability, approval or release certification.

## Portability and review limits

Linux execution was **not performed** in this Windows task. Static inspection
confirms `path.relative` and `path.sep` use the same platform convention, and
the LF attribute is standard Git behavior. Actual Git LF and CRLF mode checkouts
were tested on Windows; that is not a Linux runtime test. The directory-link
test uses a junction on Windows and a directory symlink on POSIX. Symlink
creation failures remain test failures rather than skips.

No dependency install, full game build, browser/device/art acceptance, backup
trial or deployment was run: the correction is limited to opt-in Node tooling,
its tests and checkout documentation/configuration. The validator still assumes
a stable local filesystem; it is not an OS sandbox against concurrent path
replacement. Original checkout files, dev/main, Issues, gameplay/assets,
P0-4 logic, package version/dependencies and P1/P2 remain unchanged.

Julia must independently inspect the actual correction diff and evidence before
authorizing the next delivery step. No independent acceptance is self-awarded.

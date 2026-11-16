import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateManifest} from './validate-asset-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pilot = JSON.parse(readFileSync(join(root, 'asset-pipeline/pilot.json'), 'utf8'));
const script = join(root, 'scripts/validate-asset-manifest.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// Synthetic bytes/receipts, never evidence for the real pilot or an actual L3 asset.
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'outrun-asset-test-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const put = (path, bytes) => {
    writeFileSync(join(dir, path), bytes);
    return {path, sha256: sha(bytes)};
  };
  const asset = structuredClone(pilot.assets[0]);
  asset.id = 'synthetic-test-only';
  asset.description = 'Synthetic validation test, not a real production asset';
  asset.declaration = 'production'; asset.level = 'L3'; asset.blockers = [];
  asset.source = {kind: 'procedural', file: put('source.mjs', '// Synthetic editable source\n'),
    reportedLocation: 'source.mjs', author: 'Test author', tool: 'Node test fixture',
    provenance: put('origin.txt', 'Synthetic fixture created by this test; not real art provenance'),
    license: {identifier: 'CC0-1.0', evidence: put('license.txt', 'Synthetic licensing test data only')}};
  asset.export = put('export.glb', 'Synthetic export bytes; no actual GLB is implied');
  asset.runtimePath = 'export.glb';
  const receipts = {};
  for (const gate of Object.keys(asset.acceptance)) {
    receipts[gate] = {assetId: asset.id, gate, result: 'pass', sourceSha256: asset.source.file.sha256,
      exportSha256: asset.export.sha256, reviewer: 'Synthetic reviewer', reviewedAt: '2026-01-01T00:00:00Z',
      observations: 'Synthetic review receipt for testing reference integrity only',
      abilities: [...asset.downstream], device: 'Synthetic device', measurements: 'Synthetic measurement record',
      reproductionCommand: 'synthetic export command', runs: ['synthetic-run-1', 'synthetic-run-2']};
    asset.acceptance[gate] = {status: 'recorded-pass', notes: 'Synthetic receipt, not human approval',
      evidence: put(`${gate}.json`, JSON.stringify(receipts[gate]))};
  }
  return {dir, asset, receipts, put, check: () => validateManifest({schemaVersion: 1, assets: [asset]}, dir)};
}

test('existing opt-in pilot is valid with explicit source/device/license gaps and warnings', () => {
  const result = validateManifest(pilot, root);
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join('\n'), /acceptance incomplete/);
  assert.equal(pilot.assets[0].level, 'L1');
  assert.equal(pilot.assets[0].source.file, null);
});

test('complete synthetic production record passes structural validation, not art certification', t => {
  assert.deepEqual(fixture(t).check().errors, []);
});

test('promoting the real pilot to production without editable source is rejected', () => {
  const input = structuredClone(pilot); input.assets[0].declaration = 'production';
  assert.match(validateManifest(input, root).errors.join('\n'), /production: traceable editable source/);
});

test('missing/changed source or export bytes cannot satisfy traceability', async t => {
  for (const which of ['source', 'export']) await t.test(which, sub => {
    const f = fixture(sub);
    writeFileSync(join(f.dir, which === 'source' ? 'source.mjs' : 'export.glb'), 'changed after review');
    assert.match(f.check().errors.join('\n'), /SHA-256 mismatch/);
  });
  await t.test('missing source', sub => {
    const f = fixture(sub); rmSync(join(f.dir, 'source.mjs'));
    assert.match(f.check().errors.join('\n'), /ENOENT/);
  });
});

test('production cannot use unknown licensing or omit provenance', async t => {
  await t.test('license unresolved', sub => {
    const f = fixture(sub); f.asset.source.license.identifier = 'UNVERIFIED';
    assert.match(f.check().errors.join('\n'), /production: license/);
  });
  await t.test('provenance missing', sub => {
    const f = fixture(sub); f.asset.source.provenance = null;
    assert.match(f.check().errors.join('\n'), /source provenance/);
  });
});

test('L3 needs every gate and cannot retain unresolved blockers', async t => {
  for (const gate of ['technical', 'visual', 'device', 'repeatability']) await t.test(gate, sub => {
    const f = fixture(sub); f.asset.acceptance[gate] = {status: 'pending', notes: 'not reviewed', evidence: null};
    assert.match(f.check().errors.join('\n'), /L3:.*review receipts required/);
  });
  await t.test('unresolved blocker', sub => {
    const f = fixture(sub); f.asset.blockers.push('Device regression unresolved');
    assert.match(f.check().errors.join('\n'), /L3: unresolved blockers/);
  });
});

test('a recorded-pass assertion without a receipt is rejected', t => {
  const f = fixture(t); f.asset.acceptance.visual.evidence = null;
  assert.match(f.check().errors.join('\n'), /visual receipt/);
});

test('receipt for another asset/source/export/gate cannot be reused even with a matching file hash', async t => {
  for (const key of ['assetId', 'sourceSha256', 'exportSha256', 'gate', 'result']) await t.test(key, sub => {
    const f = fixture(sub); f.receipts.visual[key] = 'wrong';
    f.asset.acceptance.visual.evidence = f.put('visual.json', JSON.stringify(f.receipts.visual));
    assert.match(f.check().errors.join('\n'), /visual: receipt/);
  });
});

test('L3 cannot omit required abilities, device measurements or repeated runs', async t => {
  for (const [gate, field, value] of [['technical', 'abilities', []], ['device', 'measurements', ''], ['repeatability', 'runs', ['same', 'same']]]) await t.test(gate, sub => {
    const f = fixture(sub); f.receipts[gate][field] = value;
    f.asset.acceptance[gate].evidence = f.put(`${gate}.json`, JSON.stringify(f.receipts[gate]));
    assert.notDeepEqual(f.check().errors, []);
  });
});

test('receipt needs a named reviewer and a review date in the past', async t => {
  for (const [key, value] of [['reviewer', 'unknown'], ['reviewedAt', '2999-01-01T00:00:00Z']]) await t.test(key, sub => {
    const f = fixture(sub); f.receipts.visual[key] = value;
    f.asset.acceptance.visual.evidence = f.put('visual.json', JSON.stringify(f.receipts.visual));
    assert.match(f.check().errors.join('\n'), /named reviewer/);
  });
});

test('runtime path must point to the same exported bytes', t => {
  const f = fixture(t); f.put('different.glb', 'different'); f.asset.runtimePath = 'different.glb';
  assert.match(f.check().errors.join('\n'), /runtime export: SHA-256 mismatch/);
});

test('reference paths cannot escape the root through traversal or symlinks', async t => {
  for (const mode of ['traversal', 'symlink']) await t.test(mode, sub => {
    const f = fixture(sub);
    if (mode === 'traversal') f.asset.export.path = '../outside.glb';
    else { symlinkSync(join(root, 'package.json'), join(f.dir, 'escape')); f.asset.export.path = 'escape'; }
    assert.match(f.check().errors.join('\n'), /path (required|escapes)|repository-relative/);
  });
});

test('malformed schema, duplicate identities and invalid level fail without a crash', t => {
  assert.notDeepEqual(validateManifest(null).errors, []);
  const f = fixture(t);
  assert.match(validateManifest({schemaVersion: 1, assets: [f.asset, f.asset]}, f.dir).errors.join('\n'), /unique id/);
  f.asset.level = 'L4'; assert.match(f.check().errors.join('\n'), /level/);
});

test('real CLI succeeds with caveats and exits nonzero for deliberately invalid production promotion', t => {
  const good = spawnSync(process.execPath, [script], {cwd: root, encoding: 'utf8'});
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /NOT art, license, device or release certification/);
  const dir = mkdtempSync(join(tmpdir(), 'outrun-asset-cli-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const invalid = structuredClone(pilot); invalid.assets[0].declaration = 'production'; invalid.assets[0].level = 'L3';
  const path = join(dir, 'invalid.json'); writeFileSync(path, JSON.stringify(invalid));
  const bad = spawnSync(process.execPath, [script, path], {cwd: root, encoding: 'utf8'});
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /INVALID r6d-hair-pilot: production: traceable editable source file required/);
  console.log('Expected negative CLI exit=1:', bad.stderr.trim());
});

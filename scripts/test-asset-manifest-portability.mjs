import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateManifest} from './validate-asset-manifest.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pilot = JSON.parse(readFileSync(join(repo, 'asset-pipeline/pilot.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'outrun-portability-'));
  t.after(() => rmSync(dir, {recursive: true, force: true}));
  const root = join(dir, 'root'); mkdirSync(root);
  const asset = structuredClone(pilot.assets[0]);
  const origin = Buffer.from('Synthetic provenance\n');
  const bytes = Buffer.from([0, 13, 10, 255, 10, 13, 1]);
  writeFileSync(join(root, 'origin.txt'), origin);
  writeFileSync(join(root, 'export.glb'), bytes);
  asset.source.provenance = {path: 'origin.txt', sha256: sha(origin)};
  asset.export = {path: 'export.glb', sha256: sha(bytes)};
  asset.runtimePath = 'export.glb';
  return {dir, root, asset, origin, bytes,
    check: () => validateManifest({schemaVersion: 1, assets: [asset]}, root)};
}

test('outside-root file symlink is rejected even when target bytes match the declared hash', t => {
  const f = fixture(t);
  writeFileSync(join(f.dir, 'outside.glb'), f.bytes);
  symlinkSync(join(f.dir, 'outside.glb'), join(f.root, 'escape'), 'file');
  f.asset.export.path = 'escape';
  assert.match(f.check().errors.join('\n'), /export: path escapes repository/);
});

test('directory link to a sibling with the same root prefix is rejected', t => {
  const f = fixture(t);
  const sibling = join(f.dir, 'root-sibling'); mkdirSync(sibling);
  writeFileSync(join(sibling, 'export.glb'), f.bytes);
  symlinkSync(sibling, join(f.root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  f.asset.export.path = 'escape/export.glb';
  assert.match(f.check().errors.join('\n'), /export: path escapes repository/);
});

test('in-root file symlink remains valid', t => {
  const f = fixture(t);
  symlinkSync(join(f.root, 'export.glb'), join(f.root, 'alias'), 'file');
  f.asset.export.path = 'alias';
  assert.deepEqual(f.check().errors, []);
});

test('text hash stays byte-exact: CRLF substitution and content tampering are rejected', t => {
  const f = fixture(t);
  assert.deepEqual(f.check().errors, []);
  for (const bytes of ['Synthetic provenance\r\n', 'Changed provenance\n']) {
    writeFileSync(join(f.root, 'origin.txt'), bytes);
    assert.match(f.check().errors.join('\n'), /source provenance: SHA-256 mismatch/);
  }
});

test('binary CRLF bytes are not normalized and a single-byte mutation is rejected', t => {
  const f = fixture(t);
  assert.deepEqual(f.check().errors, []);
  const changed = Buffer.from(f.bytes); changed[1] = 10;
  writeFileSync(join(f.root, 'export.glb'), changed);
  assert.match(f.check().errors.join('\n'), /export: SHA-256 mismatch/);
});

test('actual Git LF and CRLF checkouts keep pinned provenance bytes and hash identical', t => {
  const f = fixture(t);
  const path = pilot.assets[0].source.provenance.path;
  // Test input only: construct canonical LF bytes; the validator never normalizes.
  const canonical = Buffer.from(readFileSync(join(repo, path), 'utf8').replaceAll('\r\n', '\n'));
  assert.equal(sha(canonical), pilot.assets[0].source.provenance.sha256);
  const git = (...args) => {
    const result = spawnSync('git', args, {cwd: f.dir, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout;
  };
  git('init', '--quiet');
  writeFileSync(join(f.dir, '.gitattributes'), readFileSync(join(repo, '.gitattributes')));
  mkdirSync(dirname(join(f.dir, path)), {recursive: true});
  writeFileSync(join(f.dir, path), canonical);
  writeFileSync(join(f.dir, 'control.txt'), 'Unpinned control\n');
  git('-c', 'core.autocrlf=input', 'add', '--', '.gitattributes', path, 'control.txt');
  for (const [mode, eol, expectedControl] of [['true', 'crlf', 'Unpinned control\r\n'], ['false', 'lf', 'Unpinned control\n']]) {
    const out = join(f.dir, `checkout-${mode}`);
    git('-c', `core.autocrlf=${mode}`, '-c', `core.eol=${eol}`, 'checkout-index', '--all', `--prefix=${out.replaceAll('\\', '/')}/`);
    const actual = readFileSync(join(out, path));
    assert.deepEqual(actual, canonical);
    assert.equal(sha(actual), pilot.assets[0].source.provenance.sha256);
    assert.equal(readFileSync(join(out, 'control.txt'), 'utf8'), expectedControl);
    writeFileSync(join(out, 'export.glb'), f.bytes);
    f.asset.source.provenance = {path, sha256: sha(canonical)};
    assert.deepEqual(validateManifest({schemaVersion: 1, assets: [f.asset]}, out).errors, []);
  }
});

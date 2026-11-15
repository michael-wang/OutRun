/** Opt-in metadata/evidence gate only. Never certifies art, licensing or device performance. */
import {readFileSync, realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, relative, isAbsolute, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const gates = ['technical', 'visual', 'device', 'repeatability'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const known = value => text(value) && !/^(unknown|unverified|pending|tbd|n\/a)$/i.test(value.trim());
const strings = value => Array.isArray(value) && value.every(text);
const require = (condition, message) => { if (!condition) throw new Error(message); };

function readRef(ref, root, label) {
  require(object(ref) && text(ref.path) && /^[a-f0-9]{64}$/.test(ref.sha256), `${label}: path and lowercase SHA-256 required`);
  require(!isAbsolute(ref.path) && !ref.path.includes('\\') && !ref.path.split('/').includes('..'), `${label}: repository-relative path required`);
  const file = realpathSync(resolve(root, ref.path));
  const rel = relative(realpathSync(root), file);
  require(rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel), `${label}: path escapes repository`);
  const bytes = readFileSync(file);
  require(digest(bytes) === ref.sha256, `${label}: SHA-256 mismatch`);
  return bytes;
}

export function validateManifest(manifest, root = repoRoot) {
  const errors = [], warnings = [];
  if (!object(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets) || !manifest.assets.length) {
    return {errors: ['schemaVersion 1 and a nonempty assets array required'], warnings};
  }
  const ids = new Set();
  for (const asset of manifest.assets) {
    const id = asset?.id ?? '<missing id>';
    try {
      require(object(asset) && text(id) && id !== '<missing id>' && !ids.has(id), 'unique id required');
      ids.add(id);
      require(text(asset.description), 'description required');
      require(['pilot', 'production'].includes(asset.declaration), 'declaration must be pilot or production');
      require(['L0', 'L1', 'L2', 'L3'].includes(asset.level), 'level must be L0–L3');
      require(strings(asset.downstream) && asset.downstream.length > 0 && new Set(asset.downstream).size === asset.downstream.length, 'unique downstream abilities required');
      require(strings(asset.blockers), 'blockers array required');
      const source = asset.source;
      require(object(source) && text(source.author) && text(source.tool) && text(source.reportedLocation), 'source author/tool/reportedLocation required');
      require(['blend', 'artwork', 'audio-project', 'procedural'].includes(source.kind), 'source kind required');
      readRef(source.provenance, root, 'source provenance');
      require(object(source.license) && text(source.license.identifier), 'source license identifier required (UNVERIFIED allowed only for pilot)');
      if (source.file !== null) readRef(source.file, root, 'editable source');
      if (source.license.evidence !== null) readRef(source.license.evidence, root, 'license evidence');
      readRef(asset.export, root, 'export');
      readRef({path: asset.runtimePath, sha256: asset.export.sha256}, root, 'runtime export');
      require(object(asset.acceptance), 'acceptance records required');
      for (const gate of gates) {
        const record = asset.acceptance[gate];
        require(object(record) && ['pending', 'failed', 'recorded-pass'].includes(record.status) && text(record.notes), `${gate}: status and notes required`);
        if (record.status !== 'recorded-pass') {
          if (record.evidence !== null) readRef(record.evidence, root, `${gate} evidence`);
          continue;
        }
        // A receipt is a review record bound to exact bytes, not machine proof of its claims.
        require(source.file !== null, `${gate}: recorded-pass requires traceable source`);
        const receipt = JSON.parse(readRef(record.evidence, root, `${gate} receipt`).toString('utf8'));
        require(object(receipt) && receipt.assetId === id && receipt.gate === gate && receipt.result === 'pass', `${gate}: receipt identity/gate/result mismatch`);
        require(receipt.sourceSha256 === source.file.sha256 && receipt.exportSha256 === asset.export.sha256, `${gate}: receipt is not bound to current source/export`);
        require(known(receipt.reviewer) && text(receipt.reviewedAt) && Number.isFinite(Date.parse(receipt.reviewedAt)) && Date.parse(receipt.reviewedAt) <= Date.now(), `${gate}: named reviewer and non-future review time required`);
        require(text(receipt.observations), `${gate}: review observations required`);
        if (gate === 'technical') require(strings(receipt.abilities) && asset.downstream.every(a => receipt.abilities.includes(a)), 'technical: receipt must cover every downstream ability');
        if (gate === 'device') require(known(receipt.device) && text(receipt.measurements), 'device: named device and measurements required');
        if (gate === 'repeatability') require(text(receipt.reproductionCommand) && strings(receipt.runs) && new Set(receipt.runs).size >= 2, 'repeatability: command and two distinct run records required');
      }
      if (asset.declaration === 'production') {
        require(source.file !== null, 'production: traceable editable source file required');
        require(known(source.author) && known(source.tool), 'production: known author/tool required');
        require(known(source.license.identifier) && source.license.evidence !== null, 'production: license identification and evidence required');
      } else {
        require(asset.level !== 'L3', 'L3 requires a production declaration and its gates');
        warnings.push(`${id}: pilot only; excluded legacy assets are not assessed`);
      }
      if (asset.level === 'L3') {
        require(asset.blockers.length === 0, 'L3: unresolved blockers forbid readiness declaration');
        require(gates.every(g => asset.acceptance[g].status === 'recorded-pass'), 'L3: technical, visual, device and repeatability review receipts required');
      }
      if (asset.blockers.length) warnings.push(`${id}: blockers: ${asset.blockers.join('; ')}`);
      if (gates.some(g => asset.acceptance[g].status !== 'recorded-pass')) warnings.push(`${id}: acceptance incomplete; no release readiness established`);
    } catch (error) { errors.push(`${id}: ${error.message}`); }
  }
  return {errors, warnings};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    require(process.argv.length <= 3, 'usage: node scripts/validate-asset-manifest.mjs [manifest.json]');
    const file = process.argv[2] ? resolve(process.argv[2]) : resolve(repoRoot, 'asset-pipeline/pilot.json');
    const result = validateManifest(JSON.parse(readFileSync(file, 'utf8')));
    for (const warning of result.warnings) console.log(`NOTE ${warning}`);
    for (const error of result.errors) console.error(`INVALID ${error}`);
    process.exitCode = result.errors.length ? 1 : 0;
    if (!result.errors.length) console.log('VALID metadata/evidence references only — NOT art, license, device or release certification.');
  } catch (error) { console.error(`INVALID ${error.message}`); process.exitCode = 1; }
}

/** Opt-in P1 example contract gate: checks records, never executes their commands. */
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
export const requirements = ['editableMaster', 'provenanceLicense', 'wheelPivots', 'materials', 'glbExport', 'devicePerformance'];
export const approvals = ['technical', 'visual', 'device', 'owner'];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = v => typeof v === 'string' && v.trim().length > 0;
function need(ok, message) { if (!ok) throw new Error(message); }
function strings(v, key) { need(Array.isArray(v) && v.length > 0 && v.every(text), `${key}: nonempty text list required`); }
function receipt(ref, base, contract, key, expectedResult) {
  need(ref && text(ref.path) && /^[a-f0-9]{64}$/.test(ref.sha256), `${key}: hashed receipt required`);
  need(!isAbsolute(ref.path), `${key}: relative receipt path required`);
  const path = realpathSync(resolve(base, ref.path));
  const rel = relative(realpathSync(base), path);
  need(rel !== '..' && !rel.startsWith('..' + '/') && !rel.startsWith('..' + '\\') && !isAbsolute(rel), `${key}: receipt escapes root`);
  const bytes = readFileSync(path);
  need(createHash('sha256').update(bytes).digest('hex') === ref.sha256, `${key}: receipt hash mismatch`);
  const r = JSON.parse(bytes);
  need(r.taskId === contract.id && r.candidate === contract.candidate && r.check === key,
    `${key}: receipt subject mismatch`);
  need(r.result === expectedResult, `${key}: receipt result must be ${expectedResult}`);
  need(text(r.reviewer) && text(r.observations), `${key}: reviewer and observations required`);
}
export function checkCorrectionDispatch(c, base = root) {
  checkContract(c, base); // Validate records/receipts, but production prerequisites are a separate decision.
  const blockers = c.exampleOnly ? ['example only; not an executable correction assignment'] : [];
  if (c.correctionPasses > 2) blockers.push('pilot correction count violation: more than two passes');
  else if (c.correctionPasses === 2) blockers.push('third correction prohibited: two passes already completed');
  return blockers;
}
export function checkContract(c, base = root) {
  need(c && c.schemaVersion === 1 && c.profile === 'riviera62-pilot', 'unsupported contract schema/profile');
  for (const key of ['id', 'goal', 'gameRelevance', 'candidate', 'toolRationale']) need(text(c[key]), `${key}: text required`);
  need(['RESEARCH', 'SPIKE', 'PRODUCTION'].includes(c.type), 'invalid task type');
  need(typeof c.exampleOnly === 'boolean', 'exampleOnly: boolean required');
  for (const key of ['downstream', 'sourceOfTruth', 'stopCriteria', 'commands', 'expectedEvidence', 'failedEvidence']) strings(c[key], key);
  need(Number.isInteger(c.correctionPasses) && c.correctionPasses >= 0, 'correctionPasses: nonnegative integer required');
  need(typeof c.rootCauseResolved === 'boolean', 'rootCauseResolved: boolean required');
  need(['pending', 'accepted', 'rejected'].includes(c.independentReview), 'independentReview: valid state required');
  const blockers = [];
  if (c.exampleOnly) blockers.push('example only; not an executable production assignment');
  if (c.type !== 'PRODUCTION') blockers.push(`task type ${c.type}; production not requested`);
  if (c.correctionPasses > 2) blockers.push('pilot correction count violation: more than two passes');
  else if (c.correctionPasses === 2 && (!c.rootCauseResolved || c.independentReview !== 'accepted'))
    blockers.push('two passes completed: unresolved findings or independent review/method decision required');
  for (const [group, keys, states, ready] of [
    ['requirements', requirements, ['unknown', 'failed', 'verified'], 'verified'],
    ['approvals', approvals, ['pending', 'rejected', 'accepted'], 'accepted'],
  ]) {
    need(c[group] && Object.keys(c[group]).sort().join() === [...keys].sort().join(), `${group}: exact required keys missing/extra`);
    for (const key of keys) {
      const row = c[group][key];
      need(row && states.includes(row.state) && text(row.note), `${key}: valid state and note required`);
      if (row.state === ready) receipt(row.evidence, base, c, key, group === 'requirements' ? 'pass' : 'accepted');
      else { need(row.evidence === null, `${key}: unverified evidence must be null; describe failures in failedEvidence`); blockers.push(`${key}: ${row.state}`); }
    }
  }
  return blockers;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    need(args.length <= 2 && (args.length < 2 || ['--production', '--correction'].includes(args[1])), 'usage: node scripts/check-task-contract.mjs [contract.json] [--production|--correction]');
    const c = JSON.parse(readFileSync(resolve(root, args[0] || 'asset-pipeline/riviera62-task.example.json'), 'utf8'));
    const correction = args[1] === '--correction';
    const blockers = correction ? checkCorrectionDispatch(c) : checkContract(c);
    console.log('VALID contract records only — NOT verified capability, approval authentication or execution authorization.');
    console.log(blockers.length ? `${correction ? 'CORRECTION' : 'PRODUCTION'} BLOCKED:\n- ${blockers.join('\n- ')}` : 'Requested record prerequisites present; no execution authorization granted.');
    if (['--production', '--correction'].includes(args[1]) && blockers.length) process.exitCode = 1;
  } catch (error) { console.error(`INVALID: ${error.message}`); process.exitCode = 1; }
}

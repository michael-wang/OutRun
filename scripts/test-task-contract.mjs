import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkContract, requirements, approvals } from './check-task-contract.mjs';
const example = JSON.parse(readFileSync(new URL('../asset-pipeline/riviera62-task.example.json', import.meta.url)));
const clone = () => structuredClone(example);
// Synthetic receipts are test data only; never a real P1 acceptance.
const dir = mkdtempSync(join(tmpdir(), 'outrun-task-contract-test-'));
function complete() {
  const c = clone(); c.exampleOnly = false; c.type = 'PRODUCTION';
  c.candidate = 'synthetic-test-revision';
  for (const [group, keys, state] of [['requirements', requirements, 'verified'], ['approvals', approvals, 'accepted']]) {
    for (const key of keys) {
      const bytes = JSON.stringify({taskId:c.id, candidate:c.candidate, check:key, result:group === 'requirements' ? 'pass' : 'accepted', reviewer:'TEST ONLY', observations:'Synthetic record; no real asset reviewed.'});
      writeFileSync(join(dir, key + '.json'), bytes);
      c[group][key] = {state, note:'Synthetic test', evidence:{path:key + '.json', sha256:createHash('sha256').update(bytes).digest('hex')}};
    }
  }
  return c;
}
test('valid spike lists every missing capability/approval without authorizing production', () => {
  const blockers = checkContract(clone());
  assert.equal(blockers.length, 12);
  for (const key of [...requirements, ...approvals]) assert.ok(blockers.some(x => x.startsWith(key + ':')));
});
test('synthetic complete records pass the mechanical prerequisite check only', () => assert.deepEqual(checkContract(complete(), dir), []));
test('each unknown or failed requirement blocks even with other records complete', () => {
  for (const key of requirements) for (const state of ['unknown','failed']) {
    const c=complete(); c.requirements[key]={state,note:'Missing proof',evidence:null};
    assert.deepEqual(checkContract(c,dir),[`${key}: ${state}`]);
  }
});
test('each pending or rejected approval blocks', () => {
  for (const key of approvals) for (const state of ['pending','rejected']) {
    const c=complete(); c.approvals[key]={state,note:'Not accepted',evidence:null};
    assert.deepEqual(checkContract(c,dir),[`${key}: ${state}`]);
  }
});
test('pilot maximum two passes blocks regardless of resolved root cause', () => {
  for (const count of [2,3]) for (const resolved of [true,false]) {
    const c=complete(); c.correctionPasses=count; c.rootCauseResolved=resolved;
    assert.match(checkContract(c,dir).join(), /pilot correction limit/);
  }
  for (const count of [0,1]) {
    const c=complete(); c.correctionPasses=count;
    assert.deepEqual(checkContract(c,dir),[]);
  }
});
test('each receipt rejects failed, missing or incompatible outcomes despite matching hash', () => {
  for (const [group,keys] of [['requirements',requirements],['approvals',approvals]]) {
    for (const key of keys) for (const result of ['failed',undefined,'pending',group === 'requirements' ? 'accepted' : 'pass']) {
      const c=complete(); const ref=c[group][key].evidence;
      const row=JSON.parse(readFileSync(join(dir,ref.path),'utf8'));
      if(result === undefined) delete row.result; else row.result=result;
      const bytes=JSON.stringify(row);
      writeFileSync(join(dir,ref.path),bytes);
      ref.sha256=createHash('sha256').update(bytes).digest('hex');
      assert.throws(()=>checkContract(c,dir),/receipt result/, `${key}: ${result}`);
    }
  }
});
test('example and research flags cannot be promoted just by filling records', () => {
  const c=complete(); c.exampleOnly=true; c.type='RESEARCH';
  assert.equal(checkContract(c,dir).length,2);
});
test('naked verified assertion is rejected', () => {
  const c=complete(); c.requirements.editableMaster.evidence=null;
  assert.throws(()=>checkContract(c,dir),/hashed receipt/);
});
test('changed bytes, missing file, wrong subject and escaping path rejected', () => {
  for (const kind of ['hash','missing','subject','escape','relativeEscape']) {
    const c=complete(); const ref=c.requirements.editableMaster.evidence;
    if(kind==='hash') ref.sha256='0'.repeat(64);
    if(kind==='missing') ref.path='absent.json';
    if(kind==='subject') c.candidate='other revision';
    if(kind==='escape') ref.path=resolve(dir,'editableMaster.json');
    if(kind==='relativeEscape') {
      const outside=mkdtempSync(join(tmpdir(),'outrun-task-outside-'));
      writeFileSync(join(outside,'receipt.json'),'{}');
      ref.path='../'+outside.split(/[\\/]/).at(-1)+'/receipt.json';
    }
    assert.throws(()=>checkContract(c,dir));
  }
});
test('missing fields, invalid states and correction counters rejected', () => {
  const mutations=[c=>delete c.requirements.wheelPivots,c=>c.requirements.materials.state='pass',c=>c.commands=[],c=>c.goal=' ',c=>c.correctionPasses=-1,c=>c.correctionPasses=1.5,c=>c.exampleOnly='false',c=>c.type='BUILD',c=>c.rootCauseResolved='true'];
  for(const mutate of mutations){const c=clone();mutate(c);assert.throws(()=>checkContract(c));}
});
test('CLI validates example but production command fails with all blockers', () => {
  const script = new URL('./check-task-contract.mjs',import.meta.url);
  for(const production of [false,true]) {
    const args=[fileURLToPath(script),'asset-pipeline/riviera62-task.example.json',...(production?['--production']:[])];
    const r=spawnSync(process.execPath,args,{encoding:'utf8'});
    assert.equal(r.status,production?1:0,r.stderr);
    assert.match(r.stdout,/PRODUCTION BLOCKED/);
    for(const key of [...requirements,...approvals]) assert.ok(r.stdout.includes(key+':'));
  }
});

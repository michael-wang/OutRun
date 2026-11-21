import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditSourceCustody} from './audit-source-custody.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{stdio:'ignore'});
function fixture(fn,{commitSource=true}={}){
 const root=mkdtempSync(join(tmpdir(),'outrun-custody-git-'));
 try{
  mkdirSync(join(root,'public/assets'),{recursive:true});
  mkdirSync(join(root,'art/source/characters'),{recursive:true});
  mkdirSync(join(root,'scripts'),{recursive:true});
  writeFileSync(join(root,'public/assets/hair.glb'),'GAME-EXPORT');
  writeFileSync(join(root,'art/source/characters/hair.blend'),'EDITABLE-SOURCE');
  writeFileSync(join(root,'scripts/export.py'),'print(1)');
  git(root,'init','-q');
  git(root,'add','--','public/assets/hair.glb','scripts/export.py');
  if(commitSource)git(root,'add','--','art/source/characters/hair.blend');
  git(root,'-c','user.name=Custody Test','-c','user.email=test@example.invalid','commit','-q','-m','fixture');
  const record={
   id:'hair',runtimeExport:{path:'public/assets/hair.glb',sha256:hash('GAME-EXPORT')},
   editableSource:{kind:'blend',path:'art/source/characters/hair.blend',sha256:hash('EDITABLE-SOURCE')},
   exportRecipe:'scripts/export.py'
  };
  fn({record,root,master:join(root,'art/source/characters/hair.blend')});
 }finally{rmSync(root,{recursive:true,force:true});}
}

test('passes byte and Git HEAD checks when source, exporter and GLB are committed',()=>{
 fixture(({record,root})=>{
  const r=auditSourceCustody(record,{root});
  assert.equal(r.exportOK,true);
  assert.equal(r.sourceOK,true);
  assert.equal(r.gitCommittedOK,true);
  assert.deepEqual(r.gaps,[]);
  assert.match(r.notes.join(' '),/verify actual origin\/dev/);
 });
});

test('untracked Blender source cannot pass even when file SHA-256 matches',()=>{
 fixture(({record,root})=>{
  const r=auditSourceCustody(record,{root});
  assert.equal(r.sourceOK,true);
  assert.equal(r.gitCommittedOK,false);
  assert.match(r.gaps.join(' '),/not committed in HEAD/);
 },{commitSource:false});
});

test('staging without committing is not enough',()=>{
 fixture(({record,root})=>{
  git(root,'add','--','art/source/characters/hair.blend');
  const r=auditSourceCustody(record,{root});
  assert.equal(r.gitCommittedOK,false);
 },{commitSource:false});
});

test('working master modified after commit is not the recorded source',()=>{
 fixture(({record,root,master})=>{
  writeFileSync(master,'ALTERED');
  const r=auditSourceCustody(record,{root});
  assert.equal(r.sourceOK,false);
  assert.equal(r.gitCommittedOK,false);
  assert.match(r.gaps.join(' '),/editable master SHA-256 mismatch/);
 });
});

test('unknown source hash cannot become a custody PASS',()=>{
 fixture(({record,root})=>{
  record.editableSource.sha256=null;
  const r=auditSourceCustody(record,{root});
  assert.equal(r.gitCommittedOK,true);
  assert.equal(r.sourceOK,false);
  assert.match(r.gaps.join(' '),/not pinned/);
 });
});

test('export and upstream dependencies must exist in Git HEAD',()=>{
 fixture(({record,root})=>{
  record.upstreamInputs=['public/assets/r6b.glb'];
  const missing=auditSourceCustody(record,{root});
  assert.match(missing.gaps.join(' '),/authoring input missing/);
  writeFileSync(join(root,'public/assets/r6b.glb'),'BASE');
  const uncommitted=auditSourceCustody(record,{root});
  assert.match(uncommitted.gaps.join(' '),/authoring input not committed/);
  git(root,'add','--','public/assets/r6b.glb');
  git(root,'-c','user.name=Custody Test','-c','user.email=test@example.invalid','commit','-q','-m','input');
  assert.deepEqual(auditSourceCustody(record,{root}).gaps,[]);
 });
});

test('changed GLB, bad digest and unsafe source paths are rejected',()=>{
 fixture(({record,root})=>{
  writeFileSync(join(root,'public/assets/hair.glb'),'WRONG');
  const r=auditSourceCustody(record,{root});
  assert.equal(r.exportOK,false);
  assert.match(r.gaps.join(' '),/runtime export SHA-256 mismatch/);
  record.editableSource.path='../outside.blend';
  assert.throws(()=>auditSourceCustody(record,{root}),/unsafe repository-relative path/);
  record.editableSource.path='art/source/characters/hair.blend';
  record.editableSource.sha256='bad';
  assert.throws(()=>auditSourceCustody(record,{root}),/invalid editable source SHA-256/);
 });
});

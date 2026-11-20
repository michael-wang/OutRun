import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditSourceCustody} from './audit-source-custody.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(fn){
 const root=mkdtempSync(join(tmpdir(),'outrun-source-root-'));
 const vault=mkdtempSync(join(tmpdir(),'outrun-source-vault-'));
 try{
  mkdirSync(join(root,'public/assets'),{recursive:true});
  mkdirSync(join(root,'art-prototype/output'),{recursive:true});
  mkdirSync(join(root,'scripts'),{recursive:true});
  writeFileSync(join(root,'public/assets/hair.glb'),'GAME-EXPORT');
  writeFileSync(join(root,'art-prototype/output/hair.blend'),'EDITABLE-SOURCE');
  writeFileSync(join(root,'scripts/export.py'),'print(1)');
  writeFileSync(join(vault,'hair.blend'),'EDITABLE-SOURCE');
  const record={
   id:'hair',runtimeExport:{path:'public/assets/hair.glb',sha256:hash('GAME-EXPORT')},
   editableSource:{kind:'blend',path:'art-prototype/output/hair.blend',sha256:hash('EDITABLE-SOURCE')},
   exportRecipe:'scripts/export.py'
  };
  fn({record,root,backup:join(vault,'hair.blend')});
 }finally{rmSync(root,{recursive:true,force:true});rmSync(vault,{recursive:true,force:true});}
}

test('matches version-pinned runtime, source and a separate private backup by bytes',()=>{
 fixture(({record,root,backup})=>{
  const r=auditSourceCustody(record,{root,backupPath:backup});
  assert.equal(r.exportOK,true);
  assert.equal(r.sourceOK,true);
  assert.equal(r.backupCopyOK,true);
  assert.deepEqual(r.gaps,[]);
  assert.match(r.notes.join(' '),/do not prove independent/);
 });
});

test('unknown master hash cannot silently become a source-custody PASS',()=>{
 fixture(({record,root,backup})=>{
  record.editableSource.sha256=null;
  const r=auditSourceCustody(record,{root,backupPath:backup});
  assert.equal(r.sourceOK,false);
  assert.equal(r.backupCopyOK,true);
  assert.match(r.gaps.join(' '),/not pinned/);
 });
});

test('no backup, a repo-local copy or identical source path never pass',()=>{
 fixture(({record,root})=>{
  const none=auditSourceCustody(record,{root});
  assert.match(none.gaps.join(' '),/no private backup/);
  for(const backupPath of [join(root,'art-prototype/output/hair.blend'),join(root,'public/assets/hair.glb')]){
   const r=auditSourceCustody(record,{root,backupPath});
   assert.equal(r.backupCopyOK,false);
   assert.match(r.gaps.join(' '),/inside the game repository/);
  }
 });
});

test('mismatched backup and runtime bytes are reported separately',()=>{
 fixture(({record,root,backup})=>{
  writeFileSync(backup,'CORRUPTED');
  writeFileSync(join(root,'public/assets/hair.glb'),'ALTERED');
  const r=auditSourceCustody(record,{root,backupPath:backup});
  assert.equal(r.exportOK,false);
  assert.equal(r.backupCopyOK,false);
  assert.match(r.gaps.join(' '),/runtime export SHA-256 mismatch/);
  assert.match(r.gaps.join(' '),/backup SHA-256 mismatch/);
 });
});

test('unsafe paths and malformed source digests are rejected',()=>{
 fixture(({record,root,backup})=>{
  record.editableSource.path='../outside.blend';
  assert.throws(()=>auditSourceCustody(record,{root,backupPath:backup}),/unsafe repository-relative/);
  record.editableSource.path='art-prototype/output/hair.blend';
  record.editableSource.sha256='bad';
  assert.throws(()=>auditSourceCustody(record,{root,backupPath:backup}),/invalid editable source SHA-256/);
 });
});

test('checks exporter prerequisites instead of treating one committed script as complete source',()=>{
 fixture(({record,root,backup})=>{
  record.upstreamInputs=['public/assets/earlier-r6b.glb'];
  const missing=auditSourceCustody(record,{root,backupPath:backup});
  assert.match(missing.gaps.join(' '),/authoring input missing/);
  writeFileSync(join(root,'public/assets/earlier-r6b.glb'),'BASE');
  const present=auditSourceCustody(record,{root,backupPath:backup});
  assert.equal(present.gaps.length,0);
 });
});

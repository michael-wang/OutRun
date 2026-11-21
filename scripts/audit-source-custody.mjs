#!/usr/bin/env node
/** Read-only GitHub-first source audit; never changes files or Git state. */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const HASH=/^[a-f0-9]{64}$/;
const isWithin=(parent,child)=>{
 const rel=relative(parent,child);
 return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep));
};
const digest=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const safePath=path=>typeof path==='string'&&path.length>0&&!isAbsolute(path)&&
 !path.includes('\\')&&!path.split('/').some(p=>p===''||p==='..'||p==='.');
function inRepo(root,path){
 if(!safePath(path))throw Error('unsafe repository-relative path: '+path);
 const target=resolve(root,path);
 if(!isWithin(realpathSync(root),existsSync(target)?realpathSync(target):target))
  throw Error('path escapes repository: '+path);
 return target;
}
function isCommittedInHead(root,repoPath){
 // Require exact WORKING bytes to match a blob in HEAD, not just a staged file.
 // Remote push must be verified separately.
 try{
  const args={encoding:'utf8',stdio:['ignore','pipe','ignore']};
  const committed=execFileSync('git',['-C',root,'rev-parse','--verify','HEAD:'+repoPath],args).trim();
  const working=execFileSync('git',['-C',root,'hash-object','--',repoPath],args).trim();
  return committed===working;
 }catch{return false;}
}

/** Mechanical source+Git check only; not native editability, approval or remote push. */
export function auditSourceCustody(asset,{root=ROOT}={}){
 if(!asset||typeof asset.id!=='string'||!asset.id||
    !asset.runtimeExport||!asset.editableSource||typeof asset.exportRecipe!=='string')
  throw Error('asset custody record incomplete');
 const gaps=[],notes=[];
 const runtime=asset.runtimeExport,source=asset.editableSource;
 if(!HASH.test(runtime.sha256))throw Error('invalid runtime export SHA-256 for '+asset.id);
 if(source.sha256!==null&&!HASH.test(source.sha256))
  throw Error('invalid editable source SHA-256 for '+asset.id);
 let exportOK=false,sourceOK=false,gitCommittedOK=false,observedSourceSha256=null;
 const exportFile=inRepo(root,runtime.path);
 if(!existsSync(exportFile))gaps.push('runtime export missing: '+runtime.path);
 else if(digest(exportFile)!==runtime.sha256)gaps.push('runtime export SHA-256 mismatch');
 else exportOK=true;
 const recipe=inRepo(root,asset.exportRecipe);
 if(!existsSync(recipe))gaps.push('authoring/export recipe missing');
 if(asset.upstreamInputs!==undefined){
  if(!Array.isArray(asset.upstreamInputs)||!asset.upstreamInputs.every(s=>typeof s==='string'))
   throw Error('invalid upstreamInputs for '+asset.id);
  for(const path of asset.upstreamInputs){
   if(!existsSync(inRepo(root,path)))gaps.push('authoring input missing: '+path);
  }
 }
 const master=inRepo(root,source.path);
 if(!existsSync(master))gaps.push('editable master missing from canonical Git path: '+source.path);
 else{
  observedSourceSha256=digest(master);
  if(source.sha256===null)gaps.push('editable master SHA-256 is not pinned in the custody registry');
  else if(observedSourceSha256!==source.sha256)gaps.push('editable master SHA-256 mismatch');
  else sourceOK=true;
  gitCommittedOK=isCommittedInHead(root,source.path);
  if(!gitCommittedOK)gaps.push('editable master not committed in HEAD or HEAD blob differs: '+source.path);
 }
 notes.push('Git HEAD proves local committed bytes only; verify actual origin/dev GitHub push separately.');
 notes.push('File SHA-256 and Git commits do not prove native Blender editability, source licensing or export parity.');
 return {id:asset.id,exportOK,sourceOK,gitCommittedOK,observedSourceSha256,gaps,notes};
}

function parseArgs(argv){
 const args={strict:false,asset:null};
 for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==='--strict')args.strict=true;
  else if(a==='--asset'&&argv[i+1])args.asset=argv[++i];
  else throw Error('Usage: node scripts/audit-source-custody.mjs [--asset ID] [--strict]');
 }
 return args;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=parseArgs(process.argv.slice(2));
  const config=JSON.parse(readFileSync(resolve(ROOT,'asset-pipeline/source-custody.json'),'utf8'));
  if(config.schemaVersion!==1||!Array.isArray(config.assets)||config.assets.length===0)
   throw Error('invalid source-custody registry');
  const records=args.asset?config.assets.filter(a=>a.id===args.asset):config.assets;
  if(!records.length)throw Error('no matching asset '+args.asset);
  let failed=false;
  for(const record of records){
   const result=auditSourceCustody(record);
   console.log((result.gaps.length?'AT_RISK ':'GIT_SOURCE_CHECK_OK ')+result.id);
   console.log('  export='+result.exportOK+' sourceHash='+result.sourceOK+' gitHead='+result.gitCommittedOK);
   for(const gap of result.gaps)console.log('  GAP '+gap);
   for(const note of result.notes)console.log('  LIMIT '+note);
   if(result.gaps.length)failed=true;
  }
  // Nonblocking inventory for migrated and legacy assets; strict for Goal closure.
  if(args.strict&&failed)process.exitCode=1;
  if(!failed)console.log('LOCAL GIT SOURCE CHECK ONLY — confirm remote push and native Blender restore.');
  else if(!args.strict)console.log('INVENTORY ONLY — outstanding risks above are NOT a custody PASS.');
 }catch(error){console.error('INVALID '+error.message);process.exitCode=1;}
}

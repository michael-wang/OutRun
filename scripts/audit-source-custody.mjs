#!/usr/bin/env node
/**
 * Read-only, local byte-level custody audit for critical editable art sources.
 *
 * The public manifest contains no private vault credentials or paths. Pass a
 * backup path at invocation time. Matching bytes do not prove native Blender
 * editability, licensing, an independent/offsite backup, or author approval.
 */
import {createHash} from 'node:crypto';
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

export function auditSourceCustody(asset,{root=ROOT,backupPath}={}){
 if(!asset||typeof asset.id!=='string'||!asset.id||
    !asset.runtimeExport||!asset.editableSource||typeof asset.exportRecipe!=='string')
  throw Error('asset custody record incomplete');
 const gaps=[],notes=[];
 const runtime=asset.runtimeExport,source=asset.editableSource;
 if(!HASH.test(runtime.sha256))throw Error('invalid runtime export SHA-256 for '+asset.id);
 if(source.sha256!==null&&!HASH.test(source.sha256))
  throw Error('invalid editable source SHA-256 for '+asset.id);
 let exportOK=false,sourceOK=false,backupCopyOK=false,observedSourceSha256=null;
 const exportFile=inRepo(root,runtime.path);
 if(!existsSync(exportFile))gaps.push('runtime export missing: '+runtime.path);
 else if(digest(exportFile)!==runtime.sha256)gaps.push('runtime export SHA-256 mismatch');
 else exportOK=true;
 const recipe=inRepo(root,asset.exportRecipe);
 if(!existsSync(recipe))gaps.push('authoring/export recipe missing');
 const master=inRepo(root,source.path);
 if(!existsSync(master))gaps.push('editable master is not available at its reported local path');
 else {
  observedSourceSha256=digest(master);
  if(source.sha256===null)gaps.push('editable master SHA-256 is not pinned in the public custody record');
  else if(observedSourceSha256!==source.sha256)gaps.push('editable master SHA-256 mismatch');
  else sourceOK=true;
 }
 if(!backupPath)gaps.push('no private backup path supplied for byte-level verification');
 else if(typeof backupPath!=='string'||!isAbsolute(backupPath))gaps.push('backup path must be absolute');
 else if(!existsSync(backupPath))gaps.push('backup copy does not exist');
 else {
  const realRoot=realpathSync(root),realBackup=realpathSync(backupPath);
  if(isWithin(realRoot,realBackup))gaps.push('backup is inside the game repository');
  else if(existsSync(master)&&realBackup===realpathSync(master))
   gaps.push('backup and editable master are the same file');
  else if(!observedSourceSha256)gaps.push('cannot compare backup without readable master');
  else if(digest(realBackup)!==observedSourceSha256)gaps.push('backup SHA-256 mismatch');
  else backupCopyOK=true;
 }
 notes.push('Matching backup bytes alone do not prove independent/offsite recovery or a native-app editable restore.');
 notes.push('Art/technical acceptance and public-distribution rights require separate human review.');
 return {id:asset.id,exportOK,sourceOK,backupCopyOK,observedSourceSha256,gaps,notes};
}

function parseArgs(argv){
 const args={strict:false,asset:null,backupPath:null};
 for(let i=0;i<argv.length;i++){
  const a=argv[i];
  if(a==='--strict')args.strict=true;
  else if(a==='--asset'&&argv[i+1])args.asset=argv[++i];
  else if(a==='--backup'&&argv[i+1])args.backupPath=argv[++i];
  else throw Error('Usage: node scripts/audit-source-custody.mjs [--asset ID] [--backup PRIVATE_BACKUP_FILE] [--strict]');
 }
 if(args.backupPath&&!args.asset)throw Error('--backup requires --asset');
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
   const result=auditSourceCustody(record,{backupPath:args.backupPath});
   console.log((result.gaps.length?'AT_RISK ':'BYTE_CHECK_OK ')+result.id);
   console.log('  export='+result.exportOK+' sourcePinned='+result.sourceOK+' backupBytesMatch='+result.backupCopyOK);
   for(const gap of result.gaps)console.log('  GAP '+gap);
   for(const note of result.notes)console.log('  LIMIT '+note);
   if(result.gaps.length)failed=true;
  }
  // Inventory mode is nonblocking to avoid breaking legacy gameplay; strict
  // mode is the required closure gate when a new source is formally handed off.
  if(args.strict&&failed)process.exitCode=1;
  if(!failed)console.log('BYTE CUSTODY CHECK ONLY — native open, independent recovery and rights still need review.');
  else if(!args.strict)console.log('INVENTORY ONLY — outstanding risks above are NOT a custody PASS.');
 }catch(error){console.error('INVALID '+error.message);process.exitCode=1;}
}

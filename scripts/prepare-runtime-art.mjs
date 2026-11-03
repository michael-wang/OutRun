import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const assets=JSON.parse(await readFile(resolve(root,'src/runtime-art.json'),'utf8'));
const valid=(data,asset)=>data.length===asset.bytes&&createHash('sha256').update(data).digest('hex')===asset.sha256;
const read=path=>readFile(path).catch(error=>{if(error.code==='ENOENT')return null;throw error;});

for(const [name,asset] of Object.entries(assets)){
 const destination=resolve(root,'public','.'+asset.path);
 const cached=await read(destination);
 if(cached&&valid(cached,asset)){console.log(`Runtime art ${name}: verified cache (${asset.bytes} bytes).`);continue;}
 let data=await read(resolve(root,asset.local));
 if(!data||!valid(data,asset)){
  console.log(`Runtime art ${name}: downloading pinned release asset…`);
  let failure;
  for(let attempt=0;attempt<3;attempt++){
   try{
    const response=await fetch(asset.url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    data=Buffer.from(await response.arrayBuffer());
    if(!valid(data,asset))throw Error('size or SHA-256 mismatch');
    failure=undefined;break;
   }catch(error){failure=error;if(attempt<2)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}
  }
  if(failure)throw Error(`Cannot publish without ${name} artwork: ${failure.message}`);
 }
 if(!data||!valid(data,asset))throw Error(`Invalid ${name} artwork; refusing incomplete build.`);
 await mkdir(dirname(destination),{recursive:true});
 const temp=destination+`.${process.pid}.tmp`;
 try{await writeFile(temp,data);await rename(temp,destination);}finally{await rm(temp,{force:true});}
 console.log(`Runtime art ${name}: ready (${asset.bytes} bytes, SHA-256 verified).`);
}

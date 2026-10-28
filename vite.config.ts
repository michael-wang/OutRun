import {defineConfig, type Plugin} from 'vite';
import {mkdir, open, realpath, lstat, link, unlink} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';

/** Dev-only, same-origin screenshot archive. The client never supplies a path. */
function captureArchive():Plugin {
 let count=0,active=0;const recent:number[]=[];
 return {name:'outrun-capture-archive',apply:'serve',configureServer(server){
  const root=resolve(server.config.root),captureRoot=join(root,'captures');
  server.middlewares.use('/__outrun_capture',async(req,res)=>{
   const reply=(code:number,value:unknown)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
   if(req.method!=='POST'){reply(405,{error:'POST required'});return;}
   const origin=req.headers.origin,host=req.headers.host,site=req.headers['sec-fetch-site'];
   if(!origin||!host||origin!==`http://${host}`||(site&&site!=='same-origin'&&site!=='none')){reply(403,{error:'Same-origin request required'});return;}
   const now=Date.now();while(recent.length&&recent[0]<now-60000)recent.shift();if(recent.length>=60||active>=4){reply(429,{error:'Capture queue busy'});return;}recent.push(now);active++;
   try{
    const parts:Buffer[]=[];let size=0;for await(const part of req){const data=Buffer.from(part);size+=data.length;if(size>11*1024*1024)throw Error('Capture exceeds size limit');parts.push(data);}
    const body=JSON.parse(Buffer.concat(parts).toString('utf8'));if(typeof body.png!=='string'||!body.png.startsWith('data:image/png;base64,')||!body.meta||typeof body.meta!=='object')throw Error('Invalid capture');
    const png=Buffer.from(body.png.slice(22),'base64'),signature=Buffer.from([137,80,78,71,13,10,26,10]);if(png.length<32||png.length>8*1024*1024||!png.subarray(0,8).equals(signature))throw Error('Invalid PNG');
    await mkdir(captureRoot,{recursive:true});if((await lstat(captureRoot)).isSymbolicLink())throw Error('Capture directory cannot be a symlink');const actual=await realpath(captureRoot),actualRoot=await realpath(root);if(!actual.toLowerCase().startsWith((actualRoot+sep).toLowerCase()))throw Error('Invalid capture directory');
    const date=new Date(),day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'),folder=join(actual,day);await mkdir(folder,{recursive:true});if((await lstat(folder)).isSymbolicLink()||!(await realpath(folder)).toLowerCase().startsWith((actual+sep).toLowerCase()))throw Error('Invalid dated directory');
    const name=`${date.toISOString().replace(/[:.]/g,'-')}-${randomUUID()}`,path=join(folder,name);const temp=path+'.tmp',file=await open(temp,'wx');try{await file.writeFile(png);await file.close();await link(temp,path+'.png');}finally{await file.close().catch(()=>{});await unlink(temp).catch(()=>{});}
    const allowed=['stageCode','seed','capturedAt','time','distance','speed','steer','grade','roadX','halfWidth','carPosition','carRotation','roadPosition','surfaceGap','wheels'];const meta=Object.fromEntries(allowed.filter(k=>k in body.meta).map(k=>[k,body.meta[k]]));const sidecar=await open(path+'.json','wx');try{await sidecar.writeFile(JSON.stringify(meta,null,2));}finally{await sidecar.close();}
    reply(200,{path:`captures/${day}/${name}.png`,count:++count});
   }catch(e){reply(400,{error:e instanceof Error?e.message:'Capture failed'});}finally{active--;}
  });
 }};
}
export default defineConfig({plugins:[captureArchive()],server:{watch:{ignored:['**/docs/evidence/**','**/captures/**','**/test-results/**','**/*.log']}}});

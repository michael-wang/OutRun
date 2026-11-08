import {defineConfig, type Plugin} from 'vite';
import {mkdir, open, realpath, lstat, link, unlink, readdir, readFile, writeFile} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';

/** Local-only asset handoff: never copies the GLB into a build or Git. */
function localBlenderArt():Plugin {
 const install=(server:{middlewares:import('vite').Connect.Server})=>{
  for(const [asset,local] of [['canyon_art_only.glb','canyon_art_only.glb'],['canyon_roadlock_art.glb','roadlock/canyon_roadlock_art.glb'],['grand_canyon_final.glb','grand_canyon_final.glb'],['canyon_terrain_first.glb','terrain-first/canyon_terrain_first.glb'],['canyon_cliff_pass_r4.glb','cliff-pass-r4/canyon_cliff_pass_r4.glb']])server.middlewares.use('/__local_art/'+asset,async(req,res)=>{
   if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.end();return;}
   const file=resolve('art-prototype/output',local);
   try{const info=await lstat(file);if(!info.isFile())throw Error('Not a file');
    res.setHeader('Content-Type','model/gltf-binary');res.setHeader('Content-Length',info.size);res.setHeader('Cache-Control','no-store');
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
   }catch{res.statusCode=404;res.end('Local Blender GLB not found');}
  });
 };
 return {name:'outrun-local-blender-art',configureServer:install,configurePreviewServer:install};
}

/** Dev-only, same-origin screenshot archive. The client never supplies a path. */
function captureArchive():Plugin {
 let count=0,active=0;const recent:number[]=[];
 return {name:'outrun-capture-archive',apply:'serve',configureServer(server){
  const root=resolve(server.config.root),captureRoot=join(root,'captures');
  const day=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const local=(req:import('node:http').IncomingMessage)=>{
   const address=req.socket.remoteAddress?.replace(/^::ffff:/,'');
   let hostname='';try{hostname=new URL(`http://${req.headers.host}`).hostname;}catch{return false;}
   return (address==='127.0.0.1'||address==='::1')&&['localhost','127.0.0.1','[::1]'].includes(hostname);
  };
  server.middlewares.use('/__outrun_photo_info',(req,res)=>{
   if(req.method!=='GET'||(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin'&&req.headers['sec-fetch-site']!=='none')){res.statusCode=403;res.end();return;}
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
   res.end(JSON.stringify({folder:process.platform==='win32'?join(captureRoot,day()):null,openAllowed:process.platform==='win32'&&local(req)}));
  });
  server.middlewares.use('/__outrun_open_photos',async(req,res)=>{
   const host=req.headers.host,origin=req.headers.origin,site=req.headers['sec-fetch-site'];
   if(req.method!=='POST'||process.platform!=='win32'||!local(req)||!host||origin!==`http://${host}`||(site&&site!=='same-origin')||Number(req.headers['content-length']||0)>0||req.headers['transfer-encoding']){res.statusCode=403;res.end();return;}
   try{
    await mkdir(captureRoot,{recursive:true});if((await lstat(captureRoot)).isSymbolicLink())throw Error('Invalid capture directory');
    const actual=await realpath(captureRoot),actualRoot=await realpath(root);if(!actual.toLowerCase().startsWith((actualRoot+sep).toLowerCase()))throw Error('Invalid capture directory');
    const folder=join(actual,day());await mkdir(folder,{recursive:true});if((await lstat(folder)).isSymbolicLink()||!(await realpath(folder)).toLowerCase().startsWith((actual+sep).toLowerCase()))throw Error('Invalid dated directory');
    const explorer=join(process.env.SystemRoot??'C:\\Windows','explorer.exe');
    await new Promise<void>((resolve,reject)=>{const child=spawn(explorer,[folder],{shell:false,windowsHide:false});child.once('spawn',()=>resolve());child.once('error',reject);});res.statusCode=204;res.end();
   }catch{res.statusCode=500;res.end();}
  });
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
    const allowed=['buildVersion','fps','stageCode','seed','capturedAt','time','distance','speed','steer','grade','roadX','halfWidth','carPosition','carRotation','roadPosition','surfaceGap','wheels'];const meta=Object.fromEntries(allowed.filter(k=>k in body.meta).map(k=>[k,body.meta[k]]));const sidecar=await open(path+'.json','wx');try{await sidecar.writeFile(JSON.stringify(meta,null,2));}finally{await sidecar.close();}
    reply(200,{path:`captures/${day}/${name}.png`,count:++count});
   }catch(e){reply(400,{error:e instanceof Error?e.message:'Capture failed'});}finally{active--;}
  });
 }};
}
// Include the current coast and its Worker dependencies on the first offline
// install. Optional canyon art and source/reference files stay on demand.
function offlineCoast():Plugin {
 return {name:'outrun-offline-coast',apply:'build',async writeBundle({dir},bundle){
  if(!dir)throw Error('Missing site output directory');
  const files=new Set(Object.keys(bundle));
  for(const path of await readdir(dir,{recursive:true})){
   const name=path.split(sep).join('/');
   if(/^(icons|ui)\/.*\.png$|^assets\/coast-(boats|nature)\/.*\.(glb|png)$/.test(name))files.add(name);
  }
  for(const name of ['index.html','manifest.webmanifest','generated/coast-shore.shore','assets/coast-nature/models.json','assets/coast-nature/headland-grove.json','assets/coast-farm/rice-near.glb','assets/coast-farm/scarecrow.glb'])files.add(name);
  const paths=[...files].sort(),hash=createHash('sha256');
  for(const name of paths)hash.update(name).update('\0').update(await readFile(join(dir,name)));
  const template=await readFile('public/sw.js','utf8');
  const revision=hash.update(template).digest('hex').slice(0,20);
  await writeFile(join(dir,'sw.js'),template.replace('BUILD_REVISION',revision).replace('/* BUILD_FILES */ []',JSON.stringify(paths)));
 }};
}
export default defineConfig({base:process.env.OUTRUN_SITE_BASE??'/',plugins:[captureArchive(),localBlenderArt(),offlineCoast()],server:{watch:{ignored:['**/art-prototype/output/**','**/docs/evidence/**','**/captures/**','**/test-results/**','**/*.log']}}});

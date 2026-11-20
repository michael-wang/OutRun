import {createServer} from 'vite';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

// Run before dev/build. Generated binary stays out of Git and ships with dist.
const server=await createServer({configFile:false,server:{middlewareMode:true,watch:null,hmr:false,ws:false},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {prepareBakeTracks,bakeCoastShore,packCoastShore,COAST_SHORE_KEY,COAST_SHORE_NAME,KENTING_INSTALLATION,FARM_PLOTS,sampleFarmGround}=
  await server.ssrLoadModule('/scripts/coast-shore-recipe.ts');
 const {track,farmTrack}=prepareBakeTracks();
 // This expensive 30km offline bake is invalidated by relevant sources,
 // never rebuilt on every unchanged npm run dev / build.
 const sourcePaths=['scripts/coast-shore-recipe.ts','src/beach-zone-layout.ts','src/kenting-installation.ts','content/stages/coast/kenting-installation.json','src/content/kenting-installed-road.ts',
  'src/beach2-profile.ts','src/content/beach2-track.ts',
  'content/stages/coast/road.json','src/beach-macro.ts','src/content/beach-macro-track.ts','src/content/coast-worker-road.ts',
  'src/content/coast-sunset-track.ts','src/coast-shore.ts','src/coast-shore-index.ts','src/coast-shore-asset.ts',
  'src/coast-layout.ts','src/scenery-cross-section.ts','src/coast-terrain.ts',
  'src/coast-farm-layout.ts','src/coast-rural-layout.ts',
  'src/coast-roadside-layout.ts','src/coast-town-access.ts',
  'src/content/authored-road.ts','src/content/authored-track.ts',
  'src/content/road-shapes.ts','src/content/coast-stage.ts',
  'src/challenges.ts','src/banking.ts','src/track.ts','src/pace.ts',
 ];
 const checksum=createHash('sha256');
 checksum.update(COAST_SHORE_KEY);
 for(const d of [350,KENTING_INSTALLATION.roadEntry,KENTING_INSTALLATION.coreStart,KENTING_INSTALLATION.roadExit,14550]){
  checksum.update(JSON.stringify(track.sample(d).position.toArray()));
 }
 for(const file of sourcePaths)checksum.update(await readFile(file));
 const stamp=COAST_SHORE_KEY+':'+checksum.digest('hex');
 const assetPath=`public/generated/${COAST_SHORE_NAME}.shore`;
 const stampPath=`public/generated/${COAST_SHORE_NAME}.build-key`;
 let reusable=false;
 try{
  const [oldStamp,existing]=await Promise.all([readFile(stampPath,'utf8'),stat(assetPath)]);
  reusable=oldStamp.trim()===stamp&&existing.size>1024;
 }catch{/* No cached asset, or the sources changed. */}
 if(reusable){
  console.log(`Coast mask ${COAST_SHORE_KEY}: cached; skipping unchanged 30km bake.`);
 }else{
  const shore=bakeCoastShore(track.sample,track.length);
  try{
   const compressed=gzipSync(packCoastShore(shore),{level:9});
   await mkdir('public/generated',{recursive:true});
   await writeFile(assetPath,compressed);
   // Stamp only once the asset is fully written.
   await writeFile(stampPath,stamp);
   console.log(`Coast mask ${COAST_SHORE_KEY}: ${(compressed.length/1024/1024).toFixed(2)} MiB; prepared off-device.`);
  }finally{shore.texture.dispose();}
 }
 const rows=FARM_PLOTS.map(plot=>Buffer.from(sampleFarmGround(plot,farmTrack.sample).buffer));
 const ground=gzipSync(Buffer.concat(rows),{level:9});
 await mkdir('src/generated',{recursive:true});
 const farmPath=KENTING_INSTALLATION.shifted?'public/generated/coast-farm-ground-r1.bin':'src/generated/coast-farm-ground.bin';
 const priorGround=await readFile(farmPath).catch(error=>{
  if(error.code!=='ENOENT')throw error;
  return undefined;
 });
 if(!priorGround?.equals(ground))await writeFile(farmPath,ground);
 console.log(`Coastal farm ground: ${FARM_PLOTS.length} plots, ${ground.byteLength} bytes.`);
}finally{await server.close();}

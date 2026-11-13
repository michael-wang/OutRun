import {createServer} from 'vite';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

// Run before dev/build. Generated binary stays out of Git and ships with dist.
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {coastWorkerRoad}=await server.ssrLoadModule('/src/content/coast-worker-road.ts');
 const {bakeCoastShore}=await server.ssrLoadModule('/src/coast-shore.ts');
 const {packCoastShore,COAST_SHORE_KEY}=await server.ssrLoadModule('/src/coast-shore-asset.ts');

 const track=coastWorkerRoad().track;
 // This expensive 30km offline bake is invalidated by relevant sources,
 // never rebuilt on every unchanged npm run dev / build.
 const sourcePaths=[
  'content/stages/coast/road.json',
  'src/coast-shore.ts','src/coast-shore-index.ts','src/coast-shore-asset.ts',
  'src/coast-layout.ts','src/scenery-cross-section.ts','src/coast-terrain.ts',
  'src/coast-farm-layout.ts','src/coast-rural-layout.ts',
  'src/coast-roadside-layout.ts','src/coast-town-access.ts',
  'src/content/authored-road.ts','src/content/authored-track.ts',
  'src/content/road-shapes.ts','src/content/coast-stage.ts',
  'src/challenges.ts','src/banking.ts','src/track.ts','src/pace.ts',
 ];
 const checksum=createHash('sha256');
 checksum.update(COAST_SHORE_KEY);
 for(const file of sourcePaths)checksum.update(await readFile(file));
 const stamp=COAST_SHORE_KEY+':'+checksum.digest('hex');
 const assetPath='public/generated/coast-shore.shore';
 const stampPath='public/generated/coast-shore.build-key';
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
 const {FARM_PLOTS}=await server.ssrLoadModule('/src/coast-farm-layout.ts');
 const {sampleFarmGround}=await server.ssrLoadModule('/src/coast-farm-prep.ts');
 const rows=FARM_PLOTS.map(plot=>Buffer.from(sampleFarmGround(plot,track.sample).buffer));
 const ground=gzipSync(Buffer.concat(rows),{level:9});
 await mkdir('src/generated',{recursive:true});
 await writeFile('src/generated/coast-farm-ground.bin',ground);
 console.log(`Coastal farm ground: ${FARM_PLOTS.length} plots, ${ground.byteLength} bytes.`);
}finally{await server.close();}

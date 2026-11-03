import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';

// Run before dev/build. Generated binary stays out of Git and ships with dist.
const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {COAST_ULTRA_STAGE}=await server.ssrLoadModule('/src/coast-ultra-stage.ts');
 const {createPilotTrack}=await server.ssrLoadModule('/src/pilot-composer.ts');
 const {bakeCoastShore}=await server.ssrLoadModule('/src/coast-shore.ts');
 const {packCoastShore,COAST_SHORE_KEY}=await server.ssrLoadModule('/src/coast-shore-asset.ts');
 const track=createPilotTrack(COAST_ULTRA_STAGE),shore=bakeCoastShore(track.sample,track.length);
 try{
  const compressed=gzipSync(packCoastShore(shore),{level:9});
  await mkdir('public/generated',{recursive:true});
  await writeFile('public/generated/coast-shore.shore',compressed);
  console.log(`Coast mask ${COAST_SHORE_KEY}: ${(compressed.length/1024/1024).toFixed(2)} MiB; prepared off-device.`);
 }finally{shore.texture.dispose();}
}finally{await server.close();}

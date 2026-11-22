/**
 * #75 original source capture. Run from checkout root:
 *   node scripts/art-proto/issue75-sample-native.mjs test-results/issue75/original-surface.json
 *   blender -b --factory-startup -t 4 --python scripts/art-proto/issue75-build-erosion.py -- test-results/issue75/original-surface.json test-results/issue75/kenting-erosion.blend .local/kenting-erosion.glb
 *   blender -b test-results/issue75/kenting-erosion.blend --python scripts/art-proto/issue75-verify-erosion.py -- test-results/issue75/original-surface.json
 * Run in the default/immediate Kenting installation. Keep generated files
 * and the editable master local; none is part of the deployable project.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {createServer} from 'vite';

const destination=process.argv[2];
if(!destination)throw Error('Usage: node scripts/art-proto/issue75-sample-native.mjs <output.json>');
const vite=await createServer({configFile:false,server:{middlewareMode:true,watch:null,hmr:false,ws:false},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {coastWorkerRoad}=await vite.ssrLoadModule('/src/content/coast-worker-road.ts');
 const {configureKentingCoast}=await vite.ssrLoadModule('/src/beach-macro.ts');
 const {KENTING_INSTALLATION}=await vite.ssrLoadModule('/src/kenting-installation.ts');
 const {bridgeSpan,bridgeShoulders}=await vite.ssrLoadModule('/src/bridge.ts');
 const {prepareRoadChunk}=await vite.ssrLoadModule('/src/road-chunk.ts');
 const {COAST_HILL_STRIPS}=await vite.ssrLoadModule('/src/coast-terrain.ts');
 const {KENTING_TERRAIN_DEMO:p}=await vite.ssrLoadModule('/src/kenting-terrain-demo.ts');
 if(KENTING_INSTALLATION.mode!=='immediate')throw Error('The demo requires immediate Kenting');
 configureKentingCoast();
 const {track,halfAt,weightsAt,stage}=coastWorkerRoad();
 const bridge=bridgeSpan(track.sample,halfAt,weightsAt,track.length);
 const grass=prepareRoadChunk(track.sample,halfAt,weightsAt,4000,5000,track.length,false,true,[],
  d=>bridgeShoulders(d,stage.seed,bridge),bridge,true,undefined,stage.scenerySections,undefined,false,false,true).find(m=>m.kind==='grass');
 const {start:from,end:to,inner,outer}=p;
 const strips=COAST_HILL_STRIPS.filter(x=>x>=inner&&x<=outer),cuts=grass?.terrainDemoCuts;
 if(!cuts||cuts.length!==strips.length-1)throw Error('Native demo footprint changed; re-author before exporting');
 const firsts=cuts.map(c=>grass.indices[c.firstIndex]);firsts.push(firsts.at(-1)+1);
 const get=(buffer,i)=>Array.from(buffer.subarray(i*3,i*3+3));
 const rows=Array.from({length:(to-from)/5+1},(_,i)=>({d:from+5*i,e:firsts.map(start=>{
  const j=start+i*2;return {p:get(grass.positions,j),c:get(grass.colors,j),n:get(grass.normals,j)};
 })}));
 mkdirSync(dirname(destination),{recursive:true});
 writeFileSync(destination,JSON.stringify({footprint:{from,to,strips},rows}));
}finally{await vite.close();}

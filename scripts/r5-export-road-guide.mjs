// Geometry Nodes receives the SAME authored road coordinates as the game.
// This is an offline guide, never a second road simulator or runtime asset.
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const server=await createServer({
 configFile:false,server:{middlewareMode:true},
 appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]},
});
try{
 const {COAST_STAGE}=await server.ssrLoadModule('/src/content/coast-stage.ts');
 const {coastWorkerRoad}=await server.ssrLoadModule('/src/content/coast-worker-road.ts');
 const {coastLessonAt}=await server.ssrLoadModule('/src/content/coast-onboarding.ts');
 const {road,onboarding}=COAST_STAGE;
 const {track,halfAt}=coastWorkerRoad();
 // Export the accepted road whitebox through A6, including the first two drifts.
 const start=road.startDistance,end=onboarding.driftLessons.at(-1)!.end;
 const stations=new Set([start,end]);
 for(let d=start;d<=end;d+=20)stations.add(d);
 for(const lesson of onboarding.lessons)stations.add(lesson.start),stations.add(lesson.end);
 for(const bank of road.banks??[])stations.add(bank.start),stations.add(bank.end);
 const samples=[...stations].sort((a,b)=>a-b).map(distance=>{
  const pose=track.sample(distance),roadWidth=halfAt(distance)*2;
  return {
   distance,
   position:pose.position.toArray(),right:pose.right.toArray(),
   tangent:pose.tangent.toArray(),roadWidth,
   bankDegrees:Math.atan(-pose.right.y)*180/Math.PI,
   curvature:pose.curvature,lesson:coastLessonAt(distance)?.id??null,
  };
 });
 const artifact={
  schemaVersion:1,
  stage:'coast',revision:onboarding.revision,
  coordinates:'Three.js world X/Y-up/Z-forward, absolute metres',
  source:'coastWorkerRoad().track.sample / stage authored road.json',
  samples,
 };
 const folder='art-prototype/output',filename=join(folder,'r5-road-guide.json');
 await mkdir(folder,{recursive:true});
 await writeFile(filename,JSON.stringify(artifact,null,2));
 console.log(`R5b road guide: ${samples.length} stations in ${filename} (${start}-${end}m)`);
}finally{await server.close();}

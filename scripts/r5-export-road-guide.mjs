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
 const {road,onboarding,direction}=COAST_STAGE;
 const {track,halfAt}=coastWorkerRoad();
 // R5c exports the FULL 30km authored grand tour from the same exact
 // road sampler used by the browser game, physics and road Worker.
 const start=road.startDistance,end=road.startDistance+road.length;
 const stations=new Set([start,end]);
 for(let d=start;d<=end;d+=20)stations.add(d);
 for(const lesson of onboarding.lessons)stations.add(lesson.start),stations.add(lesson.end);
 for(const bank of road.banks??[])stations.add(bank.start),stations.add(bank.end);
 for(const drift of onboarding.driftLessons)stations.add(drift.start),stations.add(drift.end);
 const accident=onboarding.accident;
 stations.add(accident.start);stations.add(accident.distance);stations.add(accident.end);
 for(const hero of direction.heroSlots)stations.add(hero.distance);
 for(const gate of direction.contestGates)stations.add(gate.start),stations.add(gate.end);
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
  heroSlots:direction.heroSlots.map(hero=>{
   const frame=track.sample(hero.distance);
   return {...hero,position:frame.position.toArray(),
    right:frame.right.toArray(),tangent:frame.tangent.toArray()};
  }),
  contestGates:direction.contestGates,chapters:direction.chapters,
  samples,
 };
 const folder='art-prototype/output',filename=join(folder,'r5-road-guide.json');
 await mkdir(folder,{recursive:true});
 await writeFile(filename,JSON.stringify(artifact,null,2));
 console.log(`R5c full road guide: ${samples.length} stations in ${filename} (${start}-${end}m)`);
}finally{await server.close();}

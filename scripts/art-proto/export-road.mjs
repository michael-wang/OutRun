// Exact road-reference export for the 400m Designer's Cut art blockout.
// Runs on the developer machine after npm ci, not inside the game loop.
import {createServer} from 'vite';
import {writeFile, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const name='grand-canyon-blockout-v1';
const arg=process.argv.indexOf('--output');
const output=resolve(arg>=0&&process.argv[arg+1]?process.argv[arg+1]:'art-prototype/output/road-reference.json');
const server=await createServer({
 configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error',
 // This SSR-only exporter does not need a background scan of browser entries.
 optimizeDeps:{noDiscovery:true,include:[]},
});
const vec=p=>[Number(p.x.toFixed(5)),Number(p.y.toFixed(5)),Number(p.z.toFixed(5))];
try{
 const [{DESIGNER_CANYON_STAGE},{createPilotTrack,pilotSample},{BRICK_START},{chaseTargets,CHASE,chaseComposition}]=await Promise.all([
  server.ssrLoadModule('/src/designer-canyon.ts'),
  server.ssrLoadModule('/src/pilot-composer.ts'),
  server.ssrLoadModule('/src/bricks.ts'),
  server.ssrLoadModule('/src/chase.ts'),
 ]);
 const stage=DESIGNER_CANYON_STAGE,track=createPilotTrack(stage);
 const start=BRICK_START+990,end=start+400,step=5,aspect=16/9;
 const frames=[];
 for(let distance=start;distance<=end;distance+=step){
  const p=track.sample(distance),drive=pilotSample(stage,distance);
  frames.push({
   distance,center:vec(p.position),right:vec(p.right),heading:p.roadHeading,
   halfWidth:drive.halfWidth,grade:drive.grade,curvature:p.curvature,
  });
 }
 // These are artist-chosen snapshots, not points selected by a camera optimizer.
 const cameras=[1015,1120,1235].map((relative,i)=>{
  const distance=BRICK_START+relative,pose=track.sample(distance),drive=pilotSample(stage,distance);
  const t=chaseTargets(pose.position,pose.roadHeading,aspect,drive.grade);
  return {name:['01_Approach','02_Reveal','03_Exit'][i],distance,
   eye:vec(t.eye),look:vec(t.look),verticalFov:chaseComposition(aspect).fov,
   horizontalFov:CHASE.horizontalFov};
 });
 const data={
  format:'outrun-blender-road-reference-v1',
  project:name,source:'src/designer-canyon.ts',tripCode:stage.tripCode,
  coordinateSystem:'Three.js X-right Y-up Z-forward, meters',
  start,end,step,riverY:stage.canyonPrototype.riverY,
  worldUp:[0,1,0],frames,cameras,
  // Fixed editorial markers. These are NOT fed back into the road generator.
  landmarks:[
   {name:'far_rim_center',distance:BRICK_START+1310,offset:-235},
   {name:'right_cliff',distance:BRICK_START+1190,offset:140},
   {name:'river_bend',distance:BRICK_START+1290,offset:-115},
  ],
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(data,null,2)+'\n','utf8');
 console.log('Designer blockout road reference: '+output);
 console.log('Frames: '+frames.length+' | cameras: '+cameras.length+' | road: '+start+'-'+end+'m');
}finally{await server.close();}

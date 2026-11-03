// Exact road-reference export for the old 400m art blockout or the current
// terrain-first fixed road. Both use game geometry and normal chase poses.
// Runs on the developer machine after npm ci, not inside the game loop.
import {createServer} from 'vite';
import {writeFile, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const roadlock=process.argv.includes('--roadlock');
const name=roadlock?'grand-canyon-river-reveal-r3':'grand-canyon-blockout-v1';
const arg=process.argv.indexOf('--output');
const output=resolve(arg>=0&&process.argv[arg+1]?process.argv[arg+1]:'art-prototype/output/road-reference.json');
const server=await createServer({
 configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error',
 // This SSR-only exporter does not need a background scan of browser entries.
 optimizeDeps:{noDiscovery:true,include:[]},
});
const vec=p=>[Number(p.x.toFixed(5)),Number(p.y.toFixed(5)),Number(p.z.toFixed(5))];
try{
 const [{DESIGNER_CANYON_STAGE},{CANYON_ROADLOCK_STAGE},
  {createPilotTrack,pilotSample},{BRICK_START},{chaseTargets,CHASE,chaseComposition}]=await Promise.all([
  server.ssrLoadModule('/src/designer-canyon.ts'),
  server.ssrLoadModule('/src/designer-canyon-roadlock.ts'),
  server.ssrLoadModule('/src/pilot-composer.ts'),
  server.ssrLoadModule('/src/bricks.ts'),
  server.ssrLoadModule('/src/chase.ts'),
 ]);
 const stage=roadlock?CANYON_ROADLOCK_STAGE:DESIGNER_CANYON_STAGE,track=createPilotTrack(stage);
 const start=roadlock?BRICK_START:BRICK_START+990;
 const end=roadlock?BRICK_START+stage.length:start+400,step=roadlock?10:5,aspect=16/9;
 const frames=[];
 for(let i=0;i<=Math.ceil((end-start)/step);i++){
  const distance=Math.min(end,start+i*step);
  const p=track.sample(distance),drive=pilotSample(stage,distance);
  frames.push({
   distance,center:vec(p.position),right:vec(p.right),heading:p.roadHeading,
   halfWidth:drive.halfWidth,grade:drive.grade,curvature:p.curvature,
  });
 }
 // Fixed hero cameras are for composition in Blender. Road geometry remains
 // authoritative; the artist can hide unfinished gaps behind close rock walls.
 const cameraStops=roadlock?(await import('../../src/terrain-first-road.json',{with:{type:'json'}})).default.cameras.map(([name,d])=>[name,d-BRICK_START]):[['01_Approach',1015],['02_Reveal',1120],['03_Exit',1235]];
 const cameras=cameraStops.map(([cameraName,relative])=>{
  const distance=BRICK_START+Number(relative),pose=track.sample(distance),drive=pilotSample(stage,distance);
  const t=chaseTargets(pose.position,pose.roadHeading,aspect,drive.grade);
  return {name:String(cameraName),distance,
   eye:vec(t.eye),look:vec(t.look),verticalFov:chaseComposition(aspect).fov,
   horizontalFov:CHASE.horizontalFov};
 });
 // Artist-only clearance reference, covering ALL of the drive, not just
 // the 400m hero camera window. This must guide .blend edits, not runtime
 // procedural carving. Road/handling never consume this additional data.
 const protectionStart=BRICK_START,protectionEnd=BRICK_START+stage.length;
 const protectionStep=5,protectionFrames=[];
 for(let i=0;i<=Math.ceil((protectionEnd-protectionStart)/protectionStep);i++){
  const d=Math.min(protectionEnd,protectionStart+i*protectionStep);
  const p=track.sample(d),drive=pilotSample(stage,d);
  protectionFrames.push({
   distance:d,center:vec(p.position),right:vec(p.right),
   halfWidth:drive.halfWidth,heading:p.roadHeading,
  });
 }
 const roadProtection={
  start:protectionStart,end:protectionEnd,step:protectionStep,
  // Artist's visual clearance beyond the 7m pavement half-width.
  lateralPadding:4,headroom:80,belowRoad:10,
  frames:protectionFrames,
 };
 const data={
  format:'outrun-blender-road-reference-v1',
  project:name,source:roadlock?'src/designer-canyon-roadlock.ts':'src/designer-canyon.ts',
  tripCode:stage.tripCode,
  coordinateSystem:'Three.js X-right Y-up Z-forward, meters',
  start,end,step,riverY:stage.canyonPrototype?.riverY??null,
  worldUp:[0,1,0],frames,cameras,roadProtection,
  // Fixed editorial markers. These are NOT fed back into the road generator.
  landmarks:roadlock?[]:[
   {name:'far_rim_center',distance:BRICK_START+1310,offset:-235},
   {name:'right_cliff',distance:BRICK_START+1190,offset:140},
   {name:'river_bend',distance:BRICK_START+1290,offset:-115},
  ],
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(data,null,2)+'\n','utf8');
 console.log('Designer blockout road reference: '+output);
 console.log('Frames: '+frames.length+' | cameras: '+cameras.length+' | road: '+start+'-'+end+'m');
 console.log('Road protection: '+roadProtection.frames.length+' exact frames / '+protectionStart+'-'+protectionEnd+'m');
}finally{await server.close();}

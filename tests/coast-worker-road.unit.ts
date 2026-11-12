import {expect,it} from 'vitest';
import {COAST_STAGE,type CoastStageContent} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {sampleAuthoredRoad} from '../src/content/authored-road';

it('P0: Worker metadata stays small, without Pilot/Trip objects',()=>{
 const runtime=coastWorkerRoad();
 expect(runtime.stage.kind).toBe('authored-coast');
 expect(Object.keys(runtime.stage).sort()).toEqual([
  'generatorVersion','id','kind','sceneryAct','scenerySections','scenicLandmarks','seed',
 ].sort());
});

it('P0: Worker owns the same deterministic road and coast biome for each metre',()=>{
 const runtime=coastWorkerRoad(),road=COAST_STAGE.road;
 for(let d=0;d<=runtime.track.length;d+=37){
  const pose=runtime.track.sample(d);
  expect(pose.position.toArray().every(Number.isFinite)).toBe(true);
  expect(runtime.halfAt(d)).toBe(sampleAuthoredRoad(road,d).halfWidth);
  expect(runtime.weightsAt(d)).toEqual([1,0,0]);
 }
 expect(runtime.track.length).toBe(road.startDistance+road.length+600);
});

it('P0: editing road and scene seed changes Worker output without a generator',()=>{
 const revised:CoastStageContent={...COAST_STAGE,
  manifest:{...COAST_STAGE.manifest,seed:912,name:'Revised sunset coast'},
  road:{...COAST_STAGE.road,turns:COAST_STAGE.road.turns.map((t,i)=>
   i===0?{...t,steer:-.6}:t)},
 };
 const next=coastWorkerRoad(revised),before=coastWorkerRoad();
 expect(next.stage.seed).toBe(912);
 const first=revised.road.turns[0],mid=(first.start+first.end)/2;
 expect(next.track.sample(mid).curvature).not.toBeCloseTo(before.track.sample(mid).curvature,8);
});

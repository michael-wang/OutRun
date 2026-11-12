import {expect,it} from 'vitest';
import {COAST_STAGE,type CoastStageContent} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotCourse,pilotSample,pilotWeights} from '../src/pilot-composer';

it('R2f: the coastal Worker metadata is derived from content rather than Trip',()=>{
 const actual=coastWorkerRoad(),legacy=COAST_ULTRA_STAGE;
 expect(actual.stage.kind).toBe('authored-coast');
 expect(actual.stage.id).toBe(legacy.id);
 expect(actual.course).toEqual(pilotCourse(legacy));
 expect(actual.stage.generatorVersion).toBe(legacy.generatorVersion);
 expect(actual.stage.seed).toBe(legacy.seed);
 expect(actual.stage.sceneryAct).toBe(legacy.sceneryAct);
 expect(actual.stage.scenerySections).toEqual(legacy.scenerySections);
 expect(actual.stage.scenicLandmarks).toEqual(legacy.scenicLandmarks);
 for(const field of ['placements','worldPhases','beats','buffers','fixedRoad','authoredRoad'])
  expect(actual.stage).not.toHaveProperty(field);
});

it('R2f: Worker road matches the accepted geometry, bank, width and biome',()=>{
 const direct=coastWorkerRoad(),legacy=COAST_ULTRA_STAGE;
 const before=createPilotTrack(legacy);
 expect(direct.track.length).toBe(before.length);
 const distances=new Set<number>([0,350,1085,3150,6800,10350,10950]);
 for(let d=0;d<=before.length;d+=37)distances.add(d);
 for(const turn of COAST_STAGE.road.turns)
  for(const edge of [turn.start,turn.end])
   for(const delta of [-.01,0,.01])distances.add(edge+delta);
 for(const d of [...distances].sort((a,b)=>a-b)){
  const a=direct.track.sample(d),b=before.sample(d);
  expect(a.position.distanceTo(b.position),`position at ${d}`).toBeLessThan(1e-6);
  expect(a.right.y,`bank at ${d}`).toBeCloseTo(b.right.y,9);
  expect(a.roadHeading,`heading at ${d}`).toBeCloseTo(b.roadHeading,9);
  expect(a.curvature,`curvature at ${d}`).toBeCloseTo(b.curvature,9);
  expect(direct.halfAt(d),`halfWidth at ${d}`).toBeCloseTo(pilotSample(legacy,d).halfWidth,9);
  expect(direct.weightsAt(d),`biome at ${d}`).toEqual(pilotWeights(legacy,d));
 }
});

it('R2f: road and metadata edits work without derived Pilot placements',()=>{
 const changed:CoastStageContent={...COAST_STAGE,
  manifest:{...COAST_STAGE.manifest,seed:912,name:'Another sunset coast'},
  road:{...COAST_STAGE.road,turns:COAST_STAGE.road.turns.map((t,i)=>i===0?{...t,steer:-.6}:t)},
 };
 const updated=coastWorkerRoad(changed),old=coastWorkerRoad();
 expect(updated.stage.seed).toBe(912);
 expect(updated.track.sample(650).curvature).not.toBeCloseTo(old.track.sample(650).curvature,8);
});

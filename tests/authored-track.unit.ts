import {expect,it} from 'vitest';
import {coastAuthoredRoad,type AuthoredRoad} from '../src/content/authored-road';
import {authoredRoadCourse,createAuthoredCoastTrack} from '../src/content/authored-track';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotCourse} from '../src/pilot-composer';

const legacy={...COAST_ULTRA_STAGE,authoredRoad:undefined};

it('R2c: the road JSON builds exactly the accepted road spans',()=>{
 expect(authoredRoadCourse(coastAuthoredRoad,COAST_ULTRA_STAGE)).toEqual(pilotCourse(legacy));
 expect(pilotCourse(COAST_ULTRA_STAGE)).toEqual(pilotCourse(legacy));
});

it('R2c: direct coast track preserves position, heading, slope, bank and events',()=>{
 const before=createPilotTrack(legacy),after=createAuthoredCoastTrack(coastAuthoredRoad,COAST_ULTRA_STAGE);
 expect(after.length).toBe(before.length);
 const samples=new Set([0,350,1085,3150,6800,10350,10950]);
 for(let d=0;d<=before.length;d+=23)samples.add(d);
 for(const turn of coastAuthoredRoad.turns)
  for(const edge of [turn.start,turn.end])
   for(const delta of [-.01,0,.01])samples.add(edge+delta);
 for(const d of [...samples].sort((a,b)=>a-b)){
  const a=after.sample(d),b=before.sample(d);
  expect(a.position.distanceTo(b.position),`position at ${d}`).toBeLessThan(1e-6);
  expect(a.tangent.distanceTo(b.tangent),`tangent at ${d}`).toBeLessThan(1e-7);
  expect(a.right.distanceTo(b.right),`bank at ${d}`).toBeLessThan(1e-7);
  expect(a.roadHeading,`heading at ${d}`).toBeCloseTo(b.roadHeading,9);
  expect(a.curvature,`curvature at ${d}`).toBeCloseTo(b.curvature,9);
  expect(a.challenge,`road span at ${d}`).toEqual(b.challenge);
 }
});

it('R2c: the live coast road ignores obsolete Pilot placements',()=>{
 const noPlacements={...COAST_ULTRA_STAGE,placements:[]};
 expect(pilotCourse(noPlacements)).toEqual(pilotCourse(COAST_ULTRA_STAGE));
 const current=createPilotTrack(COAST_ULTRA_STAGE),detached=createPilotTrack(noPlacements);
 for(const d of [350,650,1085,3150,6800,10350])
  expect(detached.sample(d).position.distanceTo(current.sample(d).position)).toBeLessThan(1e-6);
});

it('R2c: editing JSON changes the track even when compatibility placements stay old',()=>{
 const road=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 road.turns[0].steer=-.72;
 road.elevations[0].rise=2.5;
 const edited=createPilotTrack({...COAST_ULTRA_STAGE,authoredRoad:road});
 const baseline=createPilotTrack(COAST_ULTRA_STAGE);
 expect(edited.sample(650).curvature).not.toBeCloseTo(baseline.sample(650).curvature,8);
 expect(edited.sample(5000).position.y).not.toBeCloseTo(baseline.sample(5000).position.y,8);
});

import {expect,it} from 'vitest';
import {coastAuthoredRoad,authoredRoadPlacements,validateAuthoredRoad,type AuthoredRoad}
 from '../src/content/authored-road';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';

/** P0: an authored road must be finite, driveable and a shared source for all
 * samplers. Do not pin artistic corner intensities; human playtesting owns feel. */
it('uses a finite authored coast road for rendering, collision and racing',()=>{
 validateAuthoredRoad(coastAuthoredRoad);
 expect(coastAuthoredRoad.id).toBe('coast');
 expect(COAST_ULTRA_STAGE.length).toBe(coastAuthoredRoad.length);
 expect(COAST_ULTRA_STAGE.baseLanes).toBe(coastAuthoredRoad.lanes);
 expect(COAST_ULTRA_STAGE.placements).toEqual(authoredRoadPlacements(coastAuthoredRoad));
 const track=createPilotTrack(COAST_ULTRA_STAGE);
 expect(track.length).toBeGreaterThanOrEqual(coastAuthoredRoad.startDistance+coastAuthoredRoad.length);
 for(let d=coastAuthoredRoad.startDistance;d<=coastAuthoredRoad.startDistance+coastAuthoredRoad.length;d+=250){
  const pose=track.sample(d),road=pilotSample(COAST_ULTRA_STAGE,d);
  expect(pose.position.toArray().every(Number.isFinite),`position at ${d}`).toBe(true);
  expect(Number.isFinite(pose.curvature)).toBe(true);
  expect(Number.isFinite(pose.roadHeading)).toBe(true);
  expect(Number.isFinite(pose.right.y)).toBe(true);
  expect(Number.isFinite(road.grade)).toBe(true);
  expect(road.halfWidth).toBeGreaterThan(0);
 }
});

it('allows editing a sweep and a crest solely in stage data',()=>{
 const copy=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 const first=copy.turns[0],elevation=copy.elevations[0];
 first.steer=.61;
 elevation.rise=2.5;
 const placements=authoredRoadPlacements(copy);
 const turn=placements.find(x=>x.channel==='curvature'&&x.beat===first.label);
 const hill=placements.find(x=>x.channel==='elevation'&&x.beat===elevation.label);
 expect(turn?.channel).toBe('curvature');
 if(turn?.channel==='curvature'){
  expect(turn.startS).toBe(first.start-copy.startDistance);
  expect(turn.endS).toBe(first.end-copy.startDistance);
  expect(turn.parameters.effort).toBeCloseTo(.61);
  expect(turn.parameters.direction).toBe(1);
 }
 expect(hill?.channel).toBe('elevation');
 if(hill?.channel==='elevation'){
  expect(hill.parameters.amplitude).toBeCloseTo(2.5);
  expect(hill.parameters.base).toBe(elevation.base);
 }
});

it('rejects bad or overlapping segments before any road chunk loads',()=>{
 const invalid=(change:(data:AuthoredRoad)=>void)=>{
  const copy=structuredClone(coastAuthoredRoad) as AuthoredRoad;
  change(copy);
  expect(()=>authoredRoadPlacements(copy)).toThrow();
 };
 invalid(x=>{x.turns[0].end=x.turns[1].end;});
 invalid(x=>{x.turns[0].start=x.startDistance-1;});
 invalid(x=>{x.turns[0].steer=Infinity;});
 invalid(x=>{x.turns[0].shape='invalid' as 'sweep';});
 invalid(x=>{x.lanes=0 as 5;});
 invalid(x=>{x.elevations[0].end=x.startDistance+x.length+1;});
});

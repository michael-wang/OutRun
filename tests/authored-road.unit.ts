import {expect,it} from 'vitest';
import {coastAuthoredRoad,authoredRoadPlacements,sampleAuthoredRoad,validateAuthoredRoad,type AuthoredRoad}
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

it('R2b: direct stage samples match the accepted legacy route, including knot boundaries',()=>{
 const legacy={...COAST_ULTRA_STAGE,authoredRoad:undefined};
 const points=new Set<number>([0,349.99,350,1085,3150,6800,10350,10400]);
 for(let d=350;d<=10350;d+=11)points.add(d);
 for(const section of [...coastAuthoredRoad.turns,...coastAuthoredRoad.elevations])
  for(const knot of [section.start,section.end])
   for(const epsilon of [-.001,0,.001])points.add(knot+epsilon);
 for(const d of [...points].sort((a,b)=>a-b)){
  const actual=pilotSample(COAST_ULTRA_STAGE,d),expected=pilotSample(legacy,d);
  for(const key of ['demand','height','grade','lanes','halfWidth'] as const)
   expect(actual[key],`distance ${d}: ${key}`).toBeCloseTo(expected[key],10);
  expect(actual.active,`distance ${d}: active segments`).toEqual(expected.active);
 }
 // The public road pose is what camera, collisions, rivals and meshes share.
 const current=createPilotTrack(COAST_ULTRA_STAGE),previous=createPilotTrack(legacy);
 expect(current.length).toBe(previous.length);
 for(let d=0;d<=current.length;d+=125){
  const actual=current.sample(d),expected=previous.sample(d);
  expect(actual.position.distanceTo(expected.position),`road pose at ${d}`).toBeLessThan(1e-6);
  expect(actual.right.y,`road bank at ${d}`).toBeCloseTo(expected.right.y,9);
  expect(actual.curvature,`road curvature at ${d}`).toBeCloseTo(expected.curvature,9);
 }
});

it('R2b: runtime geometry reads edited road JSON even if legacy placements are stale',()=>{
 const edited=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 edited.turns[0].steer=-.72;
 edited.elevations[0].rise=2.7;
 const changed={...COAST_ULTRA_STAGE,authoredRoad:edited};
 const d=650;
 expect(pilotSample(changed,d).demand).toBeCloseTo(sampleAuthoredRoad(edited,d).demand,12);
 expect(pilotSample(changed,d).demand).not.toBeCloseTo(pilotSample({...changed,authoredRoad:undefined},d).demand,5);
 expect(pilotSample(changed,5000).height).not.toBeCloseTo(pilotSample(COAST_ULTRA_STAGE,5000).height,5);
});

it('R2b: reject elevations that would snap the road vertically',()=>{
 const edited=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 edited.elevations[0].base+=2;
 expect(()=>validateAuthoredRoad(edited)).toThrow('Discontinuous authored elevation');
});

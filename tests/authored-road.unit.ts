import {expect,it} from 'vitest';
import {coastAuthoredRoad,authoredRoadPlacements,sampleAuthoredRoad,validateAuthoredRoad,type AuthoredRoad}
 from '../src/content/authored-road';
import {createAuthoredCoastTrack} from '../src/content/authored-track';
import {COAST_STAGE,COAST_RUNTIME_IDENTITY} from '../src/content/coast-stage';
import {sweepKnots,riseKnots,profile} from '../src/content/road-shapes';

it('P0: a finite authored road drives rendering, traffic and collision from the same data',()=>{
 const road=coastAuthoredRoad,track=createAuthoredCoastTrack(road,{id:COAST_RUNTIME_IDENTITY.id,name:COAST_STAGE.manifest.name,sceneryAct:0});
 expect(()=>validateAuthoredRoad(road)).not.toThrow();
 expect(road.id).toBe('coast');expect(road.lanes).toBe(5);
 expect(track.length).toBe(road.startDistance+road.length+600);
 for(let d=0;d<=track.length;d+=73){
  const pose=track.sample(d),sample=sampleAuthoredRoad(road,d);
  expect(pose.position.toArray().every(Number.isFinite),`position ${d}`).toBe(true);
  expect(pose.tangent.toArray().every(Number.isFinite)).toBe(true);
  expect(Number.isFinite(pose.curvature+pose.roadHeading+pose.right.y)).toBe(true);
  expect(Number.isFinite(sample.grade)).toBe(true);
  expect(sample.halfWidth).toBeCloseTo(road.lanes*1.75,9);
 }
});

it('P0: the approved C02/E02 cosine knots preserve exact endpoints and midpoint',()=>{
 const road=coastAuthoredRoad;
 for(const turn of road.turns){
  const knots=sweepKnots(turn.steer);
  expect(profile(knots,0).value).toBe(0);
  expect(profile(knots,.5).value).toBeCloseTo(turn.steer,12);
  expect(profile(knots,1).value).toBe(0);
  const midpoint=(turn.start+turn.end)/2;
  expect(sampleAuthoredRoad(road,midpoint).demand).toBeCloseTo(turn.steer,12);
 }
 for(const slope of road.elevations){
  const knots=riseKnots(slope.base,slope.rise);
  expect(profile(knots,0).value).toBe(slope.base);
  expect(profile(knots,.5).value).toBeCloseTo(slope.base+slope.rise/2,12);
  expect(profile(knots,1).value).toBeCloseTo(slope.base+slope.rise,12);
 }
});

it('P0: changing authored road controls actual geometry, not generated placements',()=>{
 const road=structuredClone(coastAuthoredRoad) as AuthoredRoad;
 const p=authoredRoadPlacements(road);
 expect(p).toHaveLength(road.turns.length+road.elevations.length);
 road.turns[0].steer=-.72;road.elevations[0].rise=2.7;
 for(let i=1;i<road.elevations.length;i++)road.elevations[i].base=road.elevations[i-1].base+road.elevations[i-1].rise;
 const distance=(road.turns[0].start+road.turns[0].end)/2;
 expect(sampleAuthoredRoad(road,distance).demand).toBeCloseTo(-.72,10);
 expect(sampleAuthoredRoad(road,distance).demand).not.toBeCloseTo(sampleAuthoredRoad(coastAuthoredRoad,distance).demand,5);
 expect(sampleAuthoredRoad(road,5000).height).not.toBeCloseTo(sampleAuthoredRoad(coastAuthoredRoad,5000).height,5);
 expect(p[0].parameters).toBeDefined(); // stale export projection does not control geometry
});

it('P0: reject discontinuities, overlaps and invalid widths before Worker chunks',()=>{
 const invalid=(change:(road:AuthoredRoad)=>void)=>{
  const data=structuredClone(coastAuthoredRoad) as AuthoredRoad;change(data);
  expect(()=>validateAuthoredRoad(data)).toThrow();
 };
 invalid(r=>{r.turns[0].end=r.turns[1].end;});
 invalid(r=>{r.turns[0].start=r.startDistance-1;});
 invalid(r=>{r.turns[0].steer=Infinity;});
 invalid(r=>{r.turns[0].shape='invalid' as 'sweep';});
 invalid(r=>{r.lanes=0 as 5;});
 invalid(r=>{r.elevations[0].end=r.startDistance+r.length+1;});
 invalid(r=>{r.elevations[0].base+=2;});
});

import {expect,it,vi} from 'vitest';
import {COAST_STAGE} from '../src/content/coast-stage';
import * as profile from '../src/content/authored-road';
import {authoredRoadCourse,createAuthoredCoastTrack} from '../src/content/authored-track';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {createTrack} from '../src/track';
import {curvatureForDemand} from '../src/challenges';
import {generatedBank,seamlessBank} from '../src/banking';

it('preserves every scalar/vector pose, normalized endpoint, and bank around route seams',()=>{
 const road=COAST_STAGE.road,identity={id:'authored-coast',name:'Coast',sceneryAct:0};
 const course=authoredRoadCourse(road,identity);
 const old=createTrack({course,loop:false,banking:true,smoothBank:true,
  heightAt:d=>profile.sampleAuthoredRoad(road,d),
  demandAt:d=>profile.sampleAuthoredRoad(road,d).demand,
  bankAt:seamlessBank(course.at(-1)!.end,
   d=>generatedBank(curvatureForDemand(profile.sampleAuthoredRoad(road,d).demand),[1,0,0],3),
   road.banks??[]),
 });
 const cached=createAuthoredCoastTrack(road,identity);
 const arbitrary=Array.from({length:1800},(_,i)=>((i*683+17)%15091)+((i*31)%7)*.015625);
 for(const d of [-50,0,350,4510,4790,4800,6020,6800,7100,7540,8410,14550,15300,...arbitrary]){
  expect(cached.sample(d)).toStrictEqual(old.sample(d));
 }
 const modified=cached.sample(4800),normal=cached.sample(4800);
 modified.position.set(-2,-2,-2);modified.right.set(-3,-3,-3);modified.tangent.set(-4,-4,-4);
 expect(cached.sample(4800)).toStrictEqual(normal);
});

it('evaluates one scalar profile for the same exact station and none for constant authored width',()=>{
 const sampler=vi.spyOn(profile,'sampleAuthoredRoad');
 try{
  const road=COAST_STAGE.road,identity={id:'authored-coast',name:'Coast',sceneryAct:0};
  const track=createAuthoredCoastTrack(road,identity),worker=coastWorkerRoad();
  sampler.mockClear();
  const d=4800.03;
  track.sample(d);track.sample(d);track.sample(d+.001);track.sample(d+.001);
  expect(sampler.mock.calls.map(([,distance])=>distance)).toEqual([d,d+.001]);
  sampler.mockClear();
  for(const distance of [-50,350,4800,15300,NaN])expect(worker.halfAt(distance)).toBe(profile.authoredHalfWidth(road));
  expect(sampler).not.toHaveBeenCalled();
 }finally{sampler.mockRestore();}
});
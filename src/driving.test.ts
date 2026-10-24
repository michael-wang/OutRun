import { describe, expect, it } from 'vitest';
import { createState,step,updateFootprint } from './handling';
import { createTrack } from './track';
import { scriptedDriver } from '../tests/driver';
import { CHASE,chaseTargets } from './chase';
import { Vector3 } from 'three';
const track=createTrack();
describe('v0.2 steering agency',()=>{
  for(const [label,start] of [['right',820],['left',1980]] as const){
    it(`${label}: same bend requires steering and accepts digital corrections`,()=>{
      const initial={...createState(),distance:start,speed:45,worldHeading:track.sample(start).roadHeading};
      const neutral={...initial},steered={...initial},driver=scriptedDriver();let departed=false,maxEdge=0;
      for(let i=0;i<60;i++){
        const input=driver(steered,track.sample(steered.distance).curvature);
        for(let f=0;f<12;f++){
          step(neutral,{gas:true,brake:false,steer:0},1/120,track.sample(neutral.distance).curvature);
          step(steered,input,1/120,track.sample(steered.distance).curvature);
          departed ||= neutral.offRoad;maxEdge=Math.max(maxEdge,steered.footprintEdge);
        }
      }
      console.log(label,{neutral:neutral.lateral,offRoad:neutral.offRoad,steered:steered.lateral,maxEdge});
      expect(departed).toBe(true);expect(neutral.worldHeading).toBe(initial.worldHeading);
      expect(maxEdge).toBeLessThan(7);expect(steered.distance).toBeGreaterThan(start+200);
    });
  }
  it('footprint, not just center, triggers gradual drag and recovery releases it',()=>{
    const road={...createState(),speed:55},dirt={...createState(),speed:55,lateral:6};
    updateFootprint(dirt);expect(dirt.offRoad).toBe(true);
    for(let i=0;i<360;i++){step(road,{gas:true,brake:false,steer:0},1/120,0);step(dirt,{gas:true,brake:false,steer:0},1/120,0);}
    const ratio=dirt.speed/road.speed;expect(ratio).toBeGreaterThan(.6);expect(ratio).toBeLessThan(.75);
    const driver=scriptedDriver();let recovered=false;
    for(let i=0;i<60;i++){const input=driver(dirt,0);for(let f=0;f<12;f++)step(dirt,input,1/120,0);recovered||=!dirt.offRoad;}
    expect(recovered).toBe(true);expect(dirt.speed).toBeGreaterThan(50);
  });
  it('stationary steering neither moves nor rotates the car',()=>{
    const s=createState();for(let i=0;i<120;i++)step(s,{gas:false,brake:false,steer:1},1/60,.01);
    expect([s.distance,s.lateral,s.heading,s.worldHeading]).toEqual([0,0,0,0]);
  });
  it('camera target geometry has no speed input and fixed FOV/offset',()=>{
    const position=new Vector3(4,10,20),a=chaseTargets(position,.2),b=chaseTargets(position,.2);
    expect(a).toEqual(b);expect(a.eye.distanceTo(position)).toBeCloseTo(Math.hypot(CHASE.distance,CHASE.height));expect(CHASE.horizontalFov).toBe(76);
  });
  it('continuous road includes pronounced climb crest descent and both directions',()=>{
    const samples=Array.from({length:500},(_,i)=>track.sample(track.length*i/500));
    expect(Math.max(...samples.map(p=>p.position.y))-Math.min(...samples.map(p=>p.position.y))).toBeGreaterThan(80);
    expect(Math.min(...samples.map(p=>p.tangent.y))).toBeLessThan(-.04);expect(Math.max(...samples.map(p=>p.tangent.y))).toBeGreaterThan(.04);
    expect(Math.min(...samples.map(p=>p.curvature))).toBeLessThan(-.003);expect(Math.max(...samples.map(p=>p.curvature))).toBeGreaterThan(.003);
  });
});

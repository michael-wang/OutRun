import {expect,it} from 'vitest';
import {Vector3} from 'three';
import {RoadClearance} from '../src/road-clearance';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';

it('indexed clearance preserves the full-route predicate, including remote bends and variable widths',()=>{
 const stage=generateTrip(1),track=createPilotTrack(stage);
 const points=Array.from({length:Math.ceil(track.length/25)},(_,i)=>track.sample(i*25).position);
 const widths=points.map((_,i)=>pilotSample(stage,i*25).halfWidth),index=new RoadClearance(points,d=>widths[d/25],true);
 const brute=(base:Vector3,radius:number)=>points.slice(0,-1).every((a,i)=>{
  const b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((base.x-a.x)*dx+(base.z-a.z)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(a.x+t*dx-base.x,a.z+t*dz-base.z)>radius+widths[i]+5;
 });
 for(let d=0;d<track.length;d+=137){const p=track.sample(d);for(const offset of [-350,-80,-20,0,20,80,350]){
  const base=p.position.clone().addScaledVector(p.right,offset),radius=[3,13,43,110][Math.floor(d/137)%4];
  expect(index.clear(base,radius)).toBe(brute(base,radius));
 }}
 expect(index.stats.checks).toBeLessThan(index.stats.queries*points.length*.05);
},30000);

it('retains closed-route seam checks and exact clearance boundaries',()=>{
 const points=[new Vector3(0,0,0),new Vector3(0,0,100),new Vector3(100,0,100)];
 const closed=new RoadClearance(points,()=>7),open=new RoadClearance(points,()=>7,true);
 expect(closed.clear({x:50,z:50},0)).toBe(false);expect(open.clear({x:50,z:50},0)).toBe(true);
 expect(open.clear({x:-12,z:50},0)).toBe(false);expect(open.clear({x:-12.001,z:50},0)).toBe(true);
});

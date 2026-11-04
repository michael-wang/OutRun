import {expect,it} from 'vitest';
import * as THREE from 'three';
import {journeyChapters} from '../src/scenic-journey';
import {createPilotTrack} from '../src/pilot-composer';
import {highwayExtension,LINK_HALF,LINK_EASE,MOODS} from '../src/journey-link';

it('meets native road position, grade and bank then settles to a flat highway',()=>{
 for(const c of journeyChapters())for(const sign of [-1,1] as const){
  const at=sign<0?c.start:c.end,native=createPilotTrack(c.stage).sample,extension=highwayExtension(native,at,sign),p=native(at),q=extension(at);
  expect(q.position.distanceTo(p.position)).toBeLessThan(1e-6);
  expect(q.roadHeading).toBeCloseTo(p.roadHeading,8);
  expect(q.right.y).toBeCloseTo(p.right.y,8);
  expect(q.tangent.distanceTo(p.tangent)).toBeLessThan(.001);
  const flat=extension(at+sign*(LINK_EASE+20));expect(Math.abs(flat.tangent.y)).toBeLessThan(1e-8);expect(Math.abs(flat.right.y)).toBeLessThan(1e-8);expect(Math.abs(flat.curvature)).toBeLessThan(1e-8);
 }
});

it('has congruent overlap road, lane phase and sun direction across the rigid rebase',()=>{
 const chapters=journeyChapters(),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<2;i++){
  const a=chapters[i],b=chapters[i+1],out=highwayExtension(createPilotTrack(a.stage).sample,a.end,1),entry=highwayExtension(createPilotTrack(b.stage).sample,b.start,-1);
  const p=out(a.end+LINK_HALF),q=entry(b.start-LINK_HALF),delta=q.roadHeading-p.roadHeading;
  for(const offset of [-80,-20,0,20,80]){
   const source=out(a.end+LINK_HALF+offset).position.sub(p.position).applyAxisAngle(up,-delta),target=entry(b.start-LINK_HALF+offset).position.sub(q.position);
   expect(source.distanceTo(target)).toBeLessThan(1e-6);
  }
  expect(2*LINK_HALF%48).toBe(0);expect(2*LINK_HALF%64).toBe(0);
  const oldSun=MOODS[b.id].sun.clone().applyAxisAngle(up,delta);expect(oldSun.applyAxisAngle(up,-delta).distanceTo(MOODS[b.id].sun)).toBeLessThan(1e-10);
 }
});
import {endlessHighway,LINK_CYCLE} from '../src/journey-link';
it('recycles smooth highway bends indefinitely and exits on a congruent straight',()=>{
 const c=journeyChapters()[0],road=endlessHighway(createPilotTrack(c.stage).sample,c.end);
 let maxCurve=0;
 for(let u=0;u<LINK_CYCLE;u+=4){const a=road.sample(road.start+u),b=road.sample(road.start+u+100*LINK_CYCLE);expect(b.position.clone().sub(a.position).distanceTo(road.stride.clone().multiplyScalar(100))).toBeLessThan(1e-7);maxCurve=Math.max(maxCurve,Math.abs(a.curvature));}
 expect(maxCurve).toBeGreaterThan(.0001);expect(maxCurve).toBeLessThan(.001);
 for(const lap of [0,1,2,100]){const at=road.start+lap*LINK_CYCLE,left=road.sample(at-.001),right=road.sample(at+.001);expect(left.position.distanceTo(right.position)).toBeCloseTo(.002,5);expect(left.tangent.distanceTo(right.tangent)).toBeLessThan(1e-8);}
 const at=road.start+LINK_CYCLE*.7,exit=road.exitAfter(at);expect(exit-at).toBeGreaterThanOrEqual(400);
 for(let u=-390;u<=390;u+=10)expect(Math.abs(road.sample(exit+u).curvature)).toBeLessThan(1e-8);
 expect(LINK_CYCLE%96).toBe(0);expect(LINK_CYCLE%64).toBe(0);
});

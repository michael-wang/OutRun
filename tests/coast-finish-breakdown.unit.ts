import {it,expect} from 'vitest';
import * as THREE from 'three';
import {breakdownLayout,COAST_BREAKDOWN} from '../src/breakdowns';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';
import {COAST_ULTRA_STAGE,COAST_ULTRA_LENGTH} from '../src/coast-ultra-stage';
import {BRICK_START} from '../src/bricks';

const flat=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),curvature:0,roadHeading:0,
}) as ReturnType<typeof createPilotTrack>['sample'] extends (d:number)=>infer R?R:never;

it('keeps ONE safe stopped car in the final coast approach, nowhere near credits',()=>{
 const length=10000;
 const broken=breakdownLayout(flat,()=>8.75,length,804,true);
 expect(broken).toHaveLength(COAST_BREAKDOWN.maxCount);
 const d=broken[0].distance;
 expect(d).toBeGreaterThan(length-COAST_BREAKDOWN.firstBeforeEnd);
 expect(d).toBeLessThan(length-COAST_BREAKDOWN.lastBeforeEnd);
 expect(broken[0].stationary).toBe(true);
 expect(d-240).toBeGreaterThan(8000); // warning signs also late
 for(const seed of [1,7,24,804]){
  const current=breakdownLayout(flat,()=>8.75,length,seed,true);
  expect(current.length).toBeLessThanOrEqual(1);
  expect(current.every(x=>x.distance<length-COAST_BREAKDOWN.lastBeforeEnd)).toBe(true);
 }
});
it('preserves earlier non-coast stopped-car design and scans the real coast safely',()=>{
 const legacy=breakdownLayout(flat,()=>8.75,69000,1,false);
 expect(legacy.length).toBeGreaterThan(1);
 expect(legacy[0].distance).toBeLessThan(3500);
 const track=createPilotTrack(COAST_ULTRA_STAGE);
 const finishAt=BRICK_START+COAST_ULTRA_LENGTH;
 const coastal=breakdownLayout(track.sample,
  d=>pilotSample(COAST_ULTRA_STAGE,d).halfWidth,finishAt,804,true);
 expect(coastal.length).toBeLessThanOrEqual(1);
 for(const car of coastal){
  expect(car.distance).toBeGreaterThan(finishAt-COAST_BREAKDOWN.firstBeforeEnd);
  expect(car.distance).toBeLessThan(finishAt-COAST_BREAKDOWN.lastBeforeEnd);
 }
});

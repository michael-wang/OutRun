import {it,expect} from 'vitest';
import * as THREE from 'three';
import {breakdownLayout,COAST_BREAKDOWN,warningLeaders} from '../src/breakdowns';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {COAST_STAGE} from '../src/content/coast-stage';
import {ROAD_START} from '../src/road-profile';

const flat=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),curvature:0,roadHeading:0,
}) as ReturnType<typeof coastWorkerRoad>['track']['sample'] extends (d:number)=>infer R?R:never;

it('seeds up to two coastal breakdowns across the whole road, in any lane',()=>{
 const length=10000;
 const seed=804,broken=breakdownLayout(flat,()=>8.75,length,seed,true);
 expect(broken.length).toBeGreaterThan(0);
 expect(broken.length).toBeLessThanOrEqual(COAST_BREAKDOWN.maxSites*2);
 const allLanes=new Set<number>();
 const allSites=new Set<number>();
 for(const variant of [1,7,24,804,99,1206,3025,4380,8677]){
  const rows=breakdownLayout(flat,()=>8.75,length,variant,true);
  const leaders=warningLeaders(rows);
  expect(leaders.length).toBeLessThanOrEqual(COAST_BREAKDOWN.maxSites);
  expect(rows.length).toBe(leaders.length*2);
  for(const lead of leaders){
   const pair=rows.filter(row=>row.incidentId===lead.id);
   expect(pair).toHaveLength(2);
   expect(pair[1].distance-pair[0].distance).toBe(19);
   expect(pair[0].stopYaw!*pair[1].stopYaw!).toBeLessThan(0);
   expect(Math.abs(pair[0].stopLane-pair[1].stopLane)).toBeLessThanOrEqual(1);
  }
  for(const b of rows){
   expect(b.stationary).toBe(true);
   expect(b.distance).toBeGreaterThanOrEqual(COAST_BREAKDOWN.startClearance);
   expect(b.distance).toBeLessThan(length-COAST_BREAKDOWN.finishClearance);
   expect(b.stopLane).toBeGreaterThanOrEqual(0);
   expect(b.stopLane).toBeLessThan(5);
   allLanes.add(b.stopLane);allSites.add(b.distance);
  }
 }
 expect(allSites.size).toBeGreaterThan(5);
 expect(allLanes.has(0)).toBe(true);expect(allLanes.has(4)).toBe(true);
 expect([...allLanes].some(lane=>lane>0&&lane<4)).toBe(true);
});
it('preserves earlier non-coast stopped-car design and scans the real coast safely',()=>{
 const legacy=breakdownLayout(flat,()=>8.75,69000,1,false);
 expect(legacy.length).toBeGreaterThan(1);
 expect(legacy[0].distance).toBeLessThan(3500);
 const track=coastWorkerRoad().track;
 const finishAt=ROAD_START+COAST_STAGE.road.length;
 const coastal=breakdownLayout(track.sample,
  coastWorkerRoad().halfAt,finishAt,804,true);
 expect(coastal.length).toBeLessThanOrEqual(COAST_BREAKDOWN.maxSites*2);
 for(const car of coastal){
  expect(car.distance).toBeGreaterThanOrEqual(COAST_BREAKDOWN.startClearance);
  expect(car.distance).toBeLessThan(finishAt-COAST_BREAKDOWN.finishClearance);
 }
});

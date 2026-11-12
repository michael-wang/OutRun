import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastAccidentLayout} from '../src/content/coast-accident';
import {roadLaneCenters} from '../src/traffic-flow';
import {TRAFFIC_TYPES,Traffic} from '../src/traffic';
import {RoadCones} from '../src/road-cones';

const {track,halfAt}=coastWorkerRoad(),site=COAST_STAGE.onboarding.accident;
const generate=(seed:number)=>coastAccidentLayout(halfAt,site,seed);

it('R5b.1: the first real accident occurs in an authored curve, not a straight',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(site.start).toBe(4410);
 expect(site.end).toBe(4890);
 for(const seed of [1,7,42,804,912384]){
  const cars=generate(seed);
  expect(cars.length).toBeGreaterThanOrEqual(2);
  expect(cars.length).toBeLessThanOrEqual(3);
  expect(generate(seed)).toEqual(cars);
  expect(cars.every(c=>c.stationary&&c.speed===0&&c.incidentId==='A4')).toBe(true);
  expect(cars.every(c=>c.stopLane===roadLaneCenters(halfAt(site.distance)).length-1)).toBe(true);
  expect(new Set(cars.map(c=>c.id)).size).toBe(cars.length);
  expect(cars.every(c=>c.distance>=site.start+140&&c.distance<=site.end-120)).toBe(true);
  expect(cars.some(c=>c.stopYaw<0)&&cars.some(c=>c.stopYaw>0)).toBe(true);
  for(const car of cars){
   expect(Math.abs(track.sample(car.distance).curvature)).toBeGreaterThan(.0008);
   expect(Math.abs(car.stopYaw)).toBeGreaterThan(.08);
   expect(Math.abs(car.stopYaw)).toBeLessThan(.26);
  }
 }
 const differs=[1,7,42,804].map(seed=>generate(seed).map(c=>[c.distance,c.stopYaw]));
 expect(new Set(differs.map(x=>JSON.stringify(x))).size).toBeGreaterThan(1);
});

it('R5b.1: angled wreck bodies leave at least two actual drivable outer lanes',()=>{
 for(const seed of [1,2,7,42,804,912384]){
  const cars=generate(seed),lanes=roadLaneCenters(halfAt(site.distance));
  const open=lanes.filter(x=>cars.every(car=>{
   const center=lanes[car.stopLane];
   const model=TRAFFIC_TYPES[car.type],yaw=Math.abs(car.stopYaw);
   const halfBody=(model.width*Math.cos(yaw)+model.length*Math.sin(yaw))/2;
   return Math.abs(x-center)>halfBody+1.13+.15;
  }));
  expect(open.length,`genuine open lanes for seed ${seed}`).toBeGreaterThanOrEqual(site.minimumOpenLanes);
  expect(open).toContain(lanes[0]);
  // This first lesson deliberately occupies the right outside lane.
  expect(open).toContain(lanes[1]);
  expect(open).toContain(lanes[2]); // obvious left-hand escape corridor
 }
});

it('R5b.1: regular traffic, rivals and player reference the same angled obstacle state',()=>{
 const scene=new THREE.Scene(),cars=generate(42);
 const traffic=new Traffic(scene,track.sample,halfAt,track.length,804,
  ()=>true,cars,undefined,true,false,false,42,COAST_STAGE.onboarding.traffic);
 try{
  traffic.enableRaceMode();
  const wrecks=traffic.snapshot().world.cars.filter(c=>c.incidentId==='A4');
  expect(wrecks).toHaveLength(cars.length);
  for(const car of cars){
   const authoritative=wrecks.find(w=>w.id===car.id)!;
   const model=TRAFFIC_TYPES[car.type];
   expect(authoritative.stationary).toBe(true);
   expect(authoritative.stopYaw).toBe(car.stopYaw);
   expect(authoritative.width).toBeGreaterThan(model.width);
   expect(authoritative.length).toBeGreaterThan(0);
  }
  const sceneCarDraws=scene.children.filter(o=>o.name.startsWith('traffic-'));
  expect(sceneCarDraws.length).toBeGreaterThan(0);
 }finally{traffic.dispose();}
});

it('R5b.1: one warning sequence guides the bend, not nine obstructive sign sets',()=>{
 const scene=new THREE.Scene(),cars=generate(42);
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,cars);
 try{
  expect(signs.recipe).toHaveLength(3);
  const first=cars.find(c=>c.id===910000)!;
  expect(signs.recipe.map(s=>Math.round(first.distance-s.distance))).toEqual([310,195,90]);
  expect(signs.recipe.every(s=>s.distance<site.distance)).toBe(true);
 }finally{signs.dispose();}
});

it('R5b.2: later accident layouts can vary seeded lane choices',()=>{
 const later={...site,layout:'seeded-lanes' as const};
 const samples=[1,7,42,804].map(seed=>coastAccidentLayout(halfAt,later,seed));
 expect(new Set(samples.map(cars=>cars.map(c=>c.stopLane).join(','))).size).toBeGreaterThan(1);
 for(const cars of samples){
  expect(cars.length).toBeGreaterThanOrEqual(2);
  expect(cars.every(c=>c.distance>=later.start+140&&c.distance<=later.end-110)).toBe(true);
 }
});

it('R5b.2: civilian and rival sweeps knock the same physical reflectors airborne',()=>{
 const cars=generate(42),scene=new THREE.Scene();
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,cars);
 try{
  const first=signs.recipe[0],second=signs.recipe[1];
  const hit=(id:number,where:number,lateral:number,time:number)=>
   signs.hitByVehicles(time,[{
    id,previousDistance:where-18,previousLateral:lateral,
    distance:where+18,lateral,speed:72,halfWidth:1.1,
   }]);
  expect(hit(12,first.distance,-7,1)).toBe(0);
  expect(hit(12,first.distance,first.lateral!,1)).toBe(1);
  expect(hit(-1001,first.distance,first.lateral!,1.01)).toBe(0);
  expect(hit(-1002,second.distance,second.lateral!,2)).toBe(1);
  expect(signs.snapshot().flying).toHaveLength(2);
  expect(signs.snapshot().flying.every(([,flight])=>flight.forward>0&&flight.up>0)).toBe(true);
 }finally{signs.dispose();}
});

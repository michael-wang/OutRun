import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {coastAccidentLayout} from '../src/content/coast-accident';
import {roadLaneCenters} from '../src/traffic-flow';
import {TRAFFIC_TYPES,Traffic} from '../src/traffic';
import {RoadCones} from '../src/road-cones';
import {RivalRace,raceEntries} from '../src/rival-race';

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
   expect(authoritative.lateral).toBeCloseTo(roadLaneCenters(halfAt(car.distance))[car.stopLane]+(car.stopOffset??0));
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


it('R5b.2: a rival callback genuinely displaces the same crash car used by every actor',()=>{
 const scene=new THREE.Scene(),cars=generate(42);
 const traffic=new Traffic(scene,track.sample,halfAt,track.length,804,
  ()=>true,cars,undefined,true,false,false,42,COAST_STAGE.onboarding.traffic);
 try{
  traffic.enableRaceMode();
  const obstacle=traffic.raceObstacles(site.distance,0,200).find(o=>o.id==='T910000')!;
  expect(obstacle).toBeDefined();
  traffic.impactByRival(obstacle,.8,-1);
  const moved=traffic.snapshot().world.cars.find(c=>c.id===910000)!;
  expect(moved.incidentMotion?.hits).toBe(1);
  expect(moved.stationary).toBe(true);
 }finally{traffic.dispose();}
});

it('R5b.2: seeded later accidents keep a real two-lane escape corridor for 256 seeds',()=>{
 const later={...site,layout:'seeded-lanes' as const};
 const lanes=roadLaneCenters(halfAt(later.distance));
 for(let seed=0;seed<256;seed++){
  const cars=coastAccidentLayout(halfAt,later,seed);
  const open=lanes.filter(x=>cars.every(c=>{
   const model=TRAFFIC_TYPES[c.type];
   const yaw=Math.abs(c.stopYaw);
   const occupiedHalf=(model.width*Math.cos(yaw)+model.length*Math.sin(yaw))*.5;
   const center=lanes[c.stopLane]+(c.stopOffset??0);
   return Math.abs(x-center)>occupiedHalf+1.13+.15;
  }));
  expect(open.length,`seed ${seed}`).toBeGreaterThanOrEqual(later.minimumOpenLanes);
 }
});

it('R5b.3: right-side warnings are visible to racer AI before contact',()=>{
 const scene=new THREE.Scene(),stopped=generate(42);
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,stopped);
 try{
  const first=signs.recipe[0];
  const obstacles=signs.raceObstacles(first.distance-95,180);
  expect(obstacles.some(o=>o.id==='W'+first.id)).toBe(true);
  const warning=obstacles.find(o=>o.id==='W'+first.id)!;
  expect(warning.speed).toBe(0);
  expect(warning.width).toBeGreaterThan(2);
  expect(warning.lateral).toBe(first.lateral);
  expect(signs.knockByRival(first.id,1,80)).toBe(true);
  expect(signs.knockByRival(first.id,1.01,80)).toBe(false);
  expect(signs.raceObstacles(first.distance-95,180).some(o=>o.id==='W'+first.id)).toBe(false);
 }finally{signs.dispose();}
});

it('R5b.3: a fallen, rotated warning triangle never sinks into the banked asphalt',()=>{
 const scene=new THREE.Scene(),stopped=generate(42);
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,stopped);
 const mesh=scene.getObjectByName('breakdown-warning-objects') as THREE.InstancedMesh;
 try{
  const first=signs.recipe[0];
  expect(signs.knockByRival(first.id,1,70)).toBe(true);
  const verts=mesh.geometry.getAttribute('position'),matrix=new THREE.Matrix4();
  const point=new THREE.Vector3();
  for(const elapsed of [.2,.8,1.2,1.8,2.3]){
   const time=1+elapsed;
   signs.update(time,first.distance-10,0,0);
   const index=signs.inspect().shown.indexOf(first.id);
   expect(index).toBeGreaterThanOrEqual(0);
   mesh.getMatrixAt(index,matrix);
   const flight=signs.snapshot().flying.find(([id])=>id===first.id)![1];
   const forward=flight.forward*.72*(1-Math.exp(-elapsed/.72));
   const sideways=flight.sideways*.42*(1-Math.exp(-elapsed/.42));
   const road=track.sample(first.distance+forward);
   const base=road.position.y+road.right.y*(first.lateral!+sideways);
   let minY=Infinity;
   for(let i=0;i<verts.count;i++){
    point.fromBufferAttribute(verts,i).applyMatrix4(matrix);
    minY=Math.min(minY,point.y);
   }
   expect(minY,`triangle above road at flight age ${elapsed}`).toBeGreaterThanOrEqual(base-.002);
   if(elapsed>1.8)expect(minY-base).toBeLessThan(.15);
  }
 }finally{signs.dispose();}
});

it('R5b.3: a right-lane rival anticipates warning triangles instead of blindly driving through',()=>{
 const scene=new THREE.Scene(),stopped=generate(42);
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,stopped);
 try{
  const first=signs.recipe[0];
  const rivals=new RivalRace(track.length,
   d=>({curvature:track.sample(d).curvature,grade:0,half:halfAt(d)}),
   (d,_time,radius)=>signs.raceObstacles(d,radius),
   [raceEntries[4]]);
  rivals.reset(350);
  const r=rivals.rivals[0];
  r.distance=first.distance-125;
  r.previousDistance=r.distance;
  r.lateral=7;r.lane=4;r.targetLane=4;r.targetX=7;
  r.speed=62;r.nextDecision=0;
  const player={distance:350,lateral:-7,speed:0};
  rivals.step(.05,player,player);
  expect(r.obstacles.some(o=>o.id==='W'+first.id)).toBe(true);
  expect(r.targetLane<4||r.targetSpeed<r.speed).toBe(true);
 }finally{signs.dispose();}
});

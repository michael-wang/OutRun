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
 expect(site.start).toBe(2735);
 expect(site.end).toBe(3125);
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

it('uses real vehicle obstacles for race decisions and sweeps light props without a speed penalty',()=>{
 const cars=generate(42),scene=new THREE.Scene();
 const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,cars);
 const traffic=new Traffic(scene,track.sample,halfAt,track.length,804,()=>true,cars,undefined,true,false,false,42,COAST_STAGE.onboarding.traffic);
 try{
  traffic.enableRaceMode();
  const road=(d:number)=>({curvature:track.sample(d).curvature,grade:0,half:halfAt(d)});
  const race=new RivalRace(track.length,road,(d,t,r)=>traffic.raceObstacles(d,t,r),[raceEntries[4]]);
  const reference=new RivalRace(track.length,road,()=>[],[raceEntries[4]]);
  const player={distance:350,lateral:-7,speed:0},first=signs.recipe[0];
  for(const sim of [race,reference]){
   sim.reset(350);
   Object.assign(sim.rivals[0],{distance:first.distance-14,lateral:first.lateral,targetX:first.lateral,speed:62});
  }
  for(let i=0;i<40;i++){
   race.step(1/120,player,player);reference.step(1/120,player,player);
   const r=race.rivals[0],control=reference.rivals[0];
   signs.hitByVehicles(race.time,[{...r,id:-1000,halfWidth:r.entry.car.width/2}]);
   expect([r.targetSpeed,r.speed,r.targetLane]).toEqual([control.targetSpeed,control.speed,control.targetLane]);
  }
  expect(signs.inspect().hit).toContain(first.id);
  const wreck=traffic.raceObstacles(site.distance,0,200).find(o=>o.id==='T910000')!;
  const r=race.rivals[0];
  Object.assign(r,{distance:wreck.distance-55,lateral:wreck.lateral,speed:62,nextDecision:0});
  race.step(1/120,player,player);
  expect(r.targetLane<4||r.targetSpeed<r.speed).toBe(true);
  let contacts=0;
  race.impactTraffic=(o,severity,side)=>{contacts++;traffic.impactByRival(o,severity,side);};
  r.distance=wreck.distance-(r.entry.car.length+wreck.length)/2-.1;
  race.step(1/120,player,player);
  expect(contacts).toBe(1);
  expect(r.speed).toBeLessThan(60);
 }finally{traffic.dispose();signs.dispose();}
});

it.each([1,7,42])('keeps the actual thrown meshes on the pitched, banked road through reset/restore (seed %i)',seed=>{
 const scene=new THREE.Scene(),cars=generate(seed);
 // Include a steeply banked S section as well as the actual incident approach.
 for(const distance of [cars[0].distance,3350]){
  const signs=new RoadCones(track.sample,halfAt,scene,804,track.length,()=>true,[{...cars[0],id:910000,distance}]);
  try{
   const mesh=scene.getObjectByName('breakdown-warning-objects') as THREE.InstancedMesh;
   const first=signs.recipe[0],x=first.lateral!,verts=mesh.geometry.getAttribute('position');
   const matrix=new THREE.Matrix4();
   const read=(age:number)=>{
    signs.update(1+age,first.distance-10,0,0);
    const index=signs.inspect().shown.indexOf(first.id);
    expect(index).toBeGreaterThanOrEqual(0);
    mesh.getMatrixAt(index,matrix);
    expect(matrix.elements.every(Number.isFinite)).toBe(true);
   };
   expect(signs.update(1,first.distance+5,x,70,{distance:first.distance-5,lateral:x})).toBe(1);
   const saved=signs.snapshot(),f=saved.flying[0][1];
   const touch=f.up/8;
   let resting:number[]|undefined;
   for(const age of [.2,.8,1.2,touch,touch+.25,1.8,2.3,3,5,10,12]){
    read(age);
    const t=Math.min(age,touch+.55);
    const d=first.distance+f.forward*.72*(1-Math.exp(-t/.72));
    const road=track.sample(d),normal=road.right.clone().cross(road.tangent).normalize();
    const heights=Array.from({length:verts.count},(_,i)=>new THREE.Vector3()
     .fromBufferAttribute(verts,i).applyMatrix4(matrix).sub(road.position).dot(normal));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(-.002);
    if(age>=touch)expect(Math.min(...heights)).toBeLessThan(.15);
    if(age>=touch+.55){
     expect(Math.max(...heights)-Math.min(...heights)).toBeLessThan(.002);
     const face=new THREE.Vector3(0,0,1).transformDirection(matrix);
     expect(Math.abs(face.dot(normal))).toBeGreaterThan(.99999);
     if(resting)expect(matrix.elements).toEqual(resting);
     resting=matrix.elements.slice();
    }
   }
   for(const age of [.3,4,11]){
    read(age);const before=matrix.elements.slice();
    signs.reset();expect(mesh.count).toBe(0);
    signs.restore(JSON.parse(JSON.stringify(saved)));read(age);
    expect(matrix.elements).toEqual(before);
   }
   signs.update(12,first.distance+800,0,0);expect(mesh.count).toBe(0);
   read(12);expect(matrix.elements).toEqual(resting);
   expect(mesh.instanceMatrix.count).toBe(48);
   signs.reset();read(0);
   expect(signs.inspect().hit).toHaveLength(0);
   expect(Math.abs(new THREE.Vector3(0,0,1).transformDirection(matrix).y)).toBeLessThan(.2);
  }finally{signs.dispose();}
 }
});

it('keeps a struck cone on its side after the draw window streams away and back',()=>{
 const scene=new THREE.Scene(),cones=new RoadCones(track.sample,halfAt,scene,804,track.length);
 try{
  const c=cones.recipe[0],x=c.side*(halfAt(c.distance)-c.inset);
  expect(cones.update(0,c.distance+1,x,70,{distance:c.distance-5,lateral:x})).toBe(1);
  cones.update(4,c.distance+900,0,0);
  cones.update(12,c.distance,0,0);
  const mesh=scene.getObjectByName('road-cones') as THREE.InstancedMesh;
  const index=cones.inspect().shown.indexOf(c.id);
  expect(index).toBeGreaterThanOrEqual(0);
  const matrix=new THREE.Matrix4();mesh.getMatrixAt(index,matrix);
  expect(Math.abs(new THREE.Vector3(0,1,0).transformDirection(matrix).y)).toBeLessThan(.5);
  expect(mesh.instanceMatrix.count).toBe(48);
 }finally{cones.dispose();}
});

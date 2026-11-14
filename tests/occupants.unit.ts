import {it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar} from '../src/car';
import {CHEER_END} from '../src/passenger-cheer';
it('keeps the neckline clipped while the longer forelock responds to lateral load',()=>{
 const car=createCar(),motion=car.userData.motion;
 const crop=car.getObjectByName('driver-side-part-crop') as THREE.Mesh;
 const shape=crop.geometry.morphAttributes.position[0];
 let tip=0;
 for(let i=1;i<shape.count;i++)if(shape.getZ(i)<shape.getZ(tip))tip=i;
 const read=(i:number)=>crop.getVertexPosition(i,new THREE.Vector3());
 const rest=read(tip),nape=read(shape.count-1);
 const drive=(load:number)=>{for(let i=0;i<120;i++)motion.advance(90/60,0,1/60,load);return read(tip);};
 const right=drive(12),left=drive(-12);
 expect(right.z).toBeLessThan(rest.z-.006);
 expect(right.x-left.x).toBeGreaterThan(.009);
 expect(right.distanceTo(rest)).toBeLessThan(.035);
 expect(read(shape.count-1)).toEqual(nape);
 motion.reset();expect(read(tip)).toEqual(rest);
});
it('occupants and hair respond to observed motion without moving the car or wheel centers',()=>{
 const car=createCar(),m=car.userData.motion;
 const centers=m.inspect().map((w:any)=>w.center);
 m.reset();const stopped=m.occupants();expect(stopped.wind).toBe(0);
 for(let i=0;i<120;i++)m.advance(113.75/60,1,1/60);
 const fast=m.occupants();expect(fast.wind).toBeGreaterThan(.99);expect(fast.people.every((p:any)=>p.lean>.07)).toBe(true);
 expect(fast.people[1].hair.every((h:any)=>h.back>.55&&h.back<1.05)).toBe(true);
 expect(fast.people[0].scarf).toBeUndefined();
 expect(car.getObjectByName('driver-silk-scarf')).toBeUndefined();
 const phase=fast.people[1].hair[0].side;m.advance(113.75/60,0,1/60);expect(m.occupants().people[1].hair[0].side).not.toBe(phase);
 for(let i=0;i<120;i++)m.advance(113.75/60,-1,1/60);
 expect(m.occupants().people.every((p:any)=>p.lean<-.07)).toBe(true);
 expect(car.position.toArray()).toEqual([0,0,0]);expect(m.inspect().map((w:any)=>w.center)).toEqual(centers);
 for(let i=0;i<240;i++)m.advance(0,0,1/60);
 expect(m.occupants().wind).toBeLessThan(.0001);m.reset();expect(m.occupants().phase).toBe(0);
});

it('holds the parting still while the nape streams back and the ends lag a direction change',()=>{
 const car=createCar(),motion=car.userData.motion;
 const crown=car.getObjectByName('blonde-layered-crown') as THREE.Mesh;
 const read=(vertex:number)=>crown.getVertexPosition(vertex,new THREE.Vector3());
 const positions=crown.geometry.getAttribute('position');
 // Follow the lowest point at the back of the bob throughout the manoeuvre.
 let nape=0;
 for(let i=1;i<positions.count;i++){
  if(positions.getZ(i)<-.10&&positions.getY(i)<positions.getY(nape))nape=i;
 }
 const part=read(0),rest=read(nape);
 const drive=(frames:number,speed:number,load:number)=>{
  for(let i=0;i<frames;i++)motion.advance(speed/60,1,1/60,load);
  return motion.occupants();
 };
 drive(60,0,0);expect(read(nape)).toEqual(rest);
 drive(90,84,0);expect(read(nape).z).toBeLessThan(rest.z-.09);
 drive(60,84,12);expect(read(nape).x).toBeGreaterThan(rest.x+.06);
 const reversing=drive(8,84,-12);
 expect(reversing.tipSway).toBeGreaterThan(reversing.sway+.15);
 drive(60,84,-12);expect(read(nape).x).toBeLessThan(rest.x-.06);
 expect(read(0)).toEqual(part);
 drive(180,0,0);expect(read(nape).distanceTo(rest)).toBeLessThan(.001);
 motion.reset();expect(read(nape)).toEqual(rest);
});

it('uses the same passenger smile in the cockpit and the portrait, and relaxes after a wave',()=>{
 for(const detail of ['driving','portrait'] as const){
  const car=createCar(false,detail),motion=car.userData.motion;
  const face=car.getObjectByName('passenger-sculpted-face') as THREE.Mesh;
  expect(face.parent).toBe(car.getObjectByName('passenger-head'));
  const weight=()=>face.morphTargetInfluences![0];
  const resting=weight();
  motion.posePassenger(CHEER_END/2,'wave');
  expect(weight()).toBeGreaterThan(resting);
  expect(weight()).toBeLessThanOrEqual(1);
  motion.reset();
  expect(weight()).toBeCloseTo(resting);
 }
});

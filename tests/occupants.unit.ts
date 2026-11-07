import {it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar} from '../src/car';
it('streams the silver short hair back and outward with the roots held at the part',()=>{
 const car=createCar(),motion=car.userData.motion;
 const layers=car.getObjectByName('driver-side-part-layered-strands') as THREE.Mesh;
 const read=(i:number)=>layers.getVertexPosition(i,new THREE.Vector3());
 const root=read(1),tip=read(16);
 const drive=(load:number)=>{for(let i=0;i<120;i++)motion.advance(90/60,0,1/60,load);return read(16);};
 const right=drive(12),left=drive(-12);
 expect(right.z).toBeLessThan(tip.z-.045);
 expect(right.x-left.x).toBeGreaterThan(.07);
 expect(read(1)).toEqual(root);
 motion.reset();expect(read(16)).toEqual(tip);
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

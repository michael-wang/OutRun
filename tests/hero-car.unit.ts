import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar,type CarPaintController} from '../src/car';
import {CAR_COLORS,CAR_PAINT_PRESETS} from '../src/car-appearance';
import {createGTWingMirrorHousing,createRearTonneau} from '../src/hero-body';

describe('hero spider focal-point art',()=>{
 it('has real left-hand drive, a relaxed door-resting arm, blonde bob, and readable plate decal',()=>{
  const car=createCar(true);car.updateMatrixWorld(true);
  const steering=car.getObjectByName('left-hand-drive-steering-wheel');
  const arm=car.getObjectByName('driver-left-arm-resting-on-door');
  const hand=car.getObjectByName('driver-right-hand-steering');
  const hair=car.getObjectByName('blonde-hair-lock-1');
  const plate=car.getObjectByName('rear-license-FZR-123');
  expect(steering).toBeDefined();expect(steering!.position.x).toBeGreaterThan(0);
  expect(car.getObjectByName('driver')!.position.x).toBeGreaterThan(0);
  expect(car.getObjectByName('passenger')!.position.x).toBeLessThan(0);
  for(const name of ['driver','passenger']){
   const person=car.getObjectByName(name)!;
   expect(person.scale.x).toBeCloseTo(.84);
   expect(person.scale.y).toBeCloseTo(.84);
  }
  expect(arm).toBeDefined();expect(hand).toBeDefined();expect(hair).toBeDefined();
  const armBox=new THREE.Box3().setFromObject(arm!);
  expect(armBox.max.x).toBeGreaterThan(.99);
  expect(armBox.max.y).toBeLessThan(1.25);
  expect(car.userData.licensePlate).toBe('FZR-123');
  expect(plate).toBeInstanceOf(THREE.Mesh);
  expect((plate as THREE.Mesh).geometry.getAttribute('uv')).toBeDefined();
  expect(plate!.position.z).toBeLessThan(-2.40);
  expect(car.getObjectByName('sculpted-gt-spider-shell')).toBeUndefined(); // merged into the paint batch
 });
 it('changes only paint uniforms; model silhouette and geometry stay identical',()=>{
  const car=createCar(),paint=car.userData.paintController as CarPaintController;
  const beforeGeometry:string[]=[];
  car.traverse(o=>{if(o instanceof THREE.Mesh)beforeGeometry.push(o.geometry.uuid);});
  const beforeBox=new THREE.Box3().setFromObject(car);
  for(const color of CAR_COLORS){
   paint.set(color);
   expect(paint.inspect()).toEqual({color,hex:CAR_PAINT_PRESETS[color].hex});
   expect(new THREE.Box3().setFromObject(car).equals(beforeBox)).toBe(true);
   const currentGeometry:string[]=[];
   car.traverse(o=>{if(o instanceof THREE.Mesh)currentGeometry.push(o.geometry.uuid);});
   expect(currentGeometry).toEqual(beforeGeometry);
  }
 });
 it('keeps the driver hand resting while the passenger bob responds to a gust',()=>{
  const car=createCar(),m=car.userData.motion;
  m.reset();
  for(let i=0;i<100;i++)m.advance(113.75/60,.9,1/60);
  const left=car.getObjectByName('driver-left-arm-resting-on-door')!;
  const right=car.getObjectByName('driver-right-hand-steering')!;
  expect(Math.abs(left.rotation.z)).toBeLessThan(.01);
  expect(Math.abs(right.rotation.z)).toBeGreaterThan(.03);
  const h=m.occupants().people[1].hair;
  expect(h).toHaveLength(5);
  expect(h.every((lock:{back:number})=>lock.back>.55&&lock.back<1.05)).toBe(true);
  expect(car.getObjectByName('driver-silk-scarf')).toBeUndefined();
  expect(m.occupants().people[0].scarf).toBeUndefined();
 });
});

 it('batches five two-joint blonde locks into two instanced draw submissions',()=>{
  const car=createCar(),primary=car.getObjectByName('blonde-wind-locks-batched');
  const tips=car.getObjectByName('blonde-wind-tips-batched');
  expect(primary).toBeInstanceOf(THREE.InstancedMesh);
  expect(tips).toBeInstanceOf(THREE.InstancedMesh);
  expect((primary as THREE.InstancedMesh).count).toBe(5);
  expect((tips as THREE.InstancedMesh).count).toBe(5);
  const first=new THREE.Matrix4(),after=new THREE.Matrix4();
  (primary as THREE.InstancedMesh).getMatrixAt(2,first);
  for(let i=0;i<120;i++)car.userData.motion.advance(110/60,.9,1/60);
  (primary as THREE.InstancedMesh).getMatrixAt(2,after);
  expect(after.equals(first)).toBe(false);
 });

it('covers the passenger scalp from the chase camera and above while leaving the face open',()=>{
 const car=createCar(),bob=car.getObjectByName('layered-blonde-bob')!;
 const head=car.getObjectByName('passenger-head')!,crown=car.getObjectByName('blonde-layered-crown')!;
 const firstHit=(from:THREE.Vector3,to:THREE.Vector3)=>{
  const origin=bob.localToWorld(from),direction=bob.localToWorld(to).sub(origin).normalize();
  return new THREE.Raycaster(origin,direction).intersectObject(head,true)[0]?.object;
 };
 for(const [speed,load] of [[0,0],[68,12],[68,-12]]){
  for(let i=0;i<60;i++)car.userData.motion.advance(speed/60,.4,1/60,load);
  car.updateMatrixWorld(true);
  for(const x of [-.09,0,.09])for(const z of [-.06,0,.06]){
   expect(firstHit(new THREE.Vector3(x,.5,z),new THREE.Vector3(x,0,z))).toBe(crown);
   expect(firstHit(new THREE.Vector3(x,.26,z-.48),new THREE.Vector3(x,.08,z))).toBe(crown);
  }
  const face=firstHit(new THREE.Vector3(0,.01,.5),new THREE.Vector3(0,.01,0));
  expect(face).toBeDefined();expect(face?.parent).toBe(head);
 }
});

it('builds layered male hair rather than a spherical watermelon cap, with no scarf',()=>{
 const car=createCar();car.updateMatrixWorld(true);
 const hair=car.getObjectByName('driver-layered-short-hair');
 const nape=car.getObjectByName('driver-tapered-nape');
 const strands=car.getObjectByName('driver-side-part-layered-strands');
 const bob=car.getObjectByName('layered-blonde-bob');
 expect(hair).toBeDefined();
 expect(nape).toBeInstanceOf(THREE.Mesh);
 expect(strands).toBeInstanceOf(THREE.Mesh);
 expect(bob).toBeDefined();
 expect(car.getObjectByName('driver-tailored-flat-cap')).toBeUndefined();
 expect(car.getObjectByName('driver-natural-short-hair')).toBeUndefined();
 expect(car.getObjectByName('driver-silk-scarf')).toBeUndefined();
 expect(car.getObjectByName('wind-scarf-fabric-0')).toBeUndefined();
 const hairBounds=new THREE.Box3().setFromObject(hair!);
 expect(hairBounds.max.y).toBeLessThan(1.66);
 expect(hairBounds.min.y).toBeGreaterThan(1.25);
 expect(hairBounds.getSize(new THREE.Vector3()).z).toBeGreaterThan(.23);
 const napeGeo=(nape as THREE.Mesh).geometry;
 const ribbonGeo=(strands as THREE.Mesh).geometry;
 expect(napeGeo.getAttribute('color')).toBeDefined();
 expect(ribbonGeo.getAttribute('color')).toBeDefined();
 // 26 tapered multi-row cards provide irregular distinct layered ends.
 expect(ribbonGeo.getAttribute('position').count).toBeGreaterThan(440);
 expect(ribbonGeo.index!.count).toBeGreaterThan(750);
});
it('recesses dark seatbacks behind a painted rear cowl without closing the cockpit',()=>{
 const car=createCar(),g=createRearTonneau();
 try{
  expect(g.index!.count).toBeGreaterThan(40);
  const p=g.getAttribute('position');
  const ys=Array.from({length:p.count},(_,i)=>p.getY(i));
  expect(Math.min(...ys)).toBeGreaterThan(.9);
  expect(Math.max(...ys)).toBeLessThan(1.10);
  const materials=new Set<string>();
  car.traverse(o=>{
   if(o instanceof THREE.Mesh){
    const list=Array.isArray(o.material)?o.material:[o.material];
    for(const m of list)if(m instanceof THREE.MeshStandardMaterial)materials.add(m.color.getHexString());
   }
  });
  expect(materials.has('29323a')).toBe(true); // graphite upholstery
  expect(materials.has('a87c60')).toBe(false); // no brown toy-chair slabs
  const viewport=new THREE.Raycaster(new THREE.Vector3(0,3,-.2),new THREE.Vector3(0,-1,0));
  expect(viewport.intersectObject(car,true)[0].point.y).toBeLessThan(.9);
 }finally{g.dispose();}
});
it('makes wing mirrors thin and brake lights physically and visually modest',()=>{
 const g=createGTWingMirrorHousing();
 const size=g.boundingBox!.getSize(new THREE.Vector3());
 expect(size.x).toBeGreaterThan(.23);
 expect(size.x).toBeLessThan(.26);
 expect(size.y).toBeLessThan(.105);
 expect(size.z).toBeLessThan(.18);
 g.dispose();
 const car=createCar(true);
 const lights=car.userData.brakeLights;
 expect(lights.inspect().emissiveIntensity).toBeLessThan(.20);
 lights.set(true);
 expect(lights.inspect().emissiveIntensity).toBeGreaterThan(.8);
 expect(lights.inspect().emissiveIntensity).toBeLessThan(1.2);
 lights.reset();
 expect(lights.inspect().emissiveIntensity).toBeLessThan(.20);
});

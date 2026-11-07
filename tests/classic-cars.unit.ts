import {it,expect} from 'vitest';
import * as THREE from 'three';
import {CAR_MODELS} from '../src/car-models';
import {createCar,type CarModelController,type CarPaintController} from '../src/car';
import {classicBodyIdentity,createClassicBody,createClassicTailLamps} from '../src/hero-classic-geometry';

it('builds three truly different original classic silhouettes and period rear lamps',()=>{
 const signatures=new Set<string>(),tailNames=new Set<string>();
 for(const name of CAR_MODELS){
  const a=createClassicBody(name),b=createClassicTailLamps(name);
  expect(a.name).toContain(name);
  expect(b.name).toContain(name);
  const positions=a.getAttribute('position');
  const bounds=new THREE.Box3().setFromBufferAttribute(positions as THREE.BufferAttribute);
  expect(bounds.min.x).toBeGreaterThan(-1.22);
  expect(bounds.max.x).toBeLessThan(1.22);
  expect(bounds.min.z).toBeGreaterThanOrEqual(-2.36);
  expect(bounds.max.z).toBeLessThanOrEqual(2.35);
  // A low wedge nose can drop to roughly .23m but never below tire clearance.
  expect(bounds.min.y).toBeGreaterThan(.20);
  expect(bounds.max.y).toBeLessThan(1.12);
  const at=classicBodyIdentity(name);
  signatures.add(JSON.stringify(at.profile));
  tailNames.add(at.tailKind);
  expect(a.index!.count).toBeGreaterThan(180);
  expect(b.index!.count).toBeGreaterThan(8);
  a.dispose();b.dispose();
 }
 expect(signatures.size).toBe(3);expect(tailNames.size).toBe(3);
});
it('swaps only active exterior geometry; car body rig, wheel centres, license and paint survive',()=>{
 const car=createCar(true);
 const controller=car.userData.modelController as CarModelController;
 const paint=car.userData.paintController as CarPaintController;
 const body=car.getObjectByName('hero-classic-body-shell') as THREE.Mesh;
 const lamps=car.getObjectByName('hero-classic-tail-lamps') as THREE.Mesh;
 const firstPaint=body.material;
 const firstBody=body.geometry;
 const wheelCenters=car.userData.motion.inspect().map((w:{center:number[]})=>w.center);
 const initialBox=new THREE.Box3().setFromObject(car),size=initialBox.getSize(new THREE.Vector3());
 expect(size.x).toBeLessThan(2.7);
 expect(size.z).toBeLessThan(5);
 expect(size.y).toBeLessThan(1.8);
 paint.set('royal-blue');
 for(const model of CAR_MODELS){
  controller.set(model);
  expect(controller.inspect().model).toBe(model);
  expect(body.material).toBe(firstPaint);
  expect(controller.inspect().bodyGeometry).toContain(model);
  expect(controller.inspect().rearLamps).toContain(model);
  expect(car.getObjectByName('driver')).toBeDefined();
  expect(car.getObjectByName('passenger')).toBeDefined();
  expect(car.userData.licensePlate).toBe('FZR-123');
  expect(car.userData.motion.inspect().map((w:{center:number[]})=>w.center)).toEqual(wheelCenters);
  const box=new THREE.Box3().setFromObject(car),actual=box.getSize(new THREE.Vector3());
  expect(actual.x).toBeLessThan(2.7);
  expect(actual.z).toBeLessThan(5);
  expect(actual.y).toBeLessThan(1.8);
  expect(Math.abs(actual.x-size.x)).toBeLessThan(.2);
  expect(Math.abs(actual.z-size.z)).toBeLessThan(.12);
  expect(paint.inspect().color).toBe('royal-blue');
 }
 expect(body.geometry).not.toBe(firstBody);
 expect(body.geometry).toBeInstanceOf(THREE.BufferGeometry);
 expect(lamps.geometry).toBeInstanceOf(THREE.BufferGeometry);
});
it('keeps model changes inside the original focal mesh and triangle budgets',()=>{
 const car=createCar(),ctl=car.userData.modelController as CarModelController;
 for(const model of CAR_MODELS){
  ctl.set(model);
  let meshes=0,tris=0;
  car.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  expect(meshes).toBeLessThanOrEqual(64);
  expect(tris).toBeLessThanOrEqual(14000);
 }
});
it('passenger has bare upper arms and a sleeveless fitted summer dress; driver reaches the door',()=>{
 const car=createCar();
 expect(car.getObjectByName('passenger-summer-dress')).toBeUndefined(); // batched static cloth
 const driver=car.getObjectByName('driver')!,passenger=car.getObjectByName('passenger')!;
 expect(driver.position.x).toBeGreaterThan(0);expect(passenger.position.x).toBeLessThan(0);
 expect(car.getObjectByName('driver-left-arm-resting-on-door')).toBeDefined();
 expect(car.getObjectByName('passenger-arm--1')).toBeDefined();
 expect(car.getObjectByName('passenger-arm-1')).toBeDefined();
 expect(car.getObjectByName('layered-blonde-bob')).toBeDefined();
 // Dress fabric colour is distinct from the passenger's bare skin.
 const colors=new Set<string>();
 passenger.traverse(o=>{if(o instanceof THREE.Mesh){
  const m=o.material as THREE.MeshStandardMaterial;
  colors.add(m.color.getHexString());
 }});
 expect(colors.has('efd0b9')).toBe(true);
 expect(colors.has('e3b79b')).toBe(true);
});

import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar,type CarPaintController} from '../src/car';
import {CAR_COLORS,CAR_PAINT_PRESETS} from '../src/car-appearance';

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
  expect(h.every((lock:{back:number})=>lock.back>.10&&lock.back<.45)).toBe(true);
  const scarf=m.occupants().people[0].scarf;
  expect(scarf).toHaveLength(2);
  expect(scarf.every((tail:{back:number})=>tail.back>.13&&tail.back<.34)).toBe(true);
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

it('keeps the passenger hairstyle but gives the driver a fitted cap and visible fabric motion',()=>{
 const car=createCar(),cap=car.getObjectByName('driver-tailored-flat-cap');
 const brim=car.getObjectByName('driver-flat-cap-mesh');
 const girl=car.getObjectByName('layered-blonde-bob');
 expect(cap).toBeDefined();expect(brim).toBeInstanceOf(THREE.Mesh);
 expect(girl).toBeDefined();
 const capBounds=new THREE.Box3().setFromObject(cap!);
 expect(capBounds.max.y).toBeLessThan(1.69);
 expect(capBounds.min.y).toBeGreaterThan(1.38);
 expect(car.getObjectByName('tailored-driver-hair')).toBeUndefined();
 expect((brim as THREE.Mesh).geometry.getAttribute('color')).toBeDefined();
 expect((brim as THREE.Mesh).geometry.index!.count).toBeGreaterThan(180);
 const scarf=car.getObjectByName('driver-silk-scarf')!;
 expect(scarf).toBeDefined();
 expect(car.getObjectByName('wind-scarf-fabric-0')).toBeDefined();
 expect(car.getObjectByName('wind-scarf-fabric-1')).toBeDefined();
 const motion=car.userData.motion;
 motion.reset();
 for(let step=0;step<120;step++)motion.advance(108/60,.6,1/60);
 const tails=motion.occupants().people[0].scarf;
 expect(tails).toHaveLength(2);
 expect(tails.some((tail:{back:number})=>tail.back>.25)).toBe(true);
 const bounds=new THREE.Box3().setFromObject(scarf);
 expect(bounds.min.z).toBeLessThan(-1.25);
 expect(bounds.max.y).toBeGreaterThan(1.23);
});

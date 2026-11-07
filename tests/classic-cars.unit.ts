import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createCar,type CarPaintController} from '../src/car';
import {createRivieraBody,createRivieraTailLamps} from '../src/hero-classic-geometry';

it('keeps ONLY the owner-approved Riviera 62 silhouette, classic round lamps and sculpted deck',()=>{
 const body=createRivieraBody(),lamps=createRivieraTailLamps();
 expect(body.name).toBe('hero-riviera-62-body');
 expect(lamps.name).toBe('hero-riviera-62-rear-lights');
 const bounds=new THREE.Box3().setFromBufferAttribute(body.getAttribute('position') as THREE.BufferAttribute);
 expect(bounds.min.x).toBeGreaterThan(-1.22);
 expect(bounds.max.x).toBeLessThan(1.22);
 expect(bounds.min.z).toBeGreaterThanOrEqual(-2.36);
 expect(bounds.max.z).toBeLessThanOrEqual(2.35);
 expect(bounds.max.y).toBeLessThan(1.12);
 expect(body.index!.count).toBeGreaterThan(180);
 // Four small rounded jewel lamps, matching the approved Riviera.
 expect(lamps.index!.count).toBe(4*16*3);
 body.dispose();lamps.dispose();
});

it('retains one car, same wheels, FZR-123, actors and three paint options',()=>{
 const car=createCar(true);
 const paint=car.userData.paintController as CarPaintController;
 const shell=car.getObjectByName('hero-classic-body-shell') as THREE.Mesh;
 const lamps=car.getObjectByName('hero-classic-tail-lamps') as THREE.Mesh;
 const trim=car.getObjectByName('riviera-rear-trim')!;
 expect(car.userData.modelController).toBeUndefined();
 expect(shell.geometry.name).toBe('hero-riviera-62-body');
 expect(lamps.geometry.name).toBe('hero-riviera-62-rear-lights');
 expect(trim.visible).toBe(true);
 expect(car.getObjectByName('driver')).toBeDefined();
 expect(car.getObjectByName('passenger')).toBeDefined();
 expect(car.userData.licensePlate).toBe('FZR-123');
 const firstBody=shell.geometry,firstLamps=lamps.geometry;
 const before=new THREE.Box3().setFromObject(car),wheels=car.userData.motion.inspect().map((w:{center:number[]})=>w.center);
 for(const color of ['ferrari-red','pure-white','seafoam-green'] as const){
  paint.set(color);
  expect(paint.inspect().color).toBe(color);
  expect(shell.geometry).toBe(firstBody);
  expect(lamps.geometry).toBe(firstLamps);
  expect(new THREE.Box3().setFromObject(car).equals(before)).toBe(true);
  expect(car.userData.motion.inspect().map((w:{center:number[]})=>w.center)).toEqual(wheels);
 }
});

it('keeps the owner-approved open Riviera cockpit and strict player budget',()=>{
 const car=createCar(),bounds=new THREE.Box3().setFromObject(car);
 const size=bounds.getSize(new THREE.Vector3());
 expect(size.x).toBeLessThan(2.7);
 expect(size.z).toBeLessThan(5);
 expect(size.y).toBeLessThan(1.8);
 let meshes=0,triangles=0;
 car.traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 expect(meshes).toBeLessThanOrEqual(64);
 expect(triangles).toBeLessThan(14000);
 const ray=new THREE.Raycaster(new THREE.Vector3(0,3,-.2),new THREE.Vector3(0,-1,0));
 expect(ray.intersectObject(car,true)[0].point.y).toBeLessThan(.9);
});

it('removes all model-switch options but retains the accessible paint selector',()=>{
 const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 expect(main).not.toContain('car-model-setting');
 expect(main).not.toContain('car-model');
 expect(main).not.toContain('CAR_MODELS');
 expect(css).not.toContain('#car-model');
 expect(main).toContain('id="car-paint"');
 expect(main).toContain('CAR_COLORS.map(');
});

it('retains the approved passenger sleeveless dress and left-hand driver',()=>{
 const car=createCar(),driver=car.getObjectByName('driver')!,passenger=car.getObjectByName('passenger')!;
 expect(driver.position.x).toBeGreaterThan(0);
 expect(passenger.position.x).toBeLessThan(0);
 expect(car.getObjectByName('driver-left-arm-resting-on-door')).toBeDefined();
 expect(car.getObjectByName('passenger-arm--1')).toBeDefined();
 expect(car.getObjectByName('passenger-arm-1')).toBeDefined();
 expect(car.getObjectByName('layered-blonde-bob')).toBeDefined();
 const colors=new Set<string>();
 passenger.traverse(o=>{if(o instanceof THREE.Mesh){
  const m=o.material as THREE.MeshStandardMaterial;
  colors.add(m.color.getHexString());
 }});
 expect(colors.has('efd0b9')).toBe(true);
 expect(colors.has('e3b79b')).toBe(true);
});

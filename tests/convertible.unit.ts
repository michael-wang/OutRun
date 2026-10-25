import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createCar} from '../src/car';
describe('original convertible geometry',()=>{
 it('keeps two distinct occupants, a genuinely open cockpit and the accepted footprint',()=>{
  const car=createCar();car.updateMatrixWorld(true);
  for(const name of ['driver','passenger']){const person=car.getObjectByName(name);expect(person).toBeDefined();const box=new THREE.Box3().setFromObject(person!);expect(box.max.y).toBeGreaterThan(1.6);expect(box.min.y).toBeGreaterThan(.5);}
  const bounds=new THREE.Box3().setFromObject(car);expect(bounds.min.y).toBeCloseTo(0,5);expect(bounds.max.y).toBeLessThan(1.8);expect(bounds.max.x-bounds.min.x).toBeLessThan(2.7);expect(bounds.max.z-bounds.min.z).toBeLessThan(5);
  const ray=new THREE.Raycaster(new THREE.Vector3(0,3,-.2),new THREE.Vector3(0,-1,0));expect(ray.intersectObject(car,true)[0].point.y).toBeLessThan(.9);
 });
 it('batches the static artwork into a small draw/triangle budget',()=>{
  let meshes=0,triangles=0;createCar().traverse(o=>{if(o instanceof THREE.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});expect(meshes).toBeLessThanOrEqual(64);expect(triangles).toBeLessThan(14000);
 });
});

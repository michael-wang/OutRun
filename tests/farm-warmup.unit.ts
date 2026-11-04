import {it,expect} from 'vitest';
import * as THREE from 'three';
import {farmWarmupRepresentatives} from '../src/farm-warmup-plan';

it('uses one distant GPU preflight per shared material and instancing variant',()=>{
 const geometry=new THREE.PlaneGeometry(1,1),shared=new THREE.MeshStandardMaterial(),other=new THREE.MeshStandardMaterial();
 const objects=[
  new THREE.Mesh(geometry,shared),
  new THREE.Mesh(geometry,shared),
  new THREE.InstancedMesh(geometry,shared,1),
  new THREE.InstancedMesh(geometry,shared,1),
  new THREE.Mesh(geometry,other),
 ];
 expect(farmWarmupRepresentatives(objects)).toEqual([objects[0],objects[2],objects[4]]);
 shared.dispose();other.dispose();geometry.dispose();
});

it('compiles all unique flower shaders while deduplicating shared rice surfaces',()=>{
 const g=new THREE.PlaneGeometry(1,1),rice=new THREE.MeshStandardMaterial();
 const objects=[
  new THREE.Mesh(g,rice),new THREE.Mesh(g,rice),
  new THREE.Mesh(g,new THREE.ShaderMaterial()),
  new THREE.Mesh(g,new THREE.ShaderMaterial()),
 ];
 expect(farmWarmupRepresentatives(objects)).toHaveLength(3);
 for(const object of objects)for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();
 g.dispose();
});


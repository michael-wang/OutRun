import {it,expect,vi} from 'vitest';
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
 expect(farmWarmupRepresentatives(objects,true)).toEqual([objects[0],objects[2],objects[4]]);
 expect(farmWarmupRepresentatives(objects,false)).toEqual(objects);
 shared.dispose();other.dispose();geometry.dispose();
});

it('compiles all unique flower shaders while deduplicating shared rice surfaces',()=>{
 const g=new THREE.PlaneGeometry(1,1),rice=new THREE.MeshStandardMaterial();
 const objects=[
  new THREE.Mesh(g,rice),new THREE.Mesh(g,rice),
  new THREE.Mesh(g,new THREE.ShaderMaterial()),
  new THREE.Mesh(g,new THREE.ShaderMaterial()),
 ];
 expect(farmWarmupRepresentatives(objects,true)).toHaveLength(3);
 for(const object of objects)for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();
 g.dispose();
});

it('selects the hybrid rice renderer by default, with a reversible legacy URL',async()=>{
 try{
  vi.stubGlobal('location',{search:'?startupdiag=1'});
  vi.resetModules();
  expect((await import('../src/rice-sea-mode')).RICE_SEA_MODE).toBe('hybrid');
  vi.stubGlobal('location',{search:'?startupdiag=1&rice=legacy'});
  vi.resetModules();
  expect((await import('../src/rice-sea-mode')).RICE_SEA_MODE).toBe('legacy');
  vi.stubGlobal('location',{search:'?startupdiag=1&rice=hybrid'});
  vi.resetModules();
  expect((await import('../src/rice-sea-mode')).RICE_SEA_MODE).toBe('hybrid');
 }finally{vi.unstubAllGlobals();vi.resetModules();}
});

import {it,expect,vi} from 'vitest';
import * as THREE from 'three';
import {farmWarmupRepresentatives} from '../src/farm-warmup-plan';
import {warmFarmMeshes,type FarmPatch} from '../src/coast-farm';

it('skips a retired chunk even if its mesh still has a parent when compilation finishes',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),mesh=new THREE.Mesh();
 group.add(mesh);scene.add(group);
 const renderer={compileAsync:vi.fn(async()=>group.removeFromParent()),render:vi.fn()};
 vi.stubGlobal('requestAnimationFrame',(f:FrameRequestCallback)=>f(0));
 try{
  await warmFarmMeshes(renderer as unknown as THREE.WebGLRenderer,new THREE.Camera(),scene,[{group} as FarmPatch],()=>true);
  expect(renderer.compileAsync).toHaveBeenCalledOnce();
  expect(renderer.render).not.toHaveBeenCalled();
  expect(mesh.parent).toBe(group);
 }finally{vi.unstubAllGlobals();mesh.geometry.dispose();mesh.material.dispose();}
});

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


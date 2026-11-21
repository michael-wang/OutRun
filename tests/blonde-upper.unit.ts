import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {springBlonde} from '../src/blonde-spring';

async function load(suffix:string){
 const bytes=readFileSync(new URL(`../public/assets/characters/coast-blonde-${suffix}.glb`,import.meta.url));
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer,'')).scene;
 return {scene,mesh:scene.getObjectByName('blender-blonde-spring') as THREE.SkinnedMesh,bytes};
}
it('carves only the upper R6b skin, retaining all original weights and lower attributes',async()=>{
 const a=await load('r6b'),b=await load('r6b-upper'),old=a.mesh.geometry,next=b.mesh.geometry;
 expect(next.index!.count/3).toBeLessThanOrEqual(7500);expect(b.bytes.length).toBeLessThan(320000);
 expect(b.mesh.skeleton.bones.map(v=>v.name)).toEqual(a.mesh.skeleton.bones.map(v=>v.name));
 expect((b.mesh.material as THREE.Material).transparent).toBe(false);
 let sculpted=0;
 for(let i=0;i<old.attributes.position.count;i++){
  for(const name of ['skinIndex','skinWeight']){
   for(let k=0;k<4;k++)expect(next.attributes[name].getComponent(i,k)).toBe(old.attributes[name].getComponent(i,k));
  }
  const p=new THREE.Vector3().fromBufferAttribute(old.attributes.position,i),q=new THREE.Vector3().fromBufferAttribute(next.attributes.position,i);
  expect(p.distanceTo(q)).toBeLessThan(.00401);if(p.distanceTo(q)>1e-5)sculpted++;
  if(p.y<=.065)for(const name of ['position','normal','color'])for(let k=0;k<3;k++)expect(next.attributes[name].getComponent(i,k)).toBe(old.attributes[name].getComponent(i,k));
 }
 expect(sculpted).toBeGreaterThan(0);
 for(let i=0;i<next.attributes.skinWeight.count;i++){
  let sum=0;for(let k=0;k<4;k++)sum+=next.attributes.skinWeight.getComponent(i,k);
  expect(sum).toBeCloseTo(1,5);
 }
});
it('preserves the wild bone trajectories and lower skinned positions through turns and braking',async()=>{
 const a=await load('r6b'),b=await load('r6b-upper'),grooms=[springBlonde(a.scene),springBlonde(b.scene)];
 const air={airX:2.6,airZ:0,velocityX:0,velocityZ:0,yaw:0,time:0,preset:'wild' as const};
 for(let i=0;i<360;i++){
  air.time=i/60;air.velocityZ=i<240?300/3.6:Math.max(0,300/3.6-(i-240)*1.4);
  for(const g of grooms){g.sync(1,Math.sin(i/45),0,0);g.step!(1/60,air);}
  if(i%30===0){
   a.scene.updateMatrixWorld(true);b.scene.updateMatrixWorld(true);a.mesh.skeleton.update();b.mesh.skeleton.update();
   a.mesh.skeleton.bones.forEach((bone,j)=>expect(bone.quaternion.angleTo(b.mesh.skeleton.bones[j].quaternion)).toBeLessThan(1e-6));
   for(let v=0;v<a.mesh.geometry.attributes.position.count;v+=17)if(a.mesh.geometry.attributes.position.getY(v)<=.065){
    const p=a.mesh.getVertexPosition(v,new THREE.Vector3()),q=b.mesh.getVertexPosition(v,new THREE.Vector3());
    expect(p.distanceTo(q)).toBeLessThan(1e-7);
   }
  }
 }
});

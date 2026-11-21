import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {springBlonde} from '../src/blonde-spring';
async function load(name:string){
 const bytes=readFileSync(new URL(`../public/assets/characters/coast-blonde-${name}.glb`,import.meta.url));
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer,'')).scene;
 return {scene,mesh:scene.getObjectByName('blender-blonde-spring') as THREE.SkinnedMesh,bytes};
}
it('uses five closed cover volumes in one opaque skin, with unchanged lower R6c data and smaller cost',async()=>{
 const a=await load('r6b-upper'),b=await load('r6d'),c=await load('r6b'),g=b.mesh.geometry;
 let meshes=0;b.scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes++;});expect(meshes).toBe(1);
 expect(Array.isArray(b.mesh.material)).toBe(false);expect((b.mesh.material as THREE.Material).transparent).toBe(false);
 expect(g.index!.count/3).toBeLessThan(5000);expect(b.bytes.length).toBeLessThan(180000);
 expect(b.mesh.skeleton.bones.map(v=>v.name)).toEqual(a.mesh.skeleton.bones.map(v=>v.name));
 expect(Array.from(g.index!.array.slice(0,c.mesh.geometry.index!.count))).toEqual(Array.from(c.mesh.geometry.index!.array));
 const core=c.mesh.geometry.attributes.position.count;
 for(let i=0;i<core;i++){
  for(const name of ['skinIndex','skinWeight'])for(let k=0;k<4;k++)expect(g.attributes[name].getComponent(i,k)).toBe(a.mesh.geometry.attributes[name].getComponent(i,k));
  if(c.mesh.geometry.attributes.position.getY(i)<=.065)for(const name of ['position','normal','color'])for(let k=0;k<3;k++)expect(g.attributes[name].getComponent(i,k)).toBe(a.mesh.geometry.attributes[name].getComponent(i,k));
 }
 for(let i=0;i<g.attributes.position.count;i++){
  let sum=0;for(let k=0;k<4;k++){const w=g.attributes.skinWeight.getComponent(i,k);expect(w).toBeGreaterThanOrEqual(0);sum+=w;expect(g.attributes.skinIndex.getComponent(i,k)).toBeLessThan(25);}
  expect(sum).toBeCloseTo(1,5);
  for(let k=0;k<3;k++)expect(Number.isFinite(g.attributes.position.getComponent(i,k))).toBe(true);
 }
 // Every new island is a closed, nonzero-volume clump, not an open hair card.
 const edges=new Map<string,number>(),neighbours=new Map<number,Set<number>>();
 for(let f=c.mesh.geometry.index!.count;f<g.index!.count;f+=3){
  const ids=[0,1,2].map(k=>g.index!.getX(f+k));
  for(let k=0;k<3;k++){const x=ids[k],y=ids[(k+1)%3],key=[x,y].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)??0)+1);if(!neighbours.has(x))neighbours.set(x,new Set());neighbours.get(x)!.add(y);neighbours.get(x)!.add(ids[(k+2)%3]);}
 }
 edges.forEach(n=>expect(n).toBe(2));let islands=0;
 const unseen=new Set(neighbours.keys());
 while(unseen.size){islands++;const queue=[unseen.values().next().value!],component=new Set<number>();
  while(queue.length){const i=queue.pop()!;if(!unseen.delete(i))continue;component.add(i);queue.push(...neighbours.get(i)!);}
  let volume=0;for(let f=c.mesh.geometry.index!.count;f<g.index!.count;f+=3)if(component.has(g.index!.getX(f))){
   const v=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(g.attributes.position,g.index!.getX(f+k)));volume+=v[0].dot(v[1].cross(v[2]))/6;
  }expect(Math.abs(volume)).toBeGreaterThan(1e-8);
 }expect(islands).toBe(5);
});
it('keeps the crown and accepted wild lower trajectories identical during turns and braking',async()=>{
 const a=await load('r6b-upper'),b=await load('r6d'),grooms=[springBlonde(a.scene),springBlonde(b.scene)];
 const crown=b.scene.getObjectByName('fixed-crown')!,rest=crown.quaternion.clone();
 for(let i=0;i<360;i++){
  const air={airX:2.6,airZ:0,velocityX:0,velocityZ:i<240?300/3.6:Math.max(0,300/3.6-(i-240)*1.4),yaw:0,time:i/60,preset:'wild' as const};
  for(const groom of grooms){groom.sync(1,Math.sin(i/45),0,0);groom.step!(1/60,air);}
  if(i%30===0){
   expect(crown.quaternion.angleTo(rest)).toBeLessThan(1e-6);
   a.scene.updateMatrixWorld(true);b.scene.updateMatrixWorld(true);a.mesh.skeleton.update();b.mesh.skeleton.update();
   a.mesh.skeleton.bones.forEach((bone,j)=>expect(bone.quaternion.angleTo(b.mesh.skeleton.bones[j].quaternion)).toBeLessThan(1e-6));
   for(let v=0;v<1592;v+=17)if(a.mesh.geometry.attributes.position.getY(v)<=.065)expect(a.mesh.getVertexPosition(v,new THREE.Vector3()).distanceTo(b.mesh.getVertexPosition(v,new THREE.Vector3()))).toBeLessThan(1e-7);
  }
 }
});

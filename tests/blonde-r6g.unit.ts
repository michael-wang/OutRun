import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {springBlonde} from '../src/blonde-spring';
async function load(){
 const bytes=readFileSync(new URL('../public/assets/characters/coast-blonde-r6g.glb',import.meta.url));
 const scene=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer,'')).scene;
 return {scene,mesh:scene.getObjectByName('blender-blonde-spring') as THREE.SkinnedMesh};
}
it('contains 8 primary and 10 feather closed independently weighted locks and one closed warm inner cap',async()=>{
 const {scene,mesh}=await load(),g=mesh.geometry;let meshes=0;scene.traverse(o=>{if(o instanceof THREE.Mesh)meshes++;});
 expect(meshes).toBe(1);expect(Array.isArray(mesh.material)).toBe(false);expect((mesh.material as THREE.Material).transparent).toBe(false);
 expect(mesh.skeleton.bones).toHaveLength(73);expect(g.index!.count/3).toBeLessThan(20000);
 const graph=new Map<number,Set<number>>(),edges=new Map<string,number>();
 for(let i=0;i<g.index!.count;i+=3){const v=[0,1,2].map(k=>g.index!.getX(i+k));for(let k=0;k<3;k++){
  const a=v[k],b=v[(k+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)??0)+1);
  if(!graph.has(a))graph.set(a,new Set());graph.get(a)!.add(b);graph.get(a)!.add(v[(k+2)%3]);
 }}edges.forEach(n=>expect(n).toBe(2));
 const unseen=new Set(graph.keys()),locks=new Set<string>();let capCount=0,islands=0;
 while(unseen.size){islands++;const queue=[unseen.values().next().value!],influences=new Set<string>();let warm=true;
  while(queue.length){const i=queue.pop()!;if(!unseen.delete(i))continue;queue.push(...graph.get(i)!);let sum=0;
   warm&&=g.attributes.color.getX(i)>.30&&g.attributes.color.getY(i)>.15;
   for(let k=0;k<3;k++)expect(Number.isFinite(g.attributes.position.getComponent(i,k))).toBe(true);
   for(let k=0;k<4;k++){const w=g.attributes.skinWeight.getComponent(i,k),joint=g.attributes.skinIndex.getComponent(i,k);expect(w).toBeGreaterThanOrEqual(0);expect(joint).toBeLessThan(73);sum+=w;
    if(w>1e-5)influences.add(mesh.skeleton.bones[joint].name);
   }expect(sum).toBeCloseTo(1,5);
  }
  const dynamic=[...influences].filter(n=>n.startsWith('lock-'));
  if(!dynamic.length){capCount++;expect(warm).toBe(true);expect([...influences]).toEqual(['fixed-crown']);}
  else{const chains=new Set(dynamic.map(n=>n.split('-')[1]));expect(chains.size).toBe(1);locks.add([...chains][0]);expect(dynamic.length).toBeGreaterThanOrEqual(3);}
 }
 expect(islands).toBe(19);expect(capCount).toBe(1);expect(locks.size).toBe(18);
});
it('moves upper and tip joints of every chain, keeps roots pinned, freezes, resets and recovers from stalls deterministically',async()=>{
 const {scene,mesh}=await load(),groom=springBlonde(scene),bones=mesh.skeleton.bones,rest=bones.map(b=>b.quaternion.clone());
 const roots=Array.from({length:18},(_,i)=>scene.getObjectByName(`lock-${i}-0`)!),origins=roots.map(b=>b.position.clone());
 const peak=Array(54).fill(0),run=()=>{
  for(let i=0;i<240;i++){
   groom.sync(1,Math.sin(i/45),0,0);groom.step!(1/60,{airX:2.6,airZ:0,velocityX:0,velocityZ:i<180?300/3.6:Math.max(0,300/3.6-(i-180)*2),yaw:0,time:i/60,preset:'wild'});
   const angles=(groom.inspect!() as {angles:number[]}).angles;angles.forEach((v,j)=>{expect(Number.isFinite(v)).toBe(true);peak[j]=Math.max(peak[j],v);});
  }return bones.map(b=>b.quaternion.clone());
 };
 const first=run();
 const primaryTips=peak.filter((_,i)=>i<24&&i%3===2),featherTips=peak.filter((_,i)=>i>=24&&i%3===2);
 const mean=(a:number[])=>a.reduce((s,v)=>s+v,0)/a.length;
 expect(mean(featherTips)).toBeGreaterThan(mean(primaryTips)*1.3);
 expect(Math.max(...primaryTips)).toBeLessThan(.9);
 console.log('R6g mean peak tip radians',mean(primaryTips),mean(featherTips));expect((groom.inspect!() as {joints:number}).joints).toBe(54);
 for(let c=0;c<18;c++){expect(peak[c*3]).toBeGreaterThan(.0005);expect(peak[c*3+1]).toBeGreaterThan(.01);expect(peak[c*3+2]).toBeGreaterThan(.02);expect(roots[c].position.distanceTo(origins[c])).toBeLessThan(1e-9);}
 // glTF float32 quaternions can have length just below 1: angleTo requires unit quaternions.
 const angle=(a:THREE.Quaternion,b:THREE.Quaternion)=>a.clone().normalize().angleTo(b.clone().normalize());
 groom.step!(0);bones.forEach((b,i)=>expect(b.quaternion.toArray()).toEqual(first[i].toArray()));
 groom.reset!();bones.forEach((b,i)=>expect(angle(b.quaternion,rest[i])).toBeLessThan(1e-6));
 const second=run();second.forEach((q,i)=>expect(angle(q,first[i])).toBeLessThan(1e-6));
 groom.step!(.25);bones.forEach((b,i)=>expect(angle(b.quaternion,rest[i])).toBeLessThan(1e-6));
 scene.position.set(100,2,-200);scene.updateMatrixWorld(true);groom.reset!();groom.step!(1/60);
 scene.updateMatrixWorld(true);bones.forEach(b=>expect(b.matrixWorld.elements.every(Number.isFinite)).toBe(true));
});

import * as THREE from 'three';
import {coastBarrierStyle} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';
import {TRIP_BARRIER_INNER_M} from './road-profile';
import type {createTrack} from './track';

/** Two shared instanced batches per streamed chunk; no per-block materials. */
export function addCoastResort(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],halfAt:(d:number)=>number,start:number,end:number){
 const matrices:{block:THREE.Matrix4[];rail:THREE.Matrix4[]}={block:[],rail:[]},dummy=new THREE.Object3D();
 function part(kind:'block'|'rail',d:number,side:number,y:number,sx:number,sy:number,sz:number){
  const p=sample(d),x=side*(halfAt(d)+TRIP_BARRIER_INNER_M+.28);
  dummy.position.copy(p.position).addScaledVector(p.right,x);
  dummy.position.y=coastBeachHeight(x,p.position.y,p.right.y,d)+y;
  dummy.rotation.set(0,Math.atan2(p.tangent.x,p.tangent.z),0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices[kind].push(dummy.matrix.clone());
 }
 for(let d=Math.ceil(start/12)*12;d<end;d+=12){
  const style=coastBarrierStyle(d);if(style==='opening')continue;
  for(const side of [-1,1]){
   if(style==='block')part('block',d,side,.22,.56,.44,2.6);
   else{
    for(const y of [.42,.70])part('rail',d,side,y,.12,.10,10.8);
    for(const offset of [-5,0,5])part('rail',d+offset,side,.36,.13,.72,.13);
   }
  }
 }
 for(const kind of ['block','rail'] as const){
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:kind==='block'?'#bbb6a5':'#8c9895',roughness:.95}),matrices[kind].length);
  matrices[kind].forEach((m,i)=>mesh.setMatrixAt(i,m));scene.add(mesh);
 }
 return {instances:matrices.block.length+matrices.rail.length,draws:2};
}

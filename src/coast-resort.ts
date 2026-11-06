import * as THREE from 'three';
import {coastBarrierStyle,coastBarrierStoneAt,coastBarrierRockAt,coastBarrierClearance} from './coast-layout';
import {coastBeachHeight} from './scenery-cross-section';
import type {createTrack} from './track';

/** Two shared instanced batches per streamed chunk; no per-block materials. */
export function addCoastResort(scene:THREE.Scene,sample:ReturnType<typeof createTrack>['sample'],halfAt:(d:number)=>number,start:number,end:number){
 const matrices:{block:THREE.Matrix4[];rail:THREE.Matrix4[];rock:THREE.Matrix4[]}={block:[],rail:[],rock:[]},dummy=new THREE.Object3D();
 function part(kind:'block'|'rail'|'rock',d:number,side:-1|1,y:number,sx:number,sy:number,sz:number,roll=0,rockOffset?:number){
  const p=sample(d),x=side*(halfAt(d)+(kind==='rock'?(rockOffset??coastBarrierRockAt(d).offset):coastBarrierClearance(d,side)));
  dummy.position.copy(p.position).addScaledVector(p.right,x);
  dummy.position.y=coastBeachHeight(x,p.position.y,p.right.y,d)+y;
  dummy.rotation.set(0,Math.atan2(p.tangent.x,p.tangent.z)+roll,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices[kind].push(dummy.matrix.clone());
 }
 for(let d=Math.ceil(start/12)*12;d<end;d+=12){
  for(const side of [-1,1] as const){
   const style=coastBarrierStyle(d,side);if(style==='opening'||style==='none'||style==='rock')continue;
   if(style==='block'){
    const stone=coastBarrierStoneAt(d,side);
    part('block',stone.d,side,stone.height/2,.56,stone.height,stone.length);
   }else{
    for(const y of [.42,.70])part('rail',d,side,y,.12,.10,10.8);
    for(const offset of [-5,0,5])part('rail',d+offset,side,.36,.13,.72,.13);
   }
  }
 }
 // Sea-side natural rock clusters: one low-poly instanced draw batch, but
 // only where coastal scenery permits them; 33m irregular cadence, NOT rails.
 for(let d=Math.ceil(start/33)*33;d<end;d+=33){
  if(coastBarrierStyle(d,-1)!=='rock')continue;
  const b=coastBarrierRockAt(d);
  part('rock',b.d,-1,b.height*.41,b.width,b.height,b.length,b.yaw,b.offset);
 }
 for(const kind of ['block','rail','rock'] as const){
  if(!matrices[kind].length)continue;
  const geo=kind==='rock'?new THREE.IcosahedronGeometry(1,1):new THREE.BoxGeometry(1,1,1);
  geo.name=kind==='rock'?'coast-ungarded-natural-rock':'coast-'+kind;
  const mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({
   color:kind==='block'?'#bbb6a5':kind==='rail'?'#8c9895':'#858981',roughness:.95,
  }),matrices[kind].length);
  matrices[kind].forEach((m,i)=>mesh.setMatrixAt(i,m));
  mesh.userData.coastShadowGroup=kind==='rock'?'rocks':'barriers';scene.add(mesh);
 }
 return {instances:matrices.block.length+matrices.rail.length+matrices.rock.length,
  draws:(['block','rail','rock'] as const).filter(k=>matrices[k].length).length};
}

import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';
import {COAST_CROSSWALKS,coastDistrictAt,coastBarrierStyle} from '../src/coast-layout';
import {addCoastResort} from '../src/coast-resort';
import {addCoastMountains} from '../src/coast-mountains';
const track=createPilotTrack(stage);
const road=(start:number,end:number)=>prepareRoadChunk(track.sample,()=>7,()=>[1,0,0],start,end,track.length,false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections);

it('replaces racing curbs and tall continuous rails; puts crossings at populated districts',()=>{
 for(const at of COAST_CROSSWALKS){
  expect(coastDistrictAt(at)).toBeDefined();expect(coastBarrierStyle(at)).toBe('opening');
  const meshes=road(at-8,at+8);
  expect(meshes.some(m=>['edge-red','edge-white','rail'].includes(m.kind))).toBe(false);
  const paint=meshes.find(m=>m.kind==='line')!,p=track.sample(at);
  // Verify a dense crossing across both lane halves, beyond the two edge lines.
  const xs:number[]=[];for(let i=0;i<paint.positions.length;i+=3){const v=new THREE.Vector3().fromArray(paint.positions,i).sub(p.position);if(Math.abs(v.dot(p.tangent))<3)xs.push(v.dot(p.right));}
  expect(xs.length).toBeGreaterThan(100);
  expect(Math.min(...xs)).toBeLessThan(-6);expect(Math.max(...xs)).toBeGreaterThan(6);
 }
});
it('keeps concrete and rails outside the driven lanes, bounded in height and batched',()=>{
 const scene=new THREE.Scene(),stats=addCoastResort(scene,track.sample,()=>7,0,1000);
 expect(stats.draws).toBe(2);expect(scene.children).toHaveLength(2);
 const matrix=new THREE.Matrix4(),scale=new THREE.Vector3();
 for(const mesh of scene.children as THREE.InstancedMesh[]){
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);scale.setFromMatrixScale(matrix);expect(scale.y).toBeLessThanOrEqual(.721);
   const p=new THREE.Vector3().setFromMatrixPosition(matrix);
   let distance=Infinity;for(let d=0;d<=1010;d+=1)distance=Math.min(distance,p.clone().sub(track.sample(d).position).setY(0).length());
   expect(distance).toBeGreaterThan(10.5);
  }
  mesh.dispose();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
});
it('bakes two high inland mountain layers with a small fixed mesh budget',()=>{
 const scene=new THREE.Scene();addCoastMountains(scene,track.sample,track.length);
 expect(scene.children).toHaveLength(2);
 const origin=track.sample(0).position,axis=track.sample(track.length).position.clone().sub(origin).setY(0).normalize(),right=new THREE.Vector3(axis.z,0,-axis.x);if(right.dot(track.sample(5000).right)<0)right.negate();
 let triangles=0;
 for(const mesh of scene.children as THREE.Mesh[]){
  const p=mesh.geometry.attributes.position;let peak=0;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);peak=Math.max(peak,v.y);expect(v.sub(origin).dot(right)).toBeGreaterThan(400);}
  expect(peak).toBeGreaterThan(300);triangles+=mesh.geometry.index!.count/3;
  expect((mesh.material as THREE.MeshBasicMaterial).fog).toBe(false);
  mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
 expect(triangles).toBeLessThan(2500);
});

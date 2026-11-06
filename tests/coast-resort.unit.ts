import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE as stage} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {shoulderProfile} from '../src/road-profile';
import {COAST_CROSSWALKS,coastDistrictAt,coastBarrierStyle,coastBarrierStoneAt,COAST_BEACHES} from '../src/coast-layout';
import {addCoastResort} from '../src/coast-resort';
import {addCoastMountains} from '../src/coast-mountains';
import {farmClearing} from '../src/coast-farm-layout';
const track=createPilotTrack(stage);
const halfAt=(d:number)=>pilotSample(stage,d).halfWidth;
const road=(start:number,end:number)=>prepareRoadChunk(track.sample,halfAt,()=>[1,0,0],start,end,track.length,false,true,[],d=>shoulderProfile(d,804),undefined,true,undefined,stage.scenerySections);

it('uses five full-width coastal lanes throughout the native scenic road',()=>{
 expect(stage.baseLanes).toBe(5);expect(stage.roadWidth).toBe(17.5);
 for(let d=350;d<=10350;d+=50){expect(pilotSample(stage,d).lanes).toBe(5);expect(halfAt(d)).toBe(8.75);}
});

it('replaces racing curbs and tall continuous rails; keeps crossings at districts and the farm visit',()=>{
 for(const at of COAST_CROSSWALKS){
  expect(!!coastDistrictAt(at)||farmClearing(at,20)).toBe(true);expect(coastBarrierStyle(at)).toBe('opening');
  const meshes=road(at-8,at+8);
  expect(meshes.some(m=>['edge-red','edge-white','rail'].includes(m.kind))).toBe(false);
  const paint=meshes.find(m=>m.kind==='line')!,p=track.sample(at);
  // Verify a dense crossing across both lane halves, beyond the two edge lines.
  const xs:number[]=[];for(let i=0;i<paint.positions.length;i+=3){const v=new THREE.Vector3().fromArray(paint.positions,i).sub(p.position);if(Math.abs(v.dot(p.tangent))<3)xs.push(v.dot(p.right));}
  expect(xs.length).toBeGreaterThan(100);
  expect(Math.min(...xs)).toBeLessThan(-8);expect(Math.max(...xs)).toBeGreaterThan(8);
 }
});
it('keeps concrete and rails outside the driven lanes, bounded in height and batched',()=>{
 const scene=new THREE.Scene(),stats=addCoastResort(scene,track.sample,halfAt,0,1000);
 expect(stats.draws).toBe(2);expect(scene.children).toHaveLength(2);
 const matrix=new THREE.Matrix4(),scale=new THREE.Vector3();
 for(const mesh of scene.children as THREE.InstancedMesh[]){
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);scale.setFromMatrixScale(matrix);expect(scale.y).toBeLessThanOrEqual(.721);
   const p=new THREE.Vector3().setFromMatrixPosition(matrix);
   let distance=Infinity;for(let d=0;d<=1010;d+=1)distance=Math.min(distance,p.clone().sub(track.sample(d).position).setY(0).length());
   expect(distance).toBeGreaterThan(12.2);
  }
  mesh.dispose();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
});
it('fades coastal grass warmth before the inland foothills',()=>{
 const strips=road(2350,2375).filter(mesh=>mesh.kind==='grass');
 expect(strips.length).toBeGreaterThan(25);
 const avgGreen=(colors:Float32Array)=>{
  let total=0;
  for(let i=1;i<colors.length;i+=3)total+=colors[i];
  return total/(colors.length/3);
 };
 // Terrain strip order runs from the road verge inland; farther slopes
 // should not become a brighter yellow-green band behind the houses.
 const roadside=avgGreen(strips[0].colors);
 const inland=avgGreen(strips.at(-1)!.colors);
 expect(inland).toBeLessThan(roadside);
 expect(inland).toBeGreaterThan(0);
});
it('bakes two high inland mountain layers with a small fixed mesh budget',()=>{
 const scene=new THREE.Scene();addCoastMountains(scene,track.sample,track.length);
 expect(scene.children).toHaveLength(2);
 const origin=track.sample(0).position,axis=track.sample(track.length).position.clone().sub(origin).setY(0).normalize(),right=new THREE.Vector3(axis.z,0,-axis.x);if(right.dot(track.sample(5000).right)<0)right.negate();
 let triangles=0;
 for(const mesh of scene.children as THREE.Mesh[]){
  const p=mesh.geometry.attributes.position;let peak=0;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);peak=Math.max(peak,v.y);expect(v.sub(origin).dot(right)).toBeGreaterThan(400);}
  expect(peak).toBeGreaterThan(mesh.name.endsWith('0')?200:400);triangles+=mesh.geometry.index!.count/3;
  // Full slopes carry sunlight variation, instead of a single flat colour band.
  const normals=mesh.geometry.attributes.normal,colors=mesh.geometry.attributes.color;
  let darkest=Infinity,lightest=0,steep=0;
  for(let i=0;i<colors.count;i++){const l=colors.getX(i)+colors.getY(i)+colors.getZ(i);darkest=Math.min(darkest,l);lightest=Math.max(lightest,l);if(Math.abs(normals.getY(i))<.9)steep++;}
  // Normalize relief contrast to the baked brightness: the rear range is
  // intentionally much darker, so an absolute lightness gap is misleading.
  expect(lightest).toBeGreaterThan(0);
  expect((lightest-darkest)/lightest).toBeGreaterThan(.08);
  // Lower, gentler middle ridges naturally have fewer steep-facing vertices.
  // Still require meaningful relief on both mountain sheets.
  expect(steep).toBeGreaterThan(70);
  expect((mesh.material as THREE.MeshBasicMaterial).fog).toBe(false);
  mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
 }
 expect(triangles).toBeLessThan(14000);
});

it('uses human beach access and uninterrupted remote headland rails, never a fixed checkerboard',()=>{
 for(const bay of COAST_BEACHES){
  const half=Math.min(440,bay.radius*.70);
  for(let d=Math.ceil((bay.distance-half+24)/12)*12;d<bay.distance+half-24;d+=12)
   if(!COAST_CROSSWALKS.some(at=>Math.abs(d-at)<14))
    expect(coastBarrierStyle(d,-1)).toBe('block');
 }
 for(let d=2400;d<=3600;d+=12)
  if(!COAST_CROSSWALKS.some(at=>Math.abs(d-at)<14))
   expect(coastBarrierStyle(d,-1)).toBe('rail');
 expect(coastBarrierStyle(4100,1)).toBe('block');
 expect(coastBarrierStyle(5500,1)).toBe('block');
 expect(coastBarrierStyle(3300,1)).toBe('rail');
 expect(coastBarrierStyle(2740,1)).toBe('block');
 for(const at of COAST_CROSSWALKS){
  expect(coastBarrierStyle(at,-1)).toBe('opening');
  expect(coastBarrierStyle(at,1)).toBe('opening');
 }
 const styles=Array.from({length:834},(_,i)=>coastBarrierStyle(i*12,-1));
 expect(styles.slice(1).filter((v,i)=>v!==styles[i]).length).toBeLessThan(32);
});

it('adds deterministic but non-periodic stone imperfections without moving into the roadway',()=>{
 const a=coastBarrierStoneAt(1548,-1);
 expect(coastBarrierStoneAt(1548,-1)).toEqual(a);
 expect(a.d).toBeGreaterThan(1546);
 expect(a.d).toBeLessThan(1550);
 expect(a.length).toBeGreaterThan(2.1);
 expect(a.length).toBeLessThan(3.3);
 expect(a.height).toBeGreaterThan(.38);
 expect(a.height).toBeLessThan(.5);
 expect(coastBarrierStoneAt(1560,-1)).not.toEqual(a);
 expect(coastBarrierStoneAt(1548,1).d).not.toEqual(a.d);
});

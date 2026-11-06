import {it,expect} from 'vitest';
import * as THREE from 'three';
import {coastMountainHeight,addCoastMountains,COAST_MOUNTAIN_ROWS} from '../src/coast-mountains';
import type {createTrack} from '../src/track';
it('cuts varied summit lines and valley notches without approaching the road',()=>{
 for(const layer of [0,1] as const){
  for(const d of [0,500,1850,3500,6500,9200]){
   expect(coastMountainHeight(layer,d,0)).toBeCloseTo(-22,5);
   expect(coastMountainHeight(layer,d,1)).toBeCloseTo(-22,5);
  }
  const heights=Array.from({length:70},(_,i)=>coastMountainHeight(layer,i*143,.44));
  expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(65);
  expect(heights.every(Number.isFinite)).toBe(true);
 }
});
it('keeps two static baked-vertex-color mountain sheets with a small fixed mesh budget',()=>{
 const scene=new THREE.Scene();
 const sample=((d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0)})) as ReturnType<typeof createTrack>['sample'];
 addCoastMountains(scene,sample,10000);
 expect(scene.children).toHaveLength(2);
 const meshes=scene.children as THREE.Mesh[];
 for(let i=0;i<2;i++){
  const mesh=meshes[i],geo=mesh.geometry as THREE.BufferGeometry;
  expect(mesh.name).toBe('coast-mountains-'+i);
  expect(mesh.castShadow).toBe(false);
  expect(mesh.frustumCulled).toBe(false);
  expect(geo.getAttribute('position').count%COAST_MOUNTAIN_ROWS).toBe(0);
  expect(geo.getAttribute('color').count).toBe(geo.getAttribute('position').count);
  expect(geo.getAttribute('position').count).toBeLessThan(6000);
  const pos=geo.getAttribute('position').array,colors=geo.getAttribute('color').array;
  expect([...pos].every(Number.isFinite)).toBe(true);
  expect([...colors].every(Number.isFinite)).toBe(true);
  expect((mesh.material as THREE.MeshBasicMaterial).vertexColors).toBe(true);
  geo.dispose();(mesh.material as THREE.Material).dispose();
 }
});

it('uses a darker backlit rear ridge rather than a pale silhouette cutout',()=>{
 const scene=new THREE.Scene();
 const sample=((d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0)})) as ReturnType<typeof createTrack>['sample'];
 addCoastMountains(scene,sample,10000);
 const sampleRidgeTone=(mesh:THREE.Mesh)=>{
  const positions=(mesh.geometry as THREE.BufferGeometry).getAttribute('position');
  const colors=(mesh.geometry as THREE.BufferGeometry).getAttribute('color');
  let weighted=0,count=0;
  for(let i=0;i<positions.count;i++){
   if(positions.getY(i)<95)continue;
   // Compare only exposed mountain faces, not the bottom dark skirt.
   const r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
   weighted+=.2126*r+.7152*g+.0722*b;count++;
  }
  expect(count).toBeGreaterThan(200);
  return weighted/count;
 };
 const [mid,far]=scene.children as THREE.Mesh[];
 const midTone=sampleRidgeTone(mid),farTone=sampleRidgeTone(far);
 // Atmospheric depth remains, but the whole remote range cannot be lighter
 // than the warmly lit middle hills (the previous visual regression).
 expect(farTone).toBeLessThan(midTone);
 expect(farTone).toBeGreaterThan(midTone*.54);
 for(const mesh of [mid,far]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
});

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
  const material=mesh.material as THREE.MeshBasicMaterial;
  // Both sheets sit behind the real middle hills. ACES was lifting their
  // greens much brighter than their baked vertex colors implied.
  expect(material.toneMapped).toBe(false);
  expect(material.color.r).toBeGreaterThan(.45);
  expect(material.color.r).toBeLessThan(.65);
  expect(material.color.g).toBeCloseTo(material.color.r,6);
  expect(material.color.b).toBeCloseTo(material.color.r,6);
  geo.dispose();(mesh.material as THREE.Material).dispose();
 }
});

it('renders the rear range as subdued forest green, darker than the middle range',()=>{
 const scene=new THREE.Scene();
 const sample=((d:number)=>({position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0)})) as ReturnType<typeof createTrack>['sample'];
 addCoastMountains(scene,sample,10000);
 const sampleRidgeTone=(mesh:THREE.Mesh)=>{
  const positions=(mesh.geometry as THREE.BufferGeometry).getAttribute('position');
  const colors=(mesh.geometry as THREE.BufferGeometry).getAttribute('color');
  const material=mesh.material as THREE.MeshBasicMaterial;
  let weighted=0,red=0,green=0,blue=0,count=0;
  for(let i=0;i<positions.count;i++){
   if(positions.getY(i)<95)continue;
   // Approximate actual display output: baked color * material tint,
   // converted from linear RGB to sRGB with tone mapping disabled.
   const color=new THREE.Color(
    colors.getX(i)*material.color.r,
    colors.getY(i)*material.color.g,
    colors.getZ(i)*material.color.b,
   ).convertLinearToSRGB();
   weighted+=.2126*color.r+.7152*color.g+.0722*color.b;
   red+=color.r;green+=color.g;blue+=color.b;count++;
  }
  expect(count).toBeGreaterThan(200);
  return {luminance:weighted/count,r:red/count,g:green/count,b:blue/count};
 };
 const [mid,far]=scene.children as THREE.Mesh[];
 const midTone=sampleRidgeTone(mid),farTone=sampleRidgeTone(far);
 // These are final sRGB brightness checks, not vertex-only comparisons.
 // The earlier vertex-only test passed while ACES made the ridges too bright.
 expect(midTone.luminance).toBeLessThan(.32);
 expect(farTone.luminance).toBeLessThan(.27);
 expect(farTone.luminance).toBeLessThan(midTone.luminance*.87);
 expect(farTone.luminance).toBeGreaterThan(.10); // dark green, not black
 expect(farTone.g).toBeGreaterThan(farTone.r*1.08);
 expect(farTone.g).toBeGreaterThan(farTone.b*1.04);
 for(const mesh of [mid,far]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}
});

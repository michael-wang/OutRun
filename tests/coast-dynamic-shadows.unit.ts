import {it,expect} from 'vitest';
import * as THREE from 'three';
import {makeCoastShadowMaterial,coastShadowLength,COAST_SHADOW_YAW} from '../src/coast-sun-shadow';
import {CoastDuskShadows} from '../src/coast-dusk-shadows';
import {RoadCones,coneLayout} from '../src/road-cones';
import {Traffic} from '../src/traffic';
import {TRAFFIC_TYPES,vehicleGeometry} from '../src/vehicle-model';
import type {createTrack} from '../src/track';
import {configureCoastShadowLights} from '../src/coast-shadow-coverage';
import {COAST_DYNAMIC_SHADOW_LAYER,COAST_STATIC_SHADOW_LAYER,markCoastShadowCaster} from '../src/coast-shadow-layers';

const sample=((d:number)=>({
 position:new THREE.Vector3(0,4,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,grade:0,
})) as ReturnType<typeof createTrack>['sample'];

it('sunset decal ink is alpha-only black and cannot brighten a dark road',()=>{
 const mat=makeCoastShadowMaterial();
 const pixels=(mat.map as THREE.DataTexture).image.data as Uint8Array;
 let maxAlpha=0;
 for(let i=0;i<pixels.length;i+=4){
  expect(pixels[i]).toBe(0);expect(pixels[i+1]).toBe(0);expect(pixels[i+2]).toBe(0);
  maxAlpha=Math.max(maxAlpha,pixels[i+3]);
 }
 expect(maxAlpha).toBeGreaterThan(150);
 expect(mat.blending).toBe(THREE.NormalBlending);
 expect(mat.color.getHex()).toBe(0x000000);
 mat.map?.dispose();mat.dispose();
 const scene=new THREE.Scene(),shadows=new CoastDuskShadows(scene,sample,1000,()=>8.75,804);
 try{
  const pixels=(shadows.player.material.map as THREE.DataTexture).image.data as Uint8Array;
  expect(pixels[0]).toBe(0);expect(pixels[1]).toBe(0);expect(pixels[2]).toBe(0);
 }finally{shadows.dispose();}
});

it('traffic casts follow sunset, use one bounded instance pool and respect reset',()=>{
 const scene=new THREE.Scene();
 const traffic=new Traffic(scene,sample,()=>8.75,5000,804,()=>true,[],undefined,true,true);
 try{
  traffic.update(0,0);
  const stats=traffic.inspect();
  expect(stats.contactShadows).toBeGreaterThan(0);
  expect(stats.sunsetProjectedShadows).toBe(stats.contactShadows);
  expect(stats.shadowCasting).toBe(false);
  const casts=scene.getObjectByName('traffic-sunset-shadows') as THREE.InstancedMesh;
  expect(casts.count).toBeLessThanOrEqual(12);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),quaternion=new THREE.Quaternion();
  casts.getMatrixAt(0,matrix);matrix.decompose(position,quaternion,scale);
  expect(scale.z).toBeGreaterThan(coastShadowLength(1.65));
  expect(quaternion.angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),COAST_SHADOW_YAW))).toBeLessThan(.001);
  traffic.reset();expect(casts.count).toBe(0);
 }finally{traffic.dispose();}
});

it('road cones cast coast sun shadows, absent on unmodified routes',()=>{
 const scene=new THREE.Scene(),layout=coneLayout(804,8000);
 const cones=new RoadCones(sample,()=>8.75,scene,804,8000,()=>true,undefined,true);
 const baseline=new RoadCones(sample,()=>8.75,scene,804,8000,()=>true,undefined,false);
 try{
  cones.update(0,layout[0].distance-30,0,0);
  baseline.update(0,layout[0].distance-30,0,0);
  expect(cones.inspect().active).toBeGreaterThan(0);
  expect(cones.inspect().sunsetProjectedShadows).toBe(cones.inspect().active);
  expect(baseline.inspect().sunsetProjectedShadows).toBe(0);
  const shadows=scene.getObjectByName('road-cone-sunset-shadows') as THREE.InstancedMesh;
  expect(shadows.count).toBeLessThanOrEqual(48);
  const matrix=new THREE.Matrix4(),scale=new THREE.Vector3();
  shadows.getMatrixAt(0,matrix);
  matrix.decompose(new THREE.Vector3(),new THREE.Quaternion(),scale);
  expect(scale.z).toBeGreaterThan(coastShadowLength(1.35));
  cones.reset();expect(shadows.count).toBe(0);
 }finally{cones.dispose();baseline.dispose();}
});

it('casts the full truck cab, cargo and wheels instead of a rear-only rectangle',()=>{
 const truck=vehicleGeometry(2);
 try{
  truck.computeBoundingBox();
  expect(truck.boundingBox!.min.z).toBeLessThan(-3.5);
  expect(truck.boundingBox!.max.z).toBeGreaterThan(3.5);
 }finally{truck.dispose();}
 const scene=new THREE.Scene();
 const traffic=new Traffic(scene,sample,()=>8.75,5000,804,()=>true,[],undefined,true,true,true);
 try{
  traffic.update(0,0);
  expect(traffic.inspect().shadowCasting).toBe(true);
  expect(traffic.inspect().sunsetProjectedShadows).toBe(0);
  expect(scene.getObjectByName('traffic-sunset-shadows')).toBeUndefined();
  for(const type of TRAFFIC_TYPES){
   const mesh=scene.getObjectByName('traffic-'+type.name) as THREE.InstancedMesh;
   expect(mesh.castShadow).toBe(true);
   expect(mesh.layers.isEnabled(COAST_DYNAMIC_SHADOW_LAYER)).toBe(true);
   expect(mesh.layers.isEnabled(COAST_STATIC_SHADOW_LAYER)).toBe(false);
   expect(mesh.geometry.getAttribute('position').count).toBeGreaterThan(100);
  }
  const cones=new RoadCones(sample,()=>8.75,scene,804,8000,()=>true,undefined,true,true);
  try{
   cones.update(0,1500,0,0);
   expect((scene.getObjectByName('road-cones') as THREE.InstancedMesh).castShadow).toBe(true);
   expect((scene.getObjectByName('road-cones') as THREE.InstancedMesh).layers.isEnabled(COAST_DYNAMIC_SHADOW_LAYER)).toBe(true);
   expect(scene.getObjectByName('road-cone-sunset-shadows')).toBeUndefined();
   expect(cones.inspect().sunsetProjectedShadows).toBe(0);
  }finally{cones.dispose();}
 }finally{traffic.dispose();}
});

it('static casters are separated from dynamic depth passes without hiding main-camera geometry',()=>{
 const house=markCoastShadowCaster(new THREE.Mesh(new THREE.BoxGeometry(3,5,4)), 'static');
 const truck=markCoastShadowCaster(new THREE.Mesh(new THREE.BoxGeometry(3,3,7)), 'dynamic');
 const camera=new THREE.PerspectiveCamera();
 const sun=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(sun,far,true);
 expect(camera.layers.test(house.layers)).toBe(true);
 expect(camera.layers.test(truck.layers)).toBe(true);
 expect(sun.shadow.camera.layers.test(house.layers)).toBe(false);
 expect(sun.shadow.camera.layers.test(truck.layers)).toBe(true);
 expect(far.shadow.camera.layers.test(house.layers)).toBe(true);
 expect(far.shadow.camera.layers.test(truck.layers)).toBe(false);
 house.geometry.dispose();truck.geometry.dispose();
});

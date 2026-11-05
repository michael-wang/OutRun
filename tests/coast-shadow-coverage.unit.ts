import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_SUN} from '../src/coast-dusk';
import {
 COAST_NEAR_SHADOW,COAST_FAR_SHADOW,COAST_SHADOW_LOOKAHEAD_M,
 configureCoastShadowLights,updateCoastShadowLights,
} from '../src/coast-shadow-coverage';

const sample=(d:number)=>({position:new THREE.Vector3(0,5,d)});

it('covers the visible coast and right hillside before the player reaches the props',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(near,far,true);
 expect(near.shadow.mapSize.x).toBe(3072);
 expect(far.shadow.mapSize.x).toBe(4096);
 expect(COAST_NEAR_SHADOW.right-COAST_NEAR_SHADOW.left).toBeGreaterThan(500);
 expect(COAST_FAR_SHADOW.right-COAST_FAR_SHADOW.left).toBeGreaterThan(2600);
 expect(COAST_FAR_SHADOW.far).toBeGreaterThan(3500);
 const car=sample(500).position;
 updateCoastShadowLights(near,far,car,sample,500,10000);
 expect(far.target.position.z).toBeCloseTo(500+COAST_SHADOW_LOOKAHEAD_M*.9);
 for(const light of [near,far]){
  expect(light.position.clone().sub(light.target.position).normalize().dot(COAST_SUN)).toBeCloseTo(1,5);
 }
 // The renderer aligns its shadow camera to the light direction during
 // shadow-map setup. Project representative already-visible geometry into it.
 const camera=far.shadow.camera;
 camera.position.copy(far.position);
 camera.lookAt(far.target.position);
 camera.updateMatrixWorld(true);
 camera.updateProjectionMatrix();
 for(const distance of [350,500,1000,1500,1900]){
  for(const lateral of [-100,0,300]){
   for(const height of [0,11.5,85]){
    const ndc=new THREE.Vector3(lateral,5+height,distance).project(camera);
    expect(Math.abs(ndc.x)).toBeLessThan(1);
    expect(Math.abs(ndc.y)).toBeLessThan(1);
    expect(Math.abs(ndc.z)).toBeLessThan(1);
   }
  }
 }
});

it('keeps a near shadow pass for lamps and vehicle detail',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(near,far,true);
 updateCoastShadowLights(near,far,sample(500).position,sample,500,10000);
 const camera=near.shadow.camera;
 camera.position.copy(near.position);
 camera.lookAt(near.target.position);
 camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
 for(const distance of [440,500,560])for(const lateral of [-110,0,130]){
  const ndc=new THREE.Vector3(lateral,18,distance).project(camera);
  expect(Math.abs(ndc.x)).toBeLessThan(1);
  expect(Math.abs(ndc.y)).toBeLessThan(1);
  expect(Math.abs(ndc.z)).toBeLessThan(1);
 }
});

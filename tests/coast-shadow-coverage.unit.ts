import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_SUN} from '../src/coast-dusk';
import {
 COAST_NEAR_SHADOW,COAST_FAR_SHADOW,COAST_SHADOW_LOOKAHEAD_M,COAST_STATIC_SHADOW_STEP_M,CoastShadowCache,
 configureCoastShadowLights,updateCoastShadowLights,
} from '../src/coast-shadow-coverage';

const sample=(d:number)=>({position:new THREE.Vector3(0,5,d)});

it('covers the visible coast and right hillside before the player reaches the props',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(near,far,true);
 expect(near.shadow.mapSize.x).toBe(2048);
 expect(far.shadow.mapSize.x).toBe(3072);
 expect(COAST_NEAR_SHADOW.right-COAST_NEAR_SHADOW.left).toBeGreaterThan(400);
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

it('caches fixed-sun static shadows inside a route cell but updates dynamic shadows each frame',()=>{
 const near=new THREE.DirectionalLight(),far=new THREE.DirectionalLight();
 configureCoastShadowLights(near,far,true);
 expect(far.shadow.autoUpdate).toBe(false);
 expect(near.shadow.autoUpdate).toBe(true);
 expect(near.shadow.camera.layers.isEnabled(2)).toBe(true);
 expect(far.shadow.camera.layers.isEnabled(1)).toBe(true);
 const c=new CoastShadowCache(near,far,sample,10000);
 const car=sample(500).position;
 expect(c.update(car,500,2)).toBe(true);
 const staticOrigin=far.position.clone(),staticTarget=far.target.position.clone();
 far.shadow.needsUpdate=false;
 expect(c.update(sample(505).position,505,2)).toBe(false);
 expect(far.position.equals(staticOrigin)).toBe(true);
 expect(far.target.position.equals(staticTarget)).toBe(true);
 expect(far.shadow.needsUpdate).toBe(false);
 expect(near.target.position.z).toBeCloseTo(505);
 // Streaming a newly prepared chunk re-bakes the same static region once.
 expect(c.update(sample(505).position,505,3)).toBe(true);
 expect(far.shadow.needsUpdate).toBe(true);
 expect(c.stats.staticRefreshRequests).toBe(2);
 far.shadow.needsUpdate=false;
 const nextCell=Math.ceil(505/COAST_STATIC_SHADOW_STEP_M)*COAST_STATIC_SHADOW_STEP_M;
 expect(c.update(sample(nextCell).position,nextCell,3)).toBe(true);
 expect(far.shadow.needsUpdate).toBe(true);
 expect(c.stats.staticRefreshRequests).toBe(3);
 expect(c.stats.policy).toContain('static-region-cache');
});

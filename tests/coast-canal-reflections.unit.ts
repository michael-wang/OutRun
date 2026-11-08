import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {COAST_DRAIN_X,COAST_UTILITY_POLES,COAST_DRAIN_BRIDGES} from '../src/coast-roadside-layout';
import {
 COAST_CANAL_REFLECT_LENGTH,COAST_CANAL_REFLECT_TEXELS,
 coastCanalReflectionsAt,buildCoastCanalReflectionTexture,
} from '../src/coast-canal-reflections';
import {makeCoastDrainWaterMaterial} from '../src/coast-drain-water';
import {buildCoastRoadsideDrain,buildCoastRoadsideWater} from '../src/coast-roadside-geometry';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {chaseTargets} from '../src/chase';

it('reflects nearby authored poles and bridge parapets, not repeating fake scenery',()=>{
 const pole=COAST_UTILITY_POLES.find(p=>p.d===906)!;
 expect(pole).toBeDefined();
 const poleWeight=coastCanalReflectionsAt(pole.d);
 expect(poleWeight.pole).toBeGreaterThan(.65);
 const bridge=COAST_DRAIN_BRIDGES.find(b=>b.d===1052)!;
 expect(bridge).toBeDefined();
 expect(coastCanalReflectionsAt(bridge.d).bridge).toBe(1);
 expect(coastCanalReflectionsAt(bridge.d+bridge.width*.5).bridge).toBeCloseTo(.5);
 expect(coastCanalReflectionsAt(bridge.d+bridge.width*.5+2).bridge).toBe(0);
 for(const d of [3700,5150,9850,10350]){
  expect(coastCanalReflectionsAt(d)).toMatchObject({pole:0,bridge:0});
 }
});

it('packs one tiny 16KB linear reflection atlas with actual absolute route metres',()=>{
 const map=buildCoastCanalReflectionTexture();
 try{
  expect(map).toBeInstanceOf(THREE.DataTexture);
  expect(map.name).toBe('coast-canal-authored-reflections');
  expect(map.image.width).toBe(COAST_CANAL_REFLECT_TEXELS);
  expect(map.image.height).toBe(1);
  expect((map.image.data as Uint8Array).byteLength).toBe(COAST_CANAL_REFLECT_TEXELS*4);
  expect(COAST_CANAL_REFLECT_LENGTH).toBeGreaterThan(10800);
  expect(map.minFilter).toBe(THREE.LinearFilter);
  const i=Math.floor(906/COAST_CANAL_REFLECT_LENGTH*COAST_CANAL_REFLECT_TEXELS);
  expect((map.image.data as Uint8Array)[i*4]).toBeGreaterThan(100);
 }finally{map.dispose();}
});

it('samples authored reflected props in the existing sea FFT/sky canal material',()=>{
 const m=makeCoastDrainWaterMaterial({value:2});
 const texture=m.userData.coastCanalReflectionTexture as THREE.DataTexture;
 expect(texture).toBeInstanceOf(THREE.DataTexture);
 const shader:any={uniforms:{},
  vertexShader:'#include <common>\n#include <begin_vertex>',
  fragmentShader:'#include <common>\n#include <color_fragment>',
 };
 try{
  m.onBeforeCompile(shader,{} as any);
  expect(shader.uniforms.uCoastReflectedProps.value).toBe(texture);
  expect(shader.fragmentShader).toContain('uCoastReflectedProps');
  expect(shader.fragmentShader).toContain('coastSky(reflected,sun)');
  expect(shader.fragmentShader).toContain('uCoastSlope3');
  expect(shader.fragmentShader).toContain('dot(poleRay.xz,along)');
  expect(shader.fragmentShader).not.toContain('bankFoam');
  const cleanup=readFileSync(new URL('../src/streamed-scene.ts',import.meta.url),'utf8');
  expect(cleanup).toContain('localAtlas?.dispose()');
 }finally{texture.dispose();m.dispose();}
});

it('exposes water toward the far bank to the chase camera but hides it under a driveway',()=>{
 const {sample}=createPilotTrack(COAST_ULTRA_STAGE);
 const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 const walls=new THREE.Mesh(buildCoastRoadsideDrain(sample,950,1080)!,mat);
 const water=new THREE.Mesh(buildCoastRoadsideWater(sample,950,1080)!,mat);
 const ray=new THREE.Raycaster();
 try{
  for(const d of [988,1000,1010,1052]){
   const frame=sample(d),above=frame.position.clone().addScaledVector(frame.right,COAST_DRAIN_X.innerRight-.07);
   above.y+=5;
   ray.set(above,new THREE.Vector3(0,-1,0));
   const target=ray.intersectObject(water)[0].point;
   const car=sample(d-25),{eye}=chaseTargets(car.position,car.roadHeading);
   ray.set(eye,target.clone().sub(eye).normalize());
   expect(ray.intersectObjects([walls,water])[0]?.object===water,`sightline at ${d}m`).toBe(d!==1052);
  }
 }finally{walls.geometry.dispose();water.geometry.dispose();mat.dispose();}
});

import {it,expect} from 'vitest';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {COAST_UTILITY_POLES,COAST_DRAIN_BRIDGES} from '../src/coast-roadside-layout';
import {
 COAST_CANAL_REFLECT_LENGTH,COAST_CANAL_REFLECT_TEXELS,
 coastCanalReflectionsAt,buildCoastCanalReflectionTexture,
} from '../src/coast-canal-reflections';
import {makeCoastDrainWaterMaterial} from '../src/coast-drain-water';

it('reflects nearby authored poles and bridge parapets, not repeating fake scenery',()=>{
 const pole=COAST_UTILITY_POLES.find(p=>p.d===906)!;
 expect(pole).toBeDefined();
 const poleWeight=coastCanalReflectionsAt(pole.d);
 expect(poleWeight.pole).toBeGreaterThan(.65);
 const bridge=COAST_DRAIN_BRIDGES.find(b=>b.d===1052)!;
 expect(bridge).toBeDefined();
 expect(coastCanalReflectionsAt(bridge.d).bridge).toBe(0); // hidden by actual slab
 expect(coastCanalReflectionsAt(bridge.d+bridge.width*.5+1.5).bridge).toBeGreaterThan(.2);
 for(const d of [3700,5150,9850,10350]){
  expect(coastCanalReflectionsAt(d)).toEqual({pole:0,bridge:0});
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
  expect(shader.fragmentShader).toContain('featureWarp');
  expect(shader.fragmentShader).toContain('vCoastFlowUV.y+featureWarp');
  expect(shader.fragmentShader).not.toContain('bankFoam');
  const cleanup=readFileSync(new URL('../src/streamed-scene.ts',import.meta.url),'utf8');
  expect(cleanup).toContain('localAtlas?.dispose()');
 }finally{texture.dispose();m.dispose();}
});

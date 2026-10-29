import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {TireEffects,type TireContact} from '../src/tire-effects';
const contacts=(z:number,road=true):TireContact[]=>['rear','front'].flatMap(axle=>[-1,1].map(side=>({name:`${axle}-wheel-${side}`,gap:0,surface:[side,0,z],normal:[0,1,0],onRoad:road})));
describe('bounded contact-driven tire effects',()=>{
 it('requires meaningful slip, speed and real asphalt contact, then expires after grip returns',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene);
  for(let i=1;i<60;i++)fx.update(i/60,65,0,false,contacts(i),200);expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);
  for(let i=60;i<90;i++)fx.update(i/60,65,1,true,contacts(i,false),200);expect(fx.inspect().particles).toBe(0);
  for(let i=90;i<150;i++)fx.update(i/60,65,1,true,contacts(i),200);expect(fx.inspect().particles).toBeGreaterThan(0);expect(fx.inspect().segments).toBeGreaterThan(0);
  const marks=scene.getObjectByName('tire-marks') as THREE.Mesh,p=marks.geometry.getAttribute('position');
  for(let i=0;i<fx.inspect().segments*6;i++)expect(p.getY(i)).toBeCloseTo(.014,5);
  for(let i=150;i<1400;i++)fx.update(i/60,65,0,false,contacts(i),200);expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);expect(marks.visible).toBe(false);fx.dispose();expect(scene.children).toHaveLength(0);
 });
 it('reuses two geometries through ten minutes of drifting and resets without stale trails',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene),ids=scene.children.map(o=>(o as THREE.Mesh).geometry.uuid);
  for(let i=1;i<=36000;i++)fx.update(i/60,65,1,true,contacts(i),200);
  expect(fx.inspect()).toMatchObject({particles:192,segments:768,geometries:2});expect(scene.children.map(o=>(o as THREE.Mesh).geometry.uuid)).toEqual(ids);
  fx.clear();expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);expect(scene.children.every(o=>!o.visible)).toBe(true);
  fx.update(.016,65,1,true,contacts(999999),200);expect(fx.inspect().segments).toBe(0);fx.dispose();
 });
});

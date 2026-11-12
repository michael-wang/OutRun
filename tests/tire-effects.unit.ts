import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {TireEffects,type TireContact} from '../src/tire-effects';
const contacts=(z:number,road=true):TireContact[]=>['rear','front'].flatMap(axle=>[-1,1].map(side=>({name:`${axle}-wheel-${side}`,gap:0,surface:[side,0,z],normal:[0,1,0],onRoad:road})));
describe('bounded contact-driven tire effects',()=>{
 it('uses dusk tint only for sunset coast and adapts canyon/city palettes without altering dust',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene),dust=new TireEffects(scene,'dust');
  try{
   fx.setSceneSmoke([1,0,0],true);
   expect(fx.inspect().tint).toEqual([.51,.48,.48]);
   fx.setSceneSmoke([0,1,0],false);
   expect(fx.inspect().tint).toEqual([.70,.64,.59]);
   fx.setSceneSmoke([0,0,1],false);
   expect(fx.inspect().tint).toEqual([.70,.72,.75]);
   fx.setSceneSmoke([1,0,0],false);
   expect(fx.inspect().tint).toEqual([.81,.80,.80]);
   const dustTint=dust.inspect().tint;
   dust.setSceneSmoke([0,1,0],false);
   expect(dust.inspect().tint).toEqual(dustTint);
  }finally{fx.dispose();dust.dispose();}
 });

 it('uses subdued, irregular and bounded coastal smoke without extra draw batches',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene);
  fx.setDuskSmoke(true);
  for(let i=1;i<24;i++)fx.update(i/60,65,1,contacts(i),200);
  const smoke=scene.getObjectByName('tire-smoke') as THREE.Mesh;
  const material=smoke.material as THREE.ShaderMaterial;
  expect(material.uniforms.tint.value.toArray()).toEqual([.51,.48,.48]);
  expect(fx.inspect().smokeRadius).toBeLessThan(1);
  const variation=smoke.geometry.getAttribute('variation');
  expect(variation).toBeDefined();
  expect(variation.getX(2)).not.toBeCloseTo(variation.getX(5));
  expect(fx.inspect()).toMatchObject({geometries:2,particleCapacity:192});
  fx.dispose();
 });
 it('keeps fresh smoke near the contact plane and trailing the moving tire before rising',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene);fx.update(1/60,60,1,contacts(1),200);fx.update(2/60,60,1,contacts(2),200);
  const smoke=scene.getObjectByName('tire-smoke') as THREE.Points,p=smoke.geometry.getAttribute('center'),z=p.getZ(4),y=p.getY(4);
  fx.update(3/60,60,0,contacts(3),200);expect(p.getZ(4)).toBeGreaterThan(z);expect(p.getZ(4)-z).toBeLessThan(.3);expect(p.getY(4)).toBeCloseTo(y);expect(fx.inspect().particles).toBeGreaterThan(0);fx.dispose();
 });
 it('requires meaningful slip, speed and real asphalt contact, then expires after grip returns',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene);
  for(let i=1;i<60;i++)fx.update(i/60,65,0,contacts(i),200);expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);
  for(let i=60;i<90;i++)fx.update(i/60,65,1,contacts(i,false),200);expect(fx.inspect().particles).toBe(0);
  for(let i=90;i<150;i++)fx.update(i/60,65,1,contacts(i),200);expect(fx.inspect().particles).toBeGreaterThan(0);expect(fx.inspect().segments).toBeGreaterThan(0);
  const marks=scene.getObjectByName('tire-marks') as THREE.Mesh,p=marks.geometry.getAttribute('position');
  for(let i=0;i<fx.inspect().segments*6;i++)expect(p.getY(i)).toBeCloseTo(.014,5);
  for(let i=150;i<1400;i++)fx.update(i/60,65,0,contacts(i),200);expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);expect(marks.visible).toBe(false);fx.dispose();expect(scene.children).toHaveLength(0);
 });
 it('reuses two geometries through ten minutes of drifting and resets without stale trails',()=>{
  const scene=new THREE.Scene(),fx=new TireEffects(scene),ids=scene.children.map(o=>(o as THREE.Mesh).geometry.uuid);
  for(let i=1;i<=36000;i++)fx.update(i/60,65,1,contacts(i),200);
  expect(fx.inspect()).toMatchObject({particleCapacity:192,segments:768,geometries:2});expect(fx.inspect().particles).toBeGreaterThan(100);expect(fx.inspect().particles).toBeLessThanOrEqual(192);expect(scene.children.map(o=>(o as THREE.Mesh).geometry.uuid)).toEqual(ids);
  fx.clear();expect(fx.inspect().particles).toBe(0);expect(fx.inspect().segments).toBe(0);expect(scene.children.every(o=>!o.visible)).toBe(true);
  fx.update(.016,65,1,contacts(999999),200);expect(fx.inspect().segments).toBe(0);fx.dispose();
 });
});

describe('R4c smoke drift in shared wind',()=>{
 it('advects smoke after birth without moving tire marks or adding geometry',()=>{
  const still=new THREE.Scene(),breezy=new THREE.Scene();
  const a=new TireEffects(still),b=new TireEffects(breezy);
  b.setWind(()=>({x:3,z:0}));
  for(let i=1;i<35;i++){const c=contacts(i*.6);a.update(i/60,65,1,c,200);b.update(i/60,65,1,c,200);}
  const centers=(scene:THREE.Scene)=>((scene.getObjectByName('tire-smoke') as THREE.Mesh).geometry.getAttribute('center'));
  const marks=(scene:THREE.Scene)=>((scene.getObjectByName('tire-marks') as THREE.Mesh).geometry.getAttribute('position'));
  expect(centers(breezy).getX(4)-centers(still).getX(4)).toBeGreaterThan(.08);
  expect(centers(breezy).getZ(4)).toBeCloseTo(centers(still).getZ(4),5);
  expect(Array.from(marks(breezy).array)).toEqual(Array.from(marks(still).array));
  expect(b.inspect()).toMatchObject({particleCapacity:192,segmentCapacity:768,geometries:2});
  a.dispose();b.dispose();
 });
 it('inherits an installed wind callback when rivals share the parent material',()=>{
  const scene=new THREE.Scene(),player=new TireEffects(scene);
  player.setWind(()=>({x:2,z:0}));
  const rival=new TireEffects(scene,'smoke',player);
  for(let i=1;i<28;i++)rival.update(i/60,65,1,contacts(i*.6),200);
  expect(rival.inspect().particles).toBeGreaterThan(0);
  expect(rival.inspect()).toMatchObject({particleCapacity:48,geometries:2});
  rival.dispose();player.dispose();
 });
});
 
describe('R4d: heterogeneous stationary launch plumes',()=>{
 it('keeps fixed geometry and road marks while staggering rival smoke',()=>{
  const aScene=new THREE.Scene(),bScene=new THREE.Scene();
  const a=new TireEffects(aScene),b=new TireEffects(bScene);
  a.setEmitterSeed(1);b.setEmitterSeed(4);
  for(let i=1;i<=48;i++){
   const c=contacts(0);
   a.update(i/60,0,0,c,200,.5);
   b.update(i/60,0,0,c,200,.5);
  }
  const ca=a.inspect(),cb=b.inspect();
  expect(ca.particles).toBeGreaterThan(6);
  expect(ca.particles).toBeLessThan(60);
  expect(cb.particles).toBeGreaterThan(6);
  expect(cb.particles).toBeLessThan(60);
  expect(ca.particles).not.toBe(cb.particles);
  expect(ca.segments).toBe(0);expect(cb.segments).toBe(0);
  const centers=(scene:THREE.Scene)=>((scene.getObjectByName('tire-smoke') as THREE.Mesh).geometry.getAttribute('center'));
  expect(centers(aScene).getX(4)).not.toBe(centers(bScene).getX(4));
  expect(ca.geometries).toBe(2);
  a.dispose();b.dispose();
 });
});

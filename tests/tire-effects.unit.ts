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
 it('lays two continuous rival trails through a bend and fades them without bridging lost contact',()=>{
  const scene=new THREE.Scene(),parent=new TireEffects(scene),rival=new TireEffects(scene,'smoke',parent);
  const geometry=(scene.children.filter(o=>o.name==='tire-smoke')[1] as THREE.Mesh).geometry;
  const span=geometry.getAttribute('trailSpan'),alpha=geometry.getAttribute('alpha');
  const wheels=(z:number)=>contacts(z).slice(0,2).map(c=>({...c,surface:[c.surface![0]+z*z*.001,0,z]}));
  try{
   for(let i=0;i<=60;i++)rival.update(i/60,65,1,wheels(i*1.5),1,0,1);
   const [left,right,frontLeft,frontRight]=rival.inspect().emittedByWheel;
   expect(left).toBeGreaterThanOrEqual(18);expect(right).toBe(left);
   expect(frontLeft+frontRight).toBe(0);
   const live=Array.from({length:span.count},(_,i)=>i).filter(i=>alpha.getX(i)>.01);
   expect(live.reduce((distance,i)=>distance+span.getZ(i),0)).toBeGreaterThan(140);
   expect(live.some(i=>span.getX(i)>.5)).toBe(true);
   rival.update(1.02,65,0,[],1);
   rival.update(1.04,65,1,wheels(400),1,0,1);
   for(let i=0;i<span.count;i++)expect(Math.abs(span.getZ(i))).toBeLessThan(8);
   rival.update(2.5,65,0,[],1);
   expect(rival.inspect()).toMatchObject({particles:0,particleCapacity:48,geometries:2});
   expect(rival.inspect().segments).toBeGreaterThan(0);
  }finally{rival.dispose();parent.dispose();}
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

describe('R4e: individual smoke cloud silhouette and emitter identity',()=>{
 it('keeps one shader program, two geometries, but gives rivals distinct tint and silhouette',()=>{
  const one=new THREE.Scene(),two=new THREE.Scene();
  const a=new TireEffects(one),b=new TireEffects(two);
  a.setEmitterSeed(1);b.setEmitterSeed(2);
  const input=contacts(0);
  for(let i=1;i<=70;i++){
   a.update(i/60,0,0,input,200,.7);
   b.update(i/60,0,0,input,200,.7);
  }
  const mesh=(scene:THREE.Scene)=>scene.getObjectByName('tire-smoke') as THREE.Mesh;
  const ma=mesh(one).material as THREE.ShaderMaterial;
  const mb=mesh(two).material as THREE.ShaderMaterial;
  expect(ma.fragmentShader).toBe(mb.fragmentShader);
  expect(ma.fragmentShader).toContain('float core=');
  expect(ma.fragmentShader).toContain('warmCool');
  const tonesA=mesh(one).geometry.getAttribute('tone');
  const tonesB=mesh(two).geometry.getAttribute('tone');
  expect(tonesA.getX(3)).not.toBe(tonesB.getX(3));
  expect(a.inspect().emitterTone).not.toBe(b.inspect().emitterTone);
  expect(a.inspect().particles).toBeGreaterThan(5);
  expect(b.inspect().particles).toBeGreaterThan(5);
  expect(a.inspect()).toMatchObject({geometries:2,particleCapacity:192});
  expect(b.inspect()).toMatchObject({geometries:2,particleCapacity:192});
  a.dispose();b.dispose();
 });
 it('samples one shared wind per emitter/frame while local cloud swirls differ',()=>{
  const a=new THREE.Scene(),b=new THREE.Scene(),one=new TireEffects(a),two=new TireEffects(b);
  let calls=0;
  const common=()=>{calls++;return {x:2.6,z:0};};
  one.setEmitterSeed(1);two.setEmitterSeed(7);
  one.setWind(common);two.setWind(common);
  for(let i=1;i<=40;i++){one.update(i/60,0,0,contacts(0),200,.7);two.update(i/60,0,0,contacts(0),200,.7);}
  expect(calls).toBe(80);
  const centers=(scene:THREE.Scene)=>(scene.getObjectByName('tire-smoke') as THREE.Mesh).geometry.getAttribute('center');
  expect(centers(a).getX(4)).not.toBe(centers(b).getX(4));
  expect(centers(a).getZ(4)).not.toBe(centers(b).getZ(4));
  expect(one.inspect().segments).toBe(0);
  expect(two.inspect().segments).toBe(0);
  one.dispose();two.dispose();
 });
});

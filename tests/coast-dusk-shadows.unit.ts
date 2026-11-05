import {it,expect} from 'vitest';
import * as THREE from 'three';
import {CoastDuskShadows,coastShadowOffset,coastBeachShadowAnchors,coastBarrierShadowAnchors,buildCoastGroundShadows} from '../src/coast-dusk-shadows';
import {COAST_SUN} from '../src/coast-dusk';
import {COAST_BEACHES,coastBarrierStyle} from '../src/coast-layout';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,4,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),
});

it('makes one terrain-following beach/road shadow batch plus a dynamic sunset car shadow',()=>{
 const projection=coastShadowOffset(12);
 expect(projection.x*COAST_SUN.x+projection.z*COAST_SUN.z).toBeLessThan(0);
 const scene=new THREE.Scene();
 const shadow=new CoastDuskShadows(scene,sample,10000,()=>8.75,804);
 try{
  expect(shadow.stats).toMatchObject({drawBatches:2,playerShadows:1,shadowMaps:0});
  expect(shadow.anchorCount).toBeGreaterThan(200);
  expect(shadow.stats.barrierCandidates).toBeGreaterThan(1000);
  expect(shadow.beach.geometry.getAttribute('position').count).toBeGreaterThan(shadow.anchorCount*6);
  const player=new THREE.Vector3(0,4,500);
  shadow.update(player,3.8);
  expect(shadow.player.position.y).toBeCloseTo(3.885);
  const offset=shadow.player.position.clone().sub(player);
  expect(offset.x*COAST_SUN.x+offset.z*COAST_SUN.z).toBeLessThan(0);
  expect(scene.children.filter(m=>m.name.includes('shadow'))).toHaveLength(2);
 }finally{shadow.dispose();}
 expect(scene.children).toHaveLength(0);
});

it('keeps real beach props at elevations below the obsolete -4.05 metre filter',()=>{
 const built=buildCoastGroundShadows(sample,[
  {d:500,x:-21,width:4,length:16,kind:'umbrella'},
  {d:505,x:-22,width:.8,length:5,kind:'visitor'},
 ],10000,()=>8.75);
 try{
  expect(built.accepted).toBe(2);
  const pos=built.geometry.getAttribute('position'),alpha=built.geometry.getAttribute('shadowAlpha');
  expect(Math.min(...Array.from({length:pos.count},(_,i)=>pos.getY(i)))).toBeLessThan(-4.05);
  expect(Math.max(...Array.from({length:alpha.count},(_,i)=>alpha.getX(i)))).toBeGreaterThan(.45);
  expect(built.geometry.getIndex()!.count).toBeGreaterThan(100);
 }finally{built.geometry.dispose();}
});

it('follows the exact coast-resort 12m block/rail cadence and correct authored seed',()=>{
 const markers=coastBarrierShadowAnchors(100,()=>8.75);
 const block=markers.find(x=>x.kind==='concrete');
 const rail=markers.find(x=>x.kind==='rail');
 expect(block).toBeDefined();
 expect(rail).toBeDefined();
 expect(markers.some(m=>m.d===0&&coastBarrierStyle(0)==='opening')).toBe(false);
 const a=coastBeachShadowAnchors(804),b=coastBeachShadowAnchors(805);
 const first=COAST_BEACHES[0];
 const umbrellas=a.filter(x=>x.kind==='umbrella'&&Math.abs(x.d-first.distance)<first.radius);
 expect(umbrellas.length).toBeGreaterThan(1);
 expect(a.find(x=>x.kind==='umbrella')?.d).not.toEqual(b.find(x=>x.kind==='umbrella')?.d);
});

import {it,expect} from 'vitest';
import * as THREE from 'three';
import {CoastDuskShadows,coastShadowOffset,coastShadowLength,coastBeachShadowAnchors,coastBarrierShadowAnchors,buildCoastGroundShadows} from '../src/coast-dusk-shadows';
import {COAST_SUN} from '../src/coast-dusk';
import {COAST_BEACHES,COAST_ROCKS,coastBarrierStyle,coastBarrierStoneAt} from '../src/coast-layout';

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
  expect(shadow.stats.barrierCandidates).toBeGreaterThan(300); // fewer silhouettes after removing almost all sea rails
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

it('grounds visible beach props and lets their shadows follow wet-sand slopes',()=>{
 const built=buildCoastGroundShadows(sample,[
  {d:500,x:-18,width:4,length:16,kind:'umbrella'},
  {d:505,x:-19,width:.8,length:5,kind:'visitor'},
 ],10000,()=>8.75);
 try{
  expect(built.accepted).toBe(2);
  const pos=built.geometry.getAttribute('position'),alpha=built.geometry.getAttribute('shadowAlpha');
  expect(Math.min(...Array.from({length:pos.count},(_,i)=>pos.getY(i)))).toBeLessThan(-4.05);
  expect(Math.max(...Array.from({length:alpha.count},(_,i)=>alpha.getX(i)))).toBeGreaterThan(.45);
  expect(built.geometry.getIndex()!.count).toBeGreaterThan(100);
 }finally{built.geometry.dispose();}
});

it('does not draw ghost silhouettes for beach props omitted by scenery height gates',()=>{
 const built=buildCoastGroundShadows(sample,[
  {d:500,x:-21,width:4,length:16,kind:'umbrella'},
  {d:505,x:-22,width:.8,length:5,kind:'visitor'},
  {d:510,x:-22,width:2.8,length:9,kind:'bench'},
 ],10000,()=>8.75);
 try{
  expect(built.accepted).toBe(0);
  expect(built.geometry.getIndex()!.count).toBe(0);
 }finally{built.geometry.dispose();}
});

it('follows the exact coast-resort 12m block/rail cadence and correct authored seed',()=>{
 const markers=coastBarrierShadowAnchors(1000,()=>8.75);
 const block=markers.find(x=>x.kind==='concrete');
 const natural=markers.find(x=>x.kind==='rock'&&x.x<0);
 expect(block).toBeDefined();
 expect(natural).toBeDefined();
 expect(markers.filter(m=>m.kind==='rail'&&m.x<0)).toHaveLength(0);
 expect(markers.some(m=>m.d===0&&coastBarrierStyle(0)==='opening')).toBe(false);
 const a=coastBeachShadowAnchors(804),b=coastBeachShadowAnchors(805);
 const first=COAST_BEACHES[0];
 const umbrellas=a.filter(x=>x.kind==='umbrella'&&Math.abs(x.d-first.distance)<first.radius);
 expect(umbrellas.length).toBeGreaterThan(1);
 // scenery.ts uses unseeded rand() for beach umbrella positions.
 const rand=(n:number)=>{const v=Math.sin(n*127.1+43.7)*43758.5453;return v-Math.floor(v);};
 const expectedFirstD=first.distance-Math.min(370,first.radius*.7)+rand(first.distance)*15;
 const expectedFirstX=-19-rand(first.distance)*17;
 expect(umbrellas[0].d).toBeCloseTo(expectedFirstD,8);
 expect(umbrellas[0].x).toBeCloseTo(expectedFirstX,8);
 expect(a.find(x=>x.kind==='umbrella')?.d).toEqual(b.find(x=>x.kind==='umbrella')?.d);
 // Market visitors are different: scenery.ts seeds its random() per stage.
 const marketVisitor=(anchors:ReturnType<typeof coastBeachShadowAnchors>)=>anchors.find(x=>x.kind==='visitor'&&x.x>0);
 expect(marketVisitor(a)?.d).not.toEqual(marketVisitor(b)?.d);
});

it('projects real natural-rock silhouettes where the sea-side rail was removed',()=>{
 const markers=coastBarrierShadowAnchors(1000,()=>8.75);
 const rocks=markers.filter(a=>a.kind==='rock'&&a.x<0&&a.d>=440&&a.d<770);
 expect(rocks.length).toBeGreaterThan(4);
 expect(markers.some(a=>a.kind==='rail-beam'&&a.x<0&&a.d<1000)).toBe(false);
 const projected=buildCoastGroundShadows(sample,rocks.slice(0,4),1000,()=>8.75);
 try{
  expect(projected.accepted).toBe(4);
  expect(projected.ranges).toHaveLength(4);
  expect(projected.geometry.getAttribute('shadowAlpha').count).toBeGreaterThan(50);
 }finally{projected.geometry.dispose();}
});

it('scales rock, concrete, rail, umbrella and car shadows by the same sun height',()=>{
 const rock=coastBeachShadowAnchors().find(a=>a.kind==='rock')!;
 const first=COAST_ROCKS[0];
 expect(rock.length).toBeCloseTo(coastShadowLength(first.r*.82));
 expect(rock.length).toBeGreaterThan(coastShadowLength(.72)*4);
 const concrete=coastBarrierShadowAnchors(1000,()=>8.75).find(a=>a.kind==='concrete')!;
 expect(concrete.length).toBeGreaterThanOrEqual(coastShadowLength(.40));
 expect(concrete.length).toBeLessThanOrEqual(coastShadowLength(.47));
 expect(concrete.length).toBeLessThan(coastShadowLength(.72));
 const umbrella=coastBeachShadowAnchors().find(a=>a.kind==='umbrella')!;
 expect(umbrella.length).toBeCloseTo(coastShadowLength(3.5));
 expect(coastShadowLength(1.55)).toBeGreaterThan(concrete.length);
 expect(coastShadowLength(11.5)).toBeLessThanOrEqual(76);
});

it('keeps legacy shadow-anchor positions in exact agreement with stone placement',()=>{
 const anchors=coastBarrierShadowAnchors(2900,()=>8.75);
 const stone=anchors.find(a=>a.kind==='concrete'&&a.d>2450&&a.d<2570&&a.x<0);
 expect(stone).toBeDefined();
 const slot=Math.round(stone!.d/12)*12;
 const authored=coastBarrierStoneAt(slot,-1);
 expect(stone!.d).toBeCloseTo(authored.d,5);
 expect(stone!.length).toBeCloseTo(coastShadowLength(authored.height));
});

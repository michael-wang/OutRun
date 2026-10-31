import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {rockySections,rockEdge,rockWall,RockContact} from '../src/rocky-shoulder';
import {coastalCliffDropAtLateral} from '../src/road-profile';
import {breakdownLayout} from '../src/breakdowns';
import {Traffic} from '../src/traffic';
import {TireEffects} from '../src/tire-effects';
import {EngineSound} from '../src/sound';
import {createState} from '../src/handling';

const flat=(d:number)=>({
 position:new THREE.Vector3(0,30,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
}) as any;
describe('Roadside Polish — credible terrain and physical feedback',()=>{
 it('r7 rock contact matches the actual 5m wall base and enters before the old invisible corridor; r6 untouched',()=>{
  const older=rockySections(1,70000,()=>[0,1,0])[0];
  const r7=rockySections(1,70000,()=>[0,1,0],true)[0];
  expect(r7.start).toBe(older.start);
  expect(rockEdge(r7.start,r7)).toBeCloseTo(3.4,6);
  expect(rockEdge(older.start,older)).toBeCloseTo(6.5,6);
  const wall=rockWall(flat,()=>7,r7,r7.start,r7.end)!;
  for(let d=r7.start;d<=r7.end;d+=5){
   const x=7+rockEdge(d,r7),z=d;
   let found=false;
   for(let k=0;k<wall.positions.length;k+=3){
    if(Math.abs(wall.positions[k]-x)<.002&&Math.abs(wall.positions[k+2]-z)<.002){found=true;break;}
   }
   expect(found,`visible rock wall base at ${d}`).toBe(true);
  }
  const contact=new RockContact([r7],()=>7,1.55,2.8);
  const s={...createState(),distance:r7.start+5,lateral:9.25,speed:75};
  const hit=contact.update(s,{distance:r7.start+4,lateral:8},1/60);
  expect(hit).toBeDefined();
  expect(hit!.severity).toBeGreaterThan(0);
  expect(contact.impacts).toBe(1);
  expect(s.speed).toBeLessThan(75);
  expect(s.lateral).toBeLessThan(9.6);
  for(let n=0;n<15;n++)contact.update(s,{distance:s.distance,lateral:s.lateral},1/60);
  expect(contact.impacts).toBe(1);
 });
 it('omits deep left cliff props without removing posts from level shoulders or canyon rock',()=>{
  const shoulders={left:1.6,right:6.8},ordinary={left:6,right:6};
  const cliff=coastalCliffDropAtLateral(30,0,-(7+3.82),7,shoulders,0);
  expect(cliff).toBeGreaterThan(3);
  expect(coastalCliffDropAtLateral(30,0,-(7+3.82),7,ordinary,0)).toBe(0);
  expect(coastalCliffDropAtLateral(30,0,7+3.82,7,shoulders,0)).toBe(0);
  expect(coastalCliffDropAtLateral(30,0,-(7+3.82),7,shoulders,1)).toBeLessThan(3);
 });
 it('varies stranded vehicle types deterministically and animates smoke in one fixed instance pool',()=>{
  const layout=breakdownLayout(flat,()=>7,70000,1);
  expect(layout.length).toBeGreaterThanOrEqual(4);
  expect(layout.slice(0,4).map(x=>x.type)).toEqual([0,1,2,3]);
  expect(layout).toEqual(breakdownLayout(flat,()=>7,70000,1));
  const scene=new THREE.Scene();
  const traffic=new Traffic(scene,flat,()=>7,70000,1,()=>true,[layout[2]]);
  traffic.update(0,layout[2].distance-400);
  const first=traffic.inspect();
  expect(first.actors.find(a=>a.id===layout[2].id)?.stationary).toBe(true);
  expect(first.actors.find(a=>a.id===layout[2].id)?.type).toBe(2);
  expect(first.breakdownSmoke).toBe(4);
  expect(first.smokeCapacity).toBe(48);
  const mesh=scene.getObjectByName('breakdown-engine-smoke') as THREE.InstancedMesh;
  const geometryId=mesh.geometry.uuid;
  traffic.update(.5,layout[2].distance-400);
  expect(mesh.geometry.uuid).toBe(geometryId);
  expect(mesh.count).toBe(4);
  traffic.reset();expect(mesh.count).toBe(0);
  traffic.dispose();expect(scene.children).toHaveLength(0);
 });
 it('white coastal sand emits light puffs, canyon dust stays earthy, shoulder audio rises quickly',()=>{
  const dust=new TireEffects(new THREE.Scene(),'dust');
  dust.setDustTint([1,0,0]);const pale=dust.inspect().tint;
  dust.setDustTint([0,1,0]);const canyon=dust.inspect().tint;
  expect(pale[0]).toBeGreaterThan(.9);
  expect(pale[1]).toBeGreaterThan(.9);
  expect(pale[2]).toBeGreaterThan(.9);
  expect(canyon[1]).toBeLessThan(.6);
  dust.dispose();
  const sound=new EngineSound();
  sound.update(70,0,true);
  sound.surface(70,2,.1);
  expect(sound.inspect().gravelLevel).toBeGreaterThan(.2);
  sound.surface(70,4,.1);
  expect(sound.inspect().gravelLevel).toBeGreaterThan(.4);
  sound.pause();expect(sound.inspect().gravelLevel).toBe(0);
 });
});

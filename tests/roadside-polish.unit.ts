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
 it('retains historic r6 rock geometry/contact without invoking new r7 stone obstacles',()=>{
  const older=rockySections(1,70000,()=>[0,1,0])[0];
  expect(rockEdge(older.start,older)).toBeCloseTo(6.5,6);
  expect(rockWall(flat,()=>7,older,older.start,older.end)).toBeDefined();
  const contact=new RockContact([older],()=>7,1.55,2.8);
  const legacy={...createState(),distance:older.start+5,lateral:14,speed:70};
  expect(contact.update(legacy,{distance:older.start+4,lateral:12},1/60)).toBeDefined();
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
  expect(first.breakdownSmoke).toBe(7);
  expect(first.smokeCapacity).toBe(84);
  const mesh=scene.getObjectByName('breakdown-engine-smoke') as THREE.InstancedMesh;
  const geometryId=mesh.geometry.uuid;
  traffic.update(.5,layout[2].distance-400);
  expect(mesh.geometry.uuid).toBe(geometryId);
  expect(mesh.count).toBe(7);
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

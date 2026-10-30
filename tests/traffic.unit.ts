import {createState} from '../src/handling';
import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {Traffic,trafficLayout,TRAFFIC_LIMIT,TRAFFIC_TYPES} from '../src/traffic';
const sample=(d:number)=>({position:new THREE.Vector3(0,d*.1,d),right:new THREE.Vector3(1,0,0),tangent:new THREE.Vector3(0,.1,1).normalize(),roadHeading:0,curvature:0});
describe('sparse road trip traffic',()=>{
 it('uses a rare deterministic waffle replacement without increasing traffic density',()=>{
  const actors=new Map<number,ReturnType<typeof trafficLayout>[number]>();for(let d=350;d<20000;d+=500)for(const a of trafficLayout(1,0,d,69000))actors.set(a.id,a);
  const all=[...actors.values()],waffles=all.filter(a=>a.type===3);expect(waffles.length).toBeGreaterThan(0);expect(waffles.length).toBeLessThan(all.filter(a=>a.type===0).length/2);expect(all.length).toBeGreaterThan(35);expect(all.length).toBeLessThan(95);
 });
 it('repeats its seed, moves at distinct speeds and keeps the standing start clear',()=>{
  const first=trafficLayout(1,0,350,69000);expect(first).toEqual(trafficLayout(1,0,350,69000));expect(first).not.toEqual(trafficLayout(2,0,350,69000));expect(first.every(a=>a.distance>600)).toBe(true);
  const later=trafficLayout(1,2,350,69000);for(const a of first){const b=later.find(b=>b.id===a.id);if(b)expect(b.distance-a.distance).toBeCloseTo(a.speed*2);}
  expect(new Set(TRAFFIC_TYPES.map(t=>t.speed)).size).toBe(3);
 });
 it('keeps taper and intentional 3.5-second lane changes continuous',()=>{
  const scene=new THREE.Scene(),half=(d:number)=>7-Math.min(3.5,Math.max(0,(d-650)*.01)),traffic=new Traffic(scene,sample,half,69000,1);traffic.update(0,350);let previous=traffic.inspect().actors;
  for(let i=1;i<200;i++){traffic.update(i/10,350+i*4);const current=traffic.inspect().actors;for(const a of current){expect(Math.abs(a.lateral)+TRAFFIC_TYPES[a.type].width/2).toBeLessThan(half(a.distance));const old=previous.find(b=>b.id===a.id);if(old)expect(Math.abs(a.lateral-old.lateral)).toBeLessThan(.21);}previous=current;}traffic.dispose();
 });
 it('follows elevated lanes, obeys streaming readiness, bounds resources and limits contact penalties',()=>{
  const scene=new THREE.Scene();let ready=true;const traffic=new Traffic(scene,sample,()=>7,69000,1,()=>ready);
  traffic.update(0,350);const a=traffic.inspect().actors[0];expect(a.visible).toBe(true);expect(a.y).toBeCloseTo(a.distance*.1+.02);expect(a.grade).toBeCloseTo(.1);expect(Math.abs(a.lateral)+TRAFFIC_TYPES[a.type].width/2).toBeLessThan(7);
  const state={...createState(),distance:a.distance,lateral:a.lateral,speed:70};expect(traffic.hit(0,state,{distance:a.distance-10,lateral:a.lateral},.05)).toBeDefined();expect(traffic.hit(.2,state,state,.05)).toBeUndefined();
  ready=false;traffic.update(3,450);expect(traffic.inspect().actors.every(a=>!a.visible)).toBe(true);expect(scene.children.filter(m=>m.name.startsWith('traffic-')).every(m=>(m as THREE.InstancedMesh).count===0)).toBe(true);
  ready=true;const ids=scene.children.filter(m=>m.name.startsWith('traffic-')).map(m=>(m as THREE.InstancedMesh).geometry.uuid);for(let t=4;t<600;t++)traffic.update(t,350+t*100);expect(traffic.inspect().actors.length).toBeLessThanOrEqual(TRAFFIC_LIMIT);expect(scene.children.filter(m=>m.name.startsWith('traffic-')).map(m=>(m as THREE.InstancedMesh).geometry.uuid)).toEqual(ids);
  traffic.reset();expect(traffic.inspect().actors).toHaveLength(0);expect(traffic.inspect().impacts).toBe(0);traffic.dispose();expect(scene.children).toHaveLength(0);
 });
});

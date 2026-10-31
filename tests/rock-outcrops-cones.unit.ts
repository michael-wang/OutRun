import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {rockySections,rockWall} from '../src/rocky-shoulder';
import {boulderLayout,boulderMesh,BoulderContact} from '../src/rock-boulders';
import {RoadCones,rockyWarningCones} from '../src/road-cones';
import {EngineSound} from '../src/sound';
import {createState} from '../src/handling';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
}) as any;

describe('r7 giant OUTSIDE-BEND individual rock outcrops',()=>{
 it('chooses the actual centrifugal outside of signed curves',()=>{
  const weights=()=>[0,1,0];
  const left=rockySections(1,70000,weights,true,()=>.003);
  const right=rockySections(1,70000,weights,true,()=>-.003);
  expect(left.length).toBeGreaterThan(0);
  expect(left.every(r=>r.side===-1)).toBe(true);
  expect(right.every(r=>r.side===1)).toBe(true);
 });
 it('builds a few tall, separated rocks rather than a continuous retaining wall',()=>{
  const rocks=rockySections(1,70000,()=>[0,1,0],true);
  const boulders=boulderLayout(rocks,()=>7);
  const first=boulders.filter(b=>b.distance>=rocks[0].start&&b.distance<=rocks[0].end);
  expect(first.length).toBeGreaterThanOrEqual(3);
  expect(first.length).toBeLessThanOrEqual(5);
  expect(Math.max(...first.map(b=>b.height))).toBeGreaterThan(17);
  expect(first.some((b,i)=>i>0&&b.distance-b.radiusD>first[i-1].distance+first[i-1].radiusD+10)).toBe(true);
  const mesh=boulderMesh(sample,boulders,rocks[0].start,rocks[0].end)!;
  expect(mesh.positions.length).toBeGreaterThan(200);
  // Historical r6 continuous stone wall is still independently supported.
  const legacy=rockySections(1,70000,()=>[0,1,0])[0];
  expect(rockWall(sample,()=>7,legacy,legacy.start,legacy.end)).toBeDefined();
 });
 it('reflections differ when striking different sides of one boulder',()=>{
  const boulders=boulderLayout(rockySections(1,70000,()=>[0,1,0],true),()=>7);
  const b=boulders[0];
  const hit=(offset:number)=>{
   const contact=new BoulderContact(boulders,1.3,2.8),s={...createState(),distance:b.distance,lateral:b.lateral+offset,speed:70};
   const event=contact.update(s,{distance:b.distance-b.radiusD-12,lateral:s.lateral},1/60);
   return {event,contact,s};
  };
  const center=hit(0),offset=hit(-b.radiusX*.53);
  expect(center.event?.boulderId).toBe(b.id);
  expect(offset.event?.boulderId).toBe(b.id);
  expect(center.event?.normal).not.toEqual(offset.event?.normal);
  expect(center.contact.yaw).not.toBeCloseTo(offset.contact.yaw,2);
  expect(center.s.speed).toBeLessThan(70);
 });
});

describe('cone warnings and physical tumble',()=>{
 it('warns before outer-side giant stones without blocking inner racing lanes',()=>{
  const rock=rockySections(1,70000,()=>[0,1,0],true,()=>.003)[0];
  const recipe=rockyWarningCones([rock],()=>7);
  expect(recipe).toHaveLength(4);
  expect(recipe.every(c=>c.rockWarning&&c.distance<rock.start&&c.side===-1)).toBe(true);
  expect(recipe[0].distance).toBe(rock.start-260);
  expect(recipe.every(c=>Math.abs(c.lateral!)>=6.3&&Math.abs(c.lateral!)<7)).toBe(true);
 });
 it('struck cones fly forward and tumble, make one clatter, never respawn, reuse meshes',()=>{
  const scene=new THREE.Scene(),r=rockySections(1,70000,()=>[0,1,0],true,()=>.003)[0];
  const cones=new RoadCones(sample,()=>7,scene,1,70000,()=>true,undefined,[r]);
  const warning=cones.recipe.find(c=>c.rockWarning)!;
  const hit=cones.update(1,warning.distance+5,warning.lateral!,72,
    {distance:warning.distance-5,lateral:warning.lateral!});
  expect(hit).toBeGreaterThan(0);
  const flight=cones.inspect().trajectories.find(x=>x.id===warning.id)!;
  expect(flight.forward).toBeGreaterThan(40);
  expect(Math.abs(flight.sideways)).toBeGreaterThan(4);
  expect(Math.abs(flight.spin)).toBeGreaterThan(8);
  const mesh=scene.getObjectByName('road-cones') as THREE.InstancedMesh;
  const originalId=mesh.geometry.uuid;
  const getZ=()=>{
   const i=cones.inspect().shown.indexOf(warning.id);
   expect(i).toBeGreaterThanOrEqual(0);
   const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);return m.elements[14];
  };
  const origin=getZ();
  expect(cones.update(1.30,warning.distance+5,warning.lateral!,72)).toBe(0);
  expect(getZ()).toBeGreaterThan(origin+5);
  expect(mesh.geometry.uuid).toBe(originalId);
  cones.update(4.5,warning.distance+5,warning.lateral!,72);
  expect(cones.inspect().hit).toContain(warning.id);
  expect(cones.inspect().shown).not.toContain(warning.id);
  const sound=new EngineSound();sound.coneHit(72);
  expect(sound.inspect().coneHitCount).toBe(1);
  expect(sound.inspect().lastImpact).toBe('cone');
  cones.reset();expect(cones.inspect().hit).toEqual([]);
  cones.dispose();expect(scene.children).toHaveLength(0);
 });
});

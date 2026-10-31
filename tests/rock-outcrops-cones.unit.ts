import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {rockySections,rockNode,rockEdge,rockWall,RockContact} from '../src/rocky-shoulder';
import {RoadCones,rockyWarningCones} from '../src/road-cones';
import {EngineSound} from '../src/sound';
import {createState} from '../src/handling';

const sample=(d:number)=>({
 position:new THREE.Vector3(0,0,d),right:new THREE.Vector3(1,0,0),
 tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
}) as any;

describe('r7 giant outer-bend rock outcrops',()=>{
 it('places stones on the side centrifugal force would carry the driver toward',()=>{
  const weights=()=>[0,1,0];
  const left=rockySections(1,70000,weights,true,()=>.003);
  const right=rockySections(1,70000,weights,true,()=>-.003);
  expect(left.length).toBeGreaterThan(0);
  expect(left.every(r=>r.side===-1)).toBe(true);
  expect(right.every(r=>r.side===1)).toBe(true);
  expect(rockySections(1,70000,weights)).toEqual(rockySections(1,70000,weights)); // legacy remains deterministic
 });
 it('r7 rock mountains have huge varied silhouettes, not uniform low retaining walls',()=>{
  const rocks=rockySections(1,70000,()=>[0,1,0],true),rock=rocks[0];
  const nodes=Array.from({length:Math.ceil((rock.end-rock.start)/5)+1},(_,i)=>{
   const distance=Math.min(rock.end,rock.start+5*i);
   return {distance,...rockNode(distance,rock),edge:rockEdge(distance,rock)};
  });
  const heights=nodes.map(n=>n.height);
  expect(Math.max(...heights)).toBeGreaterThan(18);
  expect(Math.min(...heights.slice(17,-17))).toBeLessThan(7);
  expect(Math.max(...heights)-Math.min(...heights)).toBeGreaterThan(16);
  const mesh=rockWall(sample,()=>7,rock,rock.start,rock.end)!;
  expect(Math.max(...Array.from(mesh.positions).filter((_,i)=>i%3===1))).toBeGreaterThan(15);
  // R6 uses the unaltered historic low wall profile.
  const legacy=rockySections(1,70000,()=>[0,1,0])[0];
  expect(rockNode((legacy.start+legacy.end)/2,legacy).height).toBeLessThan(8);
 });
 it('impact has a geometry-derived normal and two faces reflect differently',()=>{
  const rock=rockySections(1,70000,()=>[0,1,0],true)[0];
  const nodes=[];
  for(let d=rock.start+90;d<rock.end-90;d+=5){
   const slope=(rockEdge(d+5,rock)-rockEdge(d-5,rock))/10;
   nodes.push({d,slope});
  }
  const max=nodes.reduce((a,b)=>a.slope>b.slope?a:b);
  const min=nodes.reduce((a,b)=>a.slope<b.slope?a:b);
  const hit=(d:number)=>{
   const wall=new RockContact([rock],()=>7,1.3,2.8);
   const s={...createState(),distance:d,lateral:rock.side*(7+2.4),speed:70};
   const event=wall.update(s,{distance:d-1,lateral:rock.side*(7+1.3)},1/60);
   return {event,yaw:wall.yaw,lateralRate:s.lateralRate,loss:70-s.speed};
  };
  const a=hit(max.d),b=hit(min.d);
  expect(a.event).toBeDefined();expect(b.event).toBeDefined();
  expect(a.event!.normalSlope).not.toBeCloseTo(b.event!.normalSlope,2);
  expect(Math.abs(a.yaw-b.yaw)).toBeGreaterThan(.01);
  expect(a.loss).toBeGreaterThan(1);
  expect(b.loss).toBeGreaterThan(1);
  expect(a.lateralRate*rock.side).toBeLessThan(0);
  expect(b.lateralRate*rock.side).toBeLessThan(0);
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

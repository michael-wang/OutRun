import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {DESIGNER_CANYON_STAGE as stage} from '../src/designer-canyon';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {prepareRoadChunk} from '../src/road-chunk';
import {blenderRoadVisuals} from '../src/blender-road-visuals';
import {insideBlenderFootprint} from '../src/blender-art-coverage';
import {bridgeShoulders} from '../src/bridge';

describe('Blender v2 opt-in visual replacement',()=>{
 const track=createPilotTrack(stage);
 const build=(paint=false)=>prepareRoadChunk(track.sample,d=>pilotSample(stage,d).halfWidth,
  d=>pilotWeights(stage,d),1000,2000,track.length,false,true,[],
  d=>bridgeShoulders(d,stage.seed),undefined,true,undefined,stage.scenerySections,stage.canyonPrototype,paint);
 it('preserves exact asphalt, rail and contact triangles while replacing four-lane paint',()=>{
  const original=build(),painted=build(true),art=blenderRoadVisuals(painted,1000,2000);
  for(const kind of ['asphalt','rail'] as const){
   const before=original.find(m=>m.kind===kind)!,after=art.find(m=>m.kind===kind)!;
   expect(after).toEqual(before);
  }
  expect(art.find(m=>m.kind==='sand'&&m.artContactOnly)).toEqual({...original.find(m=>m.kind==='sand'),artContactOnly:true});
  expect(painted.some(m=>m.kind==='edge-red'||m.kind==='edge-white')).toBe(false);
  expect(painted.find(m=>m.kind==='center-line')?.indices.length).toBeGreaterThan(0);
  expect(painted.find(m=>m.kind==='line')!.indices.length).toBeLessThan(original.find(m=>m.kind==='line')!.indices.length);
 });
 it('removes legacy far ground inside the authored footprint and retains outside triangles',()=>{
  const art=blenderRoadVisuals(build(true),1000,2000);
  for(const m of art.filter(m=>['grass','water','surf'].includes(m.kind))){
   for(let i=0;i<m.indices.length;i+=3){
    const ids=Array.from(m.indices.slice(i,i+3)),x=ids.reduce((n,id)=>n+m.positions[id*3],0)/3,z=ids.reduce((n,id)=>n+m.positions[id*3+2],0)/3;
    expect(insideBlenderFootprint(x,z)).toBe(false);
   }
  }
  expect(art.some(m=>m.kind==='sand'&&m.artVisualOnly&&m.indices.length)).toBe(true);
 });
 it('keeps an invisible original shoulder raycastable for existing wheel contacts',()=>{
  const data=blenderRoadVisuals(build(true),1000,2000).find(m=>m.artContactOnly)!;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geometry.setIndex(new THREE.BufferAttribute(data.indices,1));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.visible=false;
  const p=track.sample(1470),point=p.position.clone().addScaledVector(p.right,9);
  const hit=new THREE.Raycaster(point.clone().add(new THREE.Vector3(0,2,0)),new THREE.Vector3(0,-1,0),0,5).intersectObject(mesh)[0];
  mesh.visible=true;
  const originalHit=new THREE.Raycaster(point.clone().add(new THREE.Vector3(0,2,0)),new THREE.Vector3(0,-1,0),0,5).intersectObject(mesh)[0];
  expect(hit).toBeDefined();expect(hit.point.toArray()).toEqual(originalHit.point.toArray());
  geometry.dispose();(mesh.material as THREE.Material).dispose();
 });
});

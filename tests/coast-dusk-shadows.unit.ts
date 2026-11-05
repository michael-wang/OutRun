import {it,expect} from 'vitest';
import * as THREE from 'three';
import {CoastDuskShadows,coastShadowOffset,coastBeachShadowAnchors} from '../src/coast-dusk-shadows';
import {COAST_SUN} from '../src/coast-dusk';

it('casts player and beach footprints away from the visible sunset sun with two draw batches',()=>{
 const projection=coastShadowOffset(12);
 expect(projection.x*COAST_SUN.x+projection.z*COAST_SUN.z).toBeLessThan(0);
 const scene=new THREE.Scene();
 const sample=(d:number)=>({position:new THREE.Vector3(0,4,d),right:new THREE.Vector3(1,0,0)});
 const shadow=new CoastDuskShadows(scene,sample);
 try{
  expect(shadow.stats).toMatchObject({drawBatches:2,playerShadows:1,shadowMaps:0});
  expect(shadow.anchorCount).toBeGreaterThan(40);
  expect(shadow.beach.count).toBe(shadow.anchorCount);
  expect(coastBeachShadowAnchors().length).toBeGreaterThanOrEqual(shadow.anchorCount);
  const player=new THREE.Vector3(0,4,500);
  shadow.update(player,3.8);
  expect(shadow.player.position.y).toBeCloseTo(3.87);
  const offset=shadow.player.position.clone().sub(player);
  expect(offset.x*COAST_SUN.x+offset.z*COAST_SUN.z).toBeLessThan(0);
  expect(scene.children.filter(m=>m.name.includes('shadow'))).toHaveLength(2);
 }finally{shadow.dispose();}
 expect(scene.children).toHaveLength(0);
});

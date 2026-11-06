import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {addJourneyScenery} from '../src/scenery';
import {FARM_PLOTS,FARM_HOMES} from '../src/coast-farm-layout';
import {COAST_RURAL_HOUSES,COAST_RURAL_SHOWCASE,RURAL_CREEK,coastRuralCreekCut,ruralShowcaseReplacesFarmHome} from '../src/coast-rural-layout';
import {buildCoastRuralHouse,buildCoastRuralCreek} from '../src/coast-rural-vignette';

const track=createPilotTrack(COAST_ULTRA_STAGE);

it('authors a compact, crop-safe farming hamlet with a reproducible QA approach',()=>{
 expect(COAST_RURAL_SHOWCASE.approachAt).toBe(850);
 expect(new Set(COAST_RURAL_HOUSES.map(x=>x.kind))).toEqual(new Set(['farmhouse','townhouse','courtyard']));
 expect(COAST_RURAL_HOUSES).toHaveLength(4);
 for(const house of COAST_RURAL_HOUSES){
  expect(house.d).toBeGreaterThan(1000);
  expect(house.d).toBeLessThan(1100);
  expect(house.x).toBeGreaterThan(38);
  expect(house.x).toBeLessThan(150);
  const margin=house.kind==='courtyard'?18:11;
  expect(FARM_PLOTS.some(plot=>
   house.d+margin>plot.start&&house.d-margin<plot.end
   &&house.x+margin>plot.left&&house.x-margin<plot.right)).toBe(false);
 }
 expect(FARM_HOMES.filter(site=>ruralShowcaseReplacesFarmHome(site.d))).toHaveLength(2);
});
it('batches complete recognizable houses as compact indexed color meshes',()=>{
 for(const kind of ['farmhouse','townhouse','courtyard'] as const){
  const g=buildCoastRuralHouse(kind);
  expect(g.getAttribute('position').count).toBeGreaterThan(180);
  expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
  expect(g.getAttribute('normal').count).toBe(g.getAttribute('position').count);
  expect(g.index!.count).toBeLessThan(10000);
  expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(true);
  expect(g.boundingSphere!.radius).toBeLessThan(30);
  g.dispose();
 }
});
it('sculpts the creek into grass, keeps rice growing and aligns visible water',()=>{
 const frame=track.sample(1055);
 const before=coastBeachHeight(24,frame.position.y,frame.right.y,980);
 const inside=coastBeachHeight(24,frame.position.y,frame.right.y,1055);
 expect(coastRuralCreekCut(24,1055)).toBeGreaterThan(.60);
 expect(coastRuralCreekCut(40,1055)).toBe(0);
 expect(coastRuralCreekCut(24,950)).toBe(0);
 // Same route frame at both distances so any difference is exactly the cut.
 expect(inside).toBeCloseTo(before-coastRuralCreekCut(24,1055),4);
 const g=buildCoastRuralCreek(track.sample);
 expect(g.getAttribute('position').count).toBeGreaterThan(200);
 expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
 expect(g.index!.count).toBeLessThan(2500);
 expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(true);
 g.dispose();
});
it('survives actual coast scenery worker-style batching without old homes overlapping',()=>{
 const scene=new THREE.Scene(),stage=COAST_ULTRA_STAGE;
 const result=addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,
  d=>pilotSample(stage,d).halfWidth,d=>pilotWeights(stage,d),
  {start:1000,end:1100,openRoad:true,coastUltra:true,
   shoulders:d=>shoulderProfile(d,804),scenerySections:stage.scenerySections});
 const meshes:THREE.InstancedMesh[]=[];
 scene.traverse(node=>{if(node instanceof THREE.InstancedMesh)meshes.push(node);});
 for(const name of ['coast-rural-farmhouse','coast-rural-townhouse','coast-rural-courtyard','coast-rural-irrigation-canal']){
  expect(meshes.some(mesh=>mesh.geometry.name===name),name).toBe(true);
 }
 expect(result.instances).toBeGreaterThan(30);
 // One material/geometry template per full prefab; don't emit a separate
 // mesh for every roof tile, window, wall or little riverside stone.
 expect(meshes.filter(mesh=>mesh.geometry.name.startsWith('coast-rural-'))).toHaveLength(4);
 const materials=new Set<THREE.Material>();
 for(const m of meshes){m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])materials.add(mat);}
 for(const m of materials)m.dispose();
});

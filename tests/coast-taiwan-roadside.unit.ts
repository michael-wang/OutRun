import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';
import {addJourneyScenery} from '../src/scenery';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {coastDrainAt,coastDrainDepth,coastDrainCovered,COAST_SIDE_DRAINS,COAST_UTILITY_POLES,coastPoleLinks} from '../src/coast-roadside-layout';
import {buildCoastRoadsideDrain,buildCoastUtilityWires} from '../src/coast-roadside-geometry';
import {buildCoastRuralHouse} from '../src/coast-rural-vignette';
import {COAST_RURAL_HOUSES} from '../src/coast-rural-layout';
import {rotatedHouseExtent} from '../src/coast-house-facing';

const track=createPilotTrack(COAST_ULTRA_STAGE),sample=track.sample;
const ground=(d:number,x:number)=>{
 const p=sample(d);
 return coastBeachHeight(x,p.position.y,p.right.y,d);
};

it('sculpts an actual local ditch below both concrete banks without changing asphalt or rice-plot terrain',()=>{
 expect(COAST_SIDE_DRAINS.map(s=>s.kind)).toEqual(['open','covered','mixed']);
 for(const [d,depth] of [[940,.62],[4170,.48],[8870,.62]] as const){
  expect(coastDrainDepth(15.85,d)).toBeCloseTo(depth,5);
  expect(ground(d,15.85)).toBeLessThan((ground(d,14.45)+ground(d,17.65))*.5-.28);
  expect(coastDrainDepth(13,d)).toBe(0); // no asphalt/shoulder alteration
  expect(coastDrainDepth(22,d)).toBe(0); // rice and existing creek unchanged
 }
 expect(coastDrainDepth(15.85,2390)).toBe(0);
 expect(coastDrainDepth(15.85,940)).toBeGreaterThan(coastDrainDepth(15.85,789));
 expect(coastDrainCovered(1051)).toBe(true); // driveway crossing near courtyard
 expect(coastDrainCovered(940)).toBe(false);
 expect(coastDrainCovered(4170)).toBe(true); // most town gutters are covered
 expect(coastDrainAt(2100)).toBeUndefined();
});
it('bakes both drain and slit-cover details into one finite indexed vertex-color mesh',()=>{
 for(const [start,end] of [[0,1000],[1000,2000],[4000,5000],[8000,9000]]){
  const g=buildCoastRoadsideDrain(sample,start,end)!;
  expect(g?.name).toBe('coast-taiwan-roadside-ditch');
  expect(g.getAttribute('position').count).toBeGreaterThan(80);
  expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
  expect(g.getAttribute('normal').count).toBe(g.getAttribute('position').count);
  expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(true);
  expect([...g.getAttribute('normal').array].every(Number.isFinite)).toBe(true);
  expect(g.index!.count).toBeLessThan(27000);
  const normals=g.getAttribute('normal');
  expect(Array.from({length:Math.min(normals.count,200)},(_,i)=>normals.getY(i))
   .some(v=>Math.abs(v)>.2)).toBe(true);
  g.dispose();
 }
 expect(buildCoastRoadsideDrain(sample,2100,2200)).toBeNull();
});
it('places an uneven but legible pole rhythm in the verge without blocking the hero courtyard',()=>{
 expect(COAST_UTILITY_POLES.length).toBeGreaterThan(12);
 for(let i=1;i<COAST_UTILITY_POLES.length;i++)expect(COAST_UTILITY_POLES[i].d).toBeGreaterThan(COAST_UTILITY_POLES[i-1].d);
 const opening=COAST_UTILITY_POLES.filter(p=>p.d>=780&&p.d<=1515);
 const intervals=opening.slice(1).map((p,i)=>p.d-opening[i].d);
 expect(Math.max(...intervals)-Math.min(...intervals)).toBeGreaterThan(55);
 expect(opening.every(p=>p.x>17.7&&p.x<20&&p.height>9.5)).toBe(true);
 for(const pole of opening){
  expect(coastDrainDepth(pole.x,pole.d)).toBe(0);
  const hero=COAST_RURAL_HOUSES.find(h=>h.kind==='courtyard')!;
  const bounds=rotatedHouseExtent(11.5,17,hero.yaw);
  expect(pole.x).toBeLessThan(hero.x-bounds.right-7); // roadside, not inside the yard
 }
 const spans=coastPoleLinks(0,1000);
 expect(spans.length).toBeGreaterThan(0);
 expect(coastPoleLinks(1800,3800)).toHaveLength(0); // no wires across the sea-to-town transition
 expect(spans.every(s=>s.start>=0&&s.end<=1000)).toBe(true);
});
it('batches three gently sagging cables into a bounded one-draw chunk source',()=>{
 for(const [start,end] of [[0,1000],[1000,2000],[4000,5000],[8000,9000]]){
  const g=buildCoastUtilityWires(sample,start,end)!;
  expect(g?.name).toBe('coast-taiwan-utility-wires');
  expect(g.index!.count).toBeGreaterThan(30);
  expect(g.index!.count).toBeLessThan(3500);
  expect([...g.getAttribute('position').array].every(Number.isFinite)).toBe(true);
  expect([...g.getAttribute('normal').array].every(Number.isFinite)).toBe(true);
  g.dispose();
 }
 expect(buildCoastUtilityWires(sample,2250,2300)).toBeNull();
});
it('materializes local roadside facilities with existing instancing, never per-grate meshes',()=>{
 const stage=COAST_ULTRA_STAGE;
 for(const [start,end] of [[0,1000],[1000,2000],[4000,5000]]){
  const scene=new THREE.Scene();
  const result=addJourneyScenery(scene,sample,track.length,stage.sceneryAct,stage.seed,
   d=>pilotSample(stage,d).halfWidth,d=>pilotWeights(stage,d),{
    start,end,openRoad:true,coastUltra:true,
    shoulders:d=>shoulderProfile(d,804),scenerySections:stage.scenerySections,
   });
  const meshes:THREE.InstancedMesh[]=[];
  scene.traverse(obj=>{if(obj instanceof THREE.InstancedMesh)meshes.push(obj);});
  for(const name of ['coast-taiwan-roadside-ditch','coast-taiwan-utility-wires']){
   const matching=meshes.filter(mesh=>mesh.geometry.name===name);
   expect(matching.length,`${name} in ${start}`).toBe(1);
   expect(matching[0].count).toBe(1);
  }
  expect(result.instances).toBeGreaterThan(50);
  const geometries=new Set(meshes.map(mesh=>mesh.geometry));
  const materials=new Set(meshes.flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]));
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
 }
});
it('keeps new Taiwan-prefab detailing inside the original tiny mobile geometry budget',()=>{
 for(const type of ['farmhouse','townhouse','courtyard'] as const){
  const g=buildCoastRuralHouse(type);
  expect(g.getAttribute('position').count).toBeGreaterThan(280);
  expect(g.index!.count).toBeLessThan(10000);
  expect(g.boundingSphere!.radius).toBeLessThan(30);
  g.dispose();
 }
});

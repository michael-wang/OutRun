import {it,expect} from 'vitest';
import * as THREE from 'three';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack,pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';
import {addJourneyScenery} from '../src/scenery';
import {coastBeachHeight} from '../src/scenery-cross-section';
import {coastDrainAt,coastDrainDepth,coastDrainCovered,coastDrainBridgeAt,COAST_DRAIN_BRIDGES,COAST_DRAIN_X,COAST_SIDE_DRAINS,COAST_UTILITY_POLES,coastPoleLinks} from '../src/coast-roadside-layout';
import {buildCoastRoadsideDrain,buildCoastRoadsideWater,buildCoastUtilityWires} from '../src/coast-roadside-geometry';
import {buildCoastRuralHouse} from '../src/coast-rural-vignette';
import {COAST_RURAL_HOUSES} from '../src/coast-rural-layout';
import {rotatedHouseExtent} from '../src/coast-house-facing';
import {COAST_TOWN_SIDE_STREETS} from '../src/coast-town-access';
import {buildCoastTownStreets} from '../src/coast-town-streets';

const track=createPilotTrack(COAST_ULTRA_STAGE),sample=track.sample;
const ground=(d:number,x:number)=>{
 const p=sample(d);
 return coastBeachHeight(x,p.position.y,p.right.y,d);
};

it('sculpts an actual local ditch below both concrete banks without changing asphalt or rice-plot terrain',()=>{
 expect(COAST_SIDE_DRAINS.map(s=>s.kind)).toEqual(['open','mixed','covered','open','covered','mixed','covered','mixed','covered']);
 for(const [d,depth] of [[940,1.12],[4170,.88],[8870,1.12]] as const){
  expect(coastDrainDepth(11.1,d)).toBeCloseTo(depth,5);
  expect(ground(d,11.1)).toBeLessThan((ground(d,10.12)+ground(d,14.75))*.5-.65);
  expect(coastDrainDepth(8.75,d)).toBe(0); // five actual driving lanes untouched
  expect(coastDrainDepth(14.75,d)).toBe(0); // grass begins outside trench
  expect(coastDrainDepth(22,d)).toBe(0); // rice and existing creek unchanged
 }
 expect(coastDrainDepth(11.1,2390)).toBeGreaterThan(1);
 expect(coastDrainDepth(11.1,940)).toBeGreaterThan(coastDrainDepth(11.1,67));
 expect(coastDrainCovered(1051)).toBe(true); // driveway crossing near courtyard
 expect(coastDrainCovered(940)).toBe(false);
 expect(coastDrainCovered(4170)).toBe(true); // most town gutters are covered
 expect(coastDrainAt(2100)?.kind).toBe('mixed');
 expect(coastDrainAt(20)).toBeUndefined();
 expect(coastDrainAt(9950)).toBeDefined();
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
 expect(buildCoastRoadsideDrain(sample,2100,2200)).not.toBeNull();
 expect(buildCoastRoadsideDrain(sample,0,40)).toBeNull();
});
it('places an uneven but legible pole rhythm in the verge without blocking the hero courtyard',()=>{
 expect(COAST_UTILITY_POLES.length).toBeGreaterThan(12);
 for(let i=1;i<COAST_UTILITY_POLES.length;i++)expect(COAST_UTILITY_POLES[i].d).toBeGreaterThan(COAST_UTILITY_POLES[i-1].d);
 const opening=COAST_UTILITY_POLES.filter(p=>p.d>=780&&p.d<=1515);
 const intervals=opening.slice(1).map((p,i)=>p.d-opening[i].d);
 expect(Math.max(...intervals)-Math.min(...intervals)).toBeGreaterThan(55);
 expect(opening.every(p=>p.x>COAST_DRAIN_X.rightLip+.35&&p.x<COAST_DRAIN_X.rightLip+.8&&p.height>9.5&&p.lamp)).toBe(true);
 for(const pole of opening){
  expect(coastDrainDepth(pole.x,pole.d)).toBe(0);
  const hero=COAST_RURAL_HOUSES.find(h=>h.kind==='courtyard')!;
  const bounds=rotatedHouseExtent(11.5,17,hero.yaw);
  expect(pole.x).toBeLessThan(hero.x-bounds.right-7); // roadside, not inside the yard
 }
 const spans=coastPoleLinks(0,1000);
 expect(spans.length).toBeGreaterThan(0);
 expect(coastPoleLinks(1800,3800).length).toBeGreaterThan(10); // continuous country power lines
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
 expect(buildCoastUtilityWires(sample,2250,2300)).not.toBeNull();
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

it('adds short concrete access bridges where farms need to cross an open watercourse',()=>{
 expect(COAST_DRAIN_BRIDGES.length).toBeGreaterThan(20);
 for(const [d,kind] of [[115,'open'],[1052,'open'],[4665,'open'],[7160,'mixed'],[8880,'mixed']] as const){
  expect(coastDrainAt(d)?.kind).toBe(kind);
  const bridge=coastDrainBridgeAt(d);
  expect(bridge).toBeDefined();
  expect(bridge!.width).toBeGreaterThanOrEqual(6);
  expect(bridge!.width).toBeLessThanOrEqual(8);
  expect(coastDrainCovered(d)).toBe(true);
  expect(coastDrainCovered(d+bridge!.width*.5+1)).toBe(false);
 }
 // Water MUST remain under access bridges and disappear under town lids.
 const water=buildCoastRoadsideWater(sample,1000,1100)!;
 const uv=water.getAttribute('uv');
 expect(Array.from({length:uv.count},(_,i)=>uv.getY(i)).some(d=>d>=1048&&d<=1056)).toBe(true);
 expect(buildCoastRoadsideWater(sample,3960,4010)).toBeNull();
 water.dispose();
});

it('town side roads cross the covered gutter flush and utility poles avoid their mouths',()=>{
 expect(COAST_TOWN_SIDE_STREETS).toHaveLength(9);
 for(const site of COAST_TOWN_SIDE_STREETS){
  expect(coastDrainAt(site.d)?.kind).toBe('covered');
  expect(COAST_UTILITY_POLES.every(p=>Math.abs(p.d-site.d)>site.width*.5+7)).toBe(true);
  const chunk=Math.floor(site.d/1000)*1000;
  const g=buildCoastTownStreets(sample,chunk,chunk+1000)!;
  try{
   const attr=g.getAttribute('position'),centre=sample(site.d);
   const offsets=Array.from({length:attr.count},(_,i)=>{
    const p=new THREE.Vector3().fromBufferAttribute(attr,i);
    return p.sub(centre.position).dot(centre.right);
   });
   expect(offsets.some(x=>x<COAST_DRAIN_X.leftLip-.2)).toBe(true);
   expect(offsets.some(x=>x>COAST_DRAIN_X.rightLip+.2)).toBe(true);
  }finally{g.dispose();}
 }
});

it('seals the outlet under concrete well before the end-screen camera',()=>{
 expect(coastDrainAt(9550)?.kind).toBe('mixed');
 expect(coastDrainAt(9954)?.kind).toBe('covered');
 expect(coastDrainCovered(9954)).toBe(true);
 expect(buildCoastRoadsideWater(sample,9750,10000)).toBeNull();
 const lid=buildCoastRoadsideDrain(sample,9750,10000);
 try{expect(lid).not.toBeNull();expect(lid!.index!.count).toBeGreaterThan(200);}
 finally{lid?.dispose();}
 const oldFlow=buildCoastRoadsideWater(sample,9500,9575);
 try{expect(oldFlow).not.toBeNull();}finally{oldFlow?.dispose();}
});

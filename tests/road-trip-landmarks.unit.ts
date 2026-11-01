import {expect,it} from 'vitest';
import * as THREE from 'three';
import {addJourneyScenery,bridgeApproachAllowsBuilding,CLOCK_COMPANION_COLOR,
 CLOCK_DISTRICT_COMPANIONS,planJourneyLandmarks} from '../src/scenery';
import {generateTrip} from '../src/trip';
import {pilotWeights} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';

it('uses scenery types and biome density, not one arbitrary 4.8km marker',()=>{
 for(const seed of [1,2,7]){
  const trip=generateTrip(seed),sites=planJourneyLandmarks(trip.length,d=>pilotWeights(trip,BRICK_START+d));
  const clocks=sites.filter(s=>s.kind==='clock'),lighthouses=sites.filter(s=>s.kind==='lighthouse');
  const arches=sites.filter(s=>s.kind==='canyon-arch');
  expect(clocks.length).toBeGreaterThanOrEqual(5);
  expect(lighthouses.length).toBeGreaterThanOrEqual(3);
  expect(arches.length).toBeGreaterThanOrEqual(2);
  expect(sites.some(s=>s.distance%4800!==0)).toBe(true);
  for(const site of sites){
   const weights=pilotWeights(trip,BRICK_START+site.distance);
   const biome=weights.indexOf(Math.max(...weights));
   expect(biome).toBe(site.kind==='clock'?2:site.kind==='lighthouse'?0:1);
   expect(Math.max(...weights)).toBeGreaterThanOrEqual(.78);
   expect(site.companions).toBe(site.kind==='clock'?CLOCK_DISTRICT_COMPANIONS:0);
  }
  expect(sites).toEqual(planJourneyLandmarks(trip.length,d=>pilotWeights(trip,BRICK_START+d)));
 }
 const bridge={start:31200,end:32100,water:-10};
 const allCity=()=>[0,0,1];
 const filtered=planJourneyLandmarks(69000,allCity,bridge);
 expect(filtered.every(s=>bridgeApproachAllowsBuilding(s.distance,bridge))).toBe(true);
});

it('each rendered clock has its THREE companion buildings in the SAME chunk',()=>{
 const length=69000,weights=()=>[0,0,1];
 const sites=planJourneyLandmarks(length,weights),site=sites[2];
 const scene=new THREE.Scene(),sample=(d:number)=>({
  position:new THREE.Vector3(0,45,d),right:new THREE.Vector3(1,0,0),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
 });
 const range={start:Math.floor(site.distance/1000)*1000,end:Math.floor(site.distance/1000)*1000+1000,openRoad:true};
 const report=addJourneyScenery(scene,sample as any,length,2,1,()=>7,weights,range);
 const count=(color:string)=>scene.children
  .flatMap(o=>o.children).filter((o):o is THREE.InstancedMesh=>o instanceof THREE.InstancedMesh)
  .filter(o=>(o.material as THREE.MeshStandardMaterial).color.getHexString()===color).reduce((n,o)=>n+o.count,0);
 const local=sites.filter(s=>s.distance>=range.start&&s.distance<range.end&&s.kind==='clock');
 expect(local.length).toBeGreaterThan(0);
 expect(count(CLOCK_COMPANION_COLOR.slice(1))).toBe(local.length*CLOCK_DISTRICT_COMPANIONS);
 expect(count('eee6ce')).toBe(local.length); // one real clock face per tower
 expect(report.instances).toBeGreaterThan(0);
},20000);

it('renders coast lighthouse alone and canyon arch only in their biomes',()=>{
 const length=69000,sample=(d:number)=>({
  position:new THREE.Vector3(0,45,d),right:new THREE.Vector3(1,0,0),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
 });
 const build=(weights:number[],kind:'lighthouse'|'canyon-arch')=>{
  const list=planJourneyLandmarks(length,()=>weights),site=list.find(s=>s.kind===kind)!;
  const start=Math.floor(site.distance/1000)*1000,scene=new THREE.Scene();
  addJourneyScenery(scene,sample as any,length,2,1,()=>7,()=>weights,{start,end:start+1000,openRoad:true});
  const colors:string[]=[];
  scene.traverse(o=>{if(o instanceof THREE.InstancedMesh)colors.push((o.material as THREE.MeshStandardMaterial).color.getHexString());});
  return colors;
 };
 const coast=build([1,0,0],'lighthouse'),canyon=build([0,1,0],'canyon-arch');
 expect(coast).toContain('f5eddc');
 expect(coast).toContain('cd573e');
 expect(coast).not.toContain(CLOCK_COMPANION_COLOR.slice(1));
 expect(canyon).toContain('d1a16f');
 expect(canyon).not.toContain('f5eddc');
},20000);

import {expect,it} from 'vitest';
import * as THREE from 'three';
import {RoadClearance} from '../src/road-clearance';
import {addJourneyScenery,bridgeApproachAllowsBuilding,JOURNEY_LANDMARK_STEP,roadTripLandmarkKind} from '../src/scenery';
import {generateTrip} from '../src/trip';
import {pilotWeights} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';

it('schedules several clock districts and coast lighthouses by actual route biome',()=>{
 for(const seed of [1,2,7]){
  const trip=generateTrip(seed);
  const counts={clock:0,lighthouse:0};
  for(let d=JOURNEY_LANDMARK_STEP;d<trip.length-400;d+=JOURNEY_LANDMARK_STEP){
   const kind=roadTripLandmarkKind(d,trip.length,pilotWeights(trip,BRICK_START+d));
   if(kind)counts[kind]++;
  }
  expect(counts.clock).toBeGreaterThanOrEqual(2);
  expect(counts.lighthouse).toBeGreaterThanOrEqual(2);
 }
 const bridge={start:31200,end:32100,water:-10};
 expect(bridgeApproachAllowsBuilding(bridge.end+700,bridge)).toBe(false);
 expect(roadTripLandmarkKind(bridge.end+700,69000,[0,0,1],bridge)).toBeNull();
 expect(roadTripLandmarkKind(4800,69000,[0,0,1])).toBe('clock');
 expect(roadTripLandmarkKind(4800,69000,[1,0,0])).toBe('lighthouse');
 expect(roadTripLandmarkKind(4800,69000,[0,1,0])).toBeNull();
});

it('builds real landmark instances for both selected biome styles, without external assets',()=>{
 const length=69000;
 const points=Array.from({length:Math.ceil(length/25)+1},(_,i)=>new THREE.Vector3(0,0,i*25));
 const sample=(d:number)=>({
  position:new THREE.Vector3(0,45,d),right:new THREE.Vector3(1,0,0),
  tangent:new THREE.Vector3(0,0,1),roadHeading:0,curvature:0,
 });
 const build=(weights:number[])=>{
  const scene=new THREE.Scene();
  const clearance=new RoadClearance(points,()=>7,true);
  const report=addJourneyScenery(scene,sample as any,length,2,1,()=>7,()=>weights,{
   start:4800,end:5800,openRoad:true,roadSamples:points,clearance,
  });
  const colors:string[]=[];
  scene.traverse(o=>{
   if(o instanceof THREE.InstancedMesh)colors.push((o.material as THREE.MeshStandardMaterial).color.getHexString());
  });
  return {colors,report};
 };
 const first=build([0,0,1]),again=build([0,0,1]),coast=build([1,0,0]);
 expect(first.colors).toContain('eed7ac'); // clock-tower masonry
 expect(first.colors).toContain('eee6ce'); // inset clock face
 expect(first.colors).toEqual(again.colors);
 expect(first.report.instances).toBe(again.report.instances);
 expect(coast.colors).toContain('f5eddc'); // lighthouse tower
 expect(coast.colors).toContain('cd573e'); // lighthouse red band
 expect(coast.report.instances).toBeGreaterThan(0);
},20000);

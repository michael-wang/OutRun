import {it,expect} from 'vitest';
import * as THREE from 'three';
import {createState} from '../src/handling';
import {CoastStoneContact} from '../src/coast-stone-contact';
import {coastBarrierStyle,coastBarrierStoneAt,COAST_LAMPS} from '../src/coast-layout';
import {COAST_DRAIN_X,COAST_SIDE_DRAINS,COAST_UTILITY_POLES,coastDrainAt,coastDrainCovered} from '../src/coast-roadside-layout';
import {buildCoastRoadsideDrain} from '../src/coast-roadside-geometry';
import {COAST_ULTRA_STAGE} from '../src/coast-ultra-stage';
import {createPilotTrack} from '../src/pilot-composer';
import {addJourneyScenery} from '../src/scenery';
import {pilotSample,pilotWeights} from '../src/pilot-composer';
import {shoulderProfile} from '../src/road-profile';

const half=()=>8.75,track=createPilotTrack(COAST_ULTRA_STAGE);

it('uses the same physical concrete-stone slots as the visible right-side resort blocks',()=>{
 const slot=852,stone=coastBarrierStoneAt(slot,1);
 expect(coastBarrierStyle(slot,1)).toBe('block');
 expect(stone.d).toBeGreaterThan(850);
 expect(stone.d).toBeLessThan(854);
 const detector=new CoastStoneContact(half,1.15,2.1);
 const car=createState();car.distance=stone.d+6;car.lateral=8.7;car.speed=83;car.lateralRate=3;
 const hit=detector.update(car,{distance:stone.d-6,lateral:8.7},.12,1);
 expect(hit?.slot).toBe(slot);
 expect(hit?.lateral).toBeCloseTo(9.8,7);
 expect(hit?.distance).toBeCloseTo(stone.d,8);
 expect(car.speed).toBeLessThan(75);
 expect(car.lateral).toBeLessThan(8.7);
 expect(car.lateralRate).toBeLessThanOrEqual(0);
 expect(detector.inspect().impacts).toBe(1);
 const replay=detector.update(car,{distance:stone.d-6,lateral:8.7},.12,1.12);
 expect(replay).toBeUndefined(); // one contact episode, not repeated braking
 expect(detector.inspect().impacts).toBe(1);
 detector.reset();expect(detector.inspect().impacts).toBe(0);
});

it('never hits where a stone does not physically exist, or before that scenery is drawn',()=>{
 const stone=coastBarrierStoneAt(852,1);
 const car=()=>{const s=createState();s.distance=stone.d+6;s.lateral=8.7;s.speed=70;return s;};
 const notReady=new CoastStoneContact(half,1.15,2.1,()=>false);
 expect(notReady.update(car(),{distance:stone.d-6,lateral:8.7},.12,1)).toBeUndefined();
 const ready=new CoastStoneContact(half,1.15,2.1);
 const inLane=car();inLane.lateral=7;
 expect(ready.update(inLane,{distance:stone.d-6,lateral:7},.12,1)).toBeUndefined();
 for(const d of [3990,8550]){
  const safelyOvertaking=car();safelyOvertaking.distance=d+6;
  expect(coastBarrierStyle(d,1)).toBe('none');
  expect(ready.update(safelyOvertaking,{distance:d-6,lateral:8.7},.12,2)).toBeUndefined();
 }
});

it('gives nearly every metre of the inland coast the same drainage corridor, without affecting ocean side',()=>{
 expect(COAST_SIDE_DRAINS[0].start).toBeLessThanOrEqual(65);
 expect(COAST_SIDE_DRAINS.at(-1)!.end).toBeGreaterThanOrEqual(9950);
 for(let i=1;i<COAST_SIDE_DRAINS.length;i++)
  expect(COAST_SIDE_DRAINS[i].start).toBe(COAST_SIDE_DRAINS[i-1].end);
 for(const d of [120,850,2100,3300,3990,4700,5600,6800,7600,8550,9600])
  expect(coastDrainAt(d)).toBeDefined();
 expect(coastDrainAt(20)).toBeUndefined();
 expect(coastDrainAt(9990)).toBeUndefined();
 expect(coastDrainCovered(3990)).toBe(true);
 expect(coastDrainCovered(850)).toBe(false);
});

it('makes open drainage water distinct from the dark floor, safely below the lip, without extra draw calls',()=>{
 const g=buildCoastRoadsideDrain(track.sample,800,900)!;
 const c=new THREE.Color('#4c7770'),attr=g.getAttribute('color'),pos=g.getAttribute('position');
 const vertexIndices=Array.from({length:attr.count},(_,i)=>i).filter(i=>
  Math.abs(attr.getX(i)-c.r)<1e-5&&Math.abs(attr.getY(i)-c.g)<1e-5&&Math.abs(attr.getZ(i)-c.b)<1e-5,
 );
 expect(vertexIndices.length).toBeGreaterThan(60);
 const frame=track.sample(850),roadY=frame.position.y;
 const waterY=pos.getY(vertexIndices[Math.floor(vertexIndices.length/2)]);
 // Actual coast grade only changes slightly along this 100m sample.
 expect(waterY).toBeLessThan(roadY-.6);
 expect(waterY).toBeGreaterThan(roadY-1.7);
 expect(g.index!.count).toBeLessThan(6500);
 expect(COAST_DRAIN_X.leftLip).toBeLessThan(COAST_DRAIN_X.innerLeft);
 expect(COAST_DRAIN_X.innerRight).toBeLessThan(COAST_DRAIN_X.rightLip);
 g.dispose();
});

it('replaces regular standalone lamps with sparse pole-mounted fixtures aimed toward traffic',()=>{
 const lit=COAST_UTILITY_POLES.filter(p=>p.lamp),poles=COAST_UTILITY_POLES;
 expect(COAST_LAMPS).toHaveLength(0);
 expect(poles.length).toBeGreaterThan(58);
 expect(poles.length).toBeLessThan(100);
 expect(lit.length).toBeGreaterThan(12);
 expect(lit.length).toBeLessThan(poles.length*.4);
 const separations=poles.slice(1).map((p,i)=>p.d-poles[i].d);
 expect(Math.min(...separations)).toBeGreaterThan(40);
 expect(Math.max(...separations)-Math.min(...separations)).toBeGreaterThan(50);
 const scene=new THREE.Scene(),stage=COAST_ULTRA_STAGE;
 addJourneyScenery(scene,track.sample,track.length,stage.sceneryAct,stage.seed,
  d=>pilotSample(stage,d).halfWidth,d=>pilotWeights(stage,d),{
   start:0,end:1000,openRoad:true,coastUltra:true,
   shoulders:d=>shoulderProfile(d,804),scenerySections:stage.scenerySections,
  });
 const bulbs:THREE.InstancedMesh[]=[];
 scene.traverse(obj=>{if(obj instanceof THREE.InstancedMesh){
  const material=obj.material as THREE.MeshStandardMaterial;
  if(material.color.getHexString()==='f8dfaa'&&material.emissiveIntensity>.5)bulbs.push(obj);
 }});
 expect(bulbs.length).toBeGreaterThan(0);
 const frame=track.sample(906),origin=frame.position;
 const pole=COAST_UTILITY_POLES.find(p=>p.d===906)!;
 let found=false;
 for(const mesh of bulbs)for(let i=0;i<mesh.count;i++){
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);
  const delta=position.clone().sub(origin);
  if(Math.abs(delta.dot(frame.tangent))>6)continue;
  expect(delta.dot(frame.right)).toBeLessThan(pole.x-2.1);
  found=true;
 }
 expect(found).toBe(true);
 const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>();
 scene.traverse(obj=>{if(obj instanceof THREE.Mesh){
  gs.add(obj.geometry);const m=obj.material as THREE.Material;if(m)ms.add(m);
 }});
 gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());
});

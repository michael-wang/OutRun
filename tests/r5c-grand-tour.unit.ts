import {expect,it} from 'vitest';
import * as THREE from 'three';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {validateCoastDirection,coastHeroNear} from '../src/content/coast-direction';
import {coastBarrierStyle,coastBarrierClearance,coastDriveBounds} from '../src/coast-layout';
import {requiredSteering} from '../src/challenges';
import {COAST_SCENIC_ACTS} from '../src/coast-journey-layout';
import {COAST_SUN} from '../src/coast-dusk';
import {addCoastMountains} from '../src/coast-mountains';
import {COAST_SEA_LEVEL} from '../src/scenery-cross-section';

const {road,direction}=COAST_STAGE;
const rt=coastWorkerRoad(),track=rt.track;
const finish=road.startDistance+road.length;

it('stays within five metres of the sea except for a single short headland',()=>{
 for(let d=road.startDistance;d<=finish;d+=10){
  const clearance=track.sample(d).position.y-COAST_SEA_LEVEL;
  expect(clearance).toBeGreaterThan(0);
  expect(clearance).toBeLessThanOrEqual(d>=10690&&d<=11230?8.1:5);
 }
});

it('keeps the low sun offshore and clear of both ridges throughout the teaching corridor',()=>{
 const scene=new THREE.Scene();
 addCoastMountains(scene,track.sample,track.length);
 scene.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(),sea=new THREE.Vector3();
 let forwardViews=0,samples=0;
 try{
  for(let d=road.startDistance;d<=6760;d+=25){
   const p=track.sample(d);
   sea.copy(p.right).setY(0).normalize().negate();
   expect(sea.dot(COAST_SUN),`inland sun at ${d}m`).toBeGreaterThan(0);
   ray.set(p.position.clone().add(new THREE.Vector3(0,3,0)),COAST_SUN);
   expect(ray.intersectObjects(scene.children),`ridge hides sun at ${d}m`).toHaveLength(0);
   if(p.tangent.dot(COAST_SUN)>Math.cos(43*Math.PI/180))forwardViews++;
   samples++;
  }
  expect(forwardViews/samples).toBeGreaterThan(.8);
 }finally{
  for(const mesh of scene.children as THREE.Mesh<THREE.BufferGeometry,THREE.Material>[]){
   mesh.geometry.dispose();mesh.material.dispose();
  }
 }
});

it('R5c: the sunset sprint reaches its finish beyond all seven teaching windows',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(road.length).toBe(14200);
 expect(finish).toBe(14550);
 expect(track.length).toBe(finish+600);
 expect(road.turns).toHaveLength(24);
 expect(road.turns.slice(0,6).map(t=>[t.start,t.end,t.steer])).toEqual([
  [900,1250,.20],[3100,3420,-.37],[3420,3800,.39],
  [4410,4890,.32],[5100,5380,-.82],[6470,6760,1.02],
 ]);
 expect(track.sample(finish).position.y).toBeCloseTo(track.sample(13870).position.y);
 expect(road.banks).toHaveLength(3);
 for(let d=road.startDistance;d<=finish;d+=127){
  const p=track.sample(d);
  expect(p.position.toArray().every(Number.isFinite)).toBe(true);
  expect(p.tangent.toArray().every(Number.isFinite)).toBe(true);
  expect(p.right.toArray().every(Number.isFinite)).toBe(true);
  expect(Number.isFinite(p.curvature)).toBe(true);
  expect(Math.abs(p.right.y)).toBeLessThan(.38);
  expect(rt.halfAt(d)).toBe(8.75);
 }
});

it('R5c: the map director alternates scenic, pressure and the last sprint',()=>{
 expect(()=>validateCoastDirection(direction,road)).not.toThrow();
 expect(COAST_SCENIC_ACTS).toEqual(direction.chapters);
 expect(direction.chapters.map(ch=>ch.role)).toEqual([
  'onboarding','onboarding','onboarding','vista','pressure','vista',
  'pressure','vista','pressure','finish',
 ]);
 expect(direction.chapters.at(-1)?.end).toBe(road.length);
 expect(direction.heroSlots.map(h=>h.id)).toEqual([
  'bay-entrance','sea-cliff','rice-plateau','sunset-seawall','finish-beacon',
 ]);
 expect(direction.contestGates).toHaveLength(3);
 for(const hero of direction.heroSlots){
  const target=track.sample(hero.distance);
  expect(target.position.toArray().every(Number.isFinite)).toBe(true);
  expect(coastHeroNear(hero.distance)?.id).toBe(hero.id);
  expect(hero.distance-hero.lookAheadM).toBeGreaterThan(6700);
 }
 const bad=structuredClone(direction);bad.chapters.at(-1)!.end-=1;
 expect(()=>validateCoastDirection(bad,road)).toThrow();
 bad.chapters.at(-1)!.end=road.length;bad.heroSlots[2].distance=bad.heroSlots[1].distance-10;
 expect(()=>validateCoastDirection(bad,road)).toThrow();
});

it('R5c: difficult sections genuinely require braking at 280km/h, without rubber-band logic',()=>{
 for(const d of [8620,10850,13710]){
  const steering=requiredSteering(track.sample(d).curvature,280/3.6);
  expect(Math.abs(steering),`risk gate at ${d}`).toBeGreaterThan(1);
 }
 for(let d=13870;d<=finish;d+=20)
  expect(Math.abs(track.sample(d).curvature),`clean sprint at ${d}`).toBeLessThan(1e-6);
});

it('R5c: the full road stays apart from other distant road sections',()=>{
 const points:Array<{d:number;position:THREE.Vector3}>=[];
 for(let d=road.startDistance;d<=finish;d+=55)points.push({d,position:track.sample(d).position});
 for(let i=0;i<points.length;i++){
  const a=points[i];
  for(let j=i+13;j<points.length;j++){
   const b=points[j];
   const space=Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z);
   expect(space,`nonlocal road clearance at ${a.d}/${b.d}`).toBeGreaterThan(75);
  }
 }
});

it('R5c: every ocean-side collision bound is backed by a visible low guardrail',()=>{
 for(let d=road.startDistance;d<=finish;d+=97){
  const style=coastBarrierStyle(d,-1);
  expect(['rail','block']).toContain(style);
  const expected=-rt.halfAt(d)-coastBarrierClearance(d,-1);
  const actual=coastDriveBounds(d,rt.halfAt(d)).left;
  expect(Math.abs(actual-expected)).toBeLessThan(.5);
 }
});

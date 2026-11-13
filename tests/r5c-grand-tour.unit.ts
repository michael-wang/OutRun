import {expect,it} from 'vitest';
import * as THREE from 'three';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {coastWorkerRoad} from '../src/content/coast-worker-road';
import {validateCoastDirection,coastHeroNear} from '../src/content/coast-direction';
import {coastBarrierStyle,coastBarrierClearance,coastDriveBounds} from '../src/coast-layout';
import {requiredSteering} from '../src/challenges';
import {COAST_SCENIC_ACTS} from '../src/coast-journey-layout';

const {road,direction}=COAST_STAGE;
const rt=coastWorkerRoad(),track=rt.track;
const finish=road.startDistance+road.length;

it('R5c: one authored 30km road reaches the real 30.35km finish and preserves tutorial',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(road.length).toBe(30000);
 expect(finish).toBe(30350);
 expect(track.length).toBe(finish+600);
 expect(road.turns).toHaveLength(21);
 expect(road.turns.slice(0,6).map(t=>[t.start,t.end,t.steer])).toEqual([
  [900,1900,-.25],[2700,3520,-.37],[3520,4340,.39],
  [4410,4890,-.32],[5100,5640,.82],[6280,6760,-1.02],
 ]);
 expect(road.elevations.at(-1)?.end).toBe(finish);
 expect(road.banks).toHaveLength(9);
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
  'bay-entrance','sea-cliff','rice-plateau','sunset-bridge','finish-beacon',
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
 for(const d of [13600,21000,28500]){
  const steering=requiredSteering(track.sample(d).curvature,280/3.6);
  expect(Math.abs(steering),`risk gate at ${d}`).toBeGreaterThan(1);
 }
 for(let d=28900;d<=finish;d+=20)
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

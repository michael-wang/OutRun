import {expect,it} from 'vitest';
import {COAST_STAGE,validateCoastStage} from '../src/content/coast-stage';
import {validateAuthoredRoad,sampleAuthoredRoad} from '../src/content/authored-road';
import {createAuthoredCoastTrack} from '../src/content/authored-track';
import {COAST_ONBOARDING,coastLessonAt,validateCoastOnboarding} from '../src/content/coast-onboarding';

const road=COAST_STAGE.road,plan=COAST_STAGE.onboarding;
const identity={id:'ROAD-TRIP-10M',name:'R5a first map',sceneryAct:0};

it('P0 R5a: opening four lessons are safe, ordered and matched to the authored road',()=>{
 expect(()=>validateCoastStage(COAST_STAGE)).not.toThrow();
 expect(()=>validateCoastOnboarding(plan,road)).not.toThrow();
 expect(plan.lessons.map(l=>l.id)).toEqual(['A0','A1','A2','A3']);
 expect(plan.lessons[0].start).toBe(350);
 for(let i=1;i<plan.lessons.length;i++)
  expect(plan.lessons[i].start).toBe(plan.lessons[i-1].end);
 for(const lesson of plan.lessons){
  expect(coastLessonAt((lesson.start+lesson.end)/2)?.id).toBe(lesson.id);
 }
 expect(coastLessonAt(plan.lessons.at(-1)!.end)).toBeUndefined();
 expect(sampleAuthoredRoad(road,750).demand).toBe(0);
 expect(sampleAuthoredRoad(road,850).demand).toBe(0);
 expect(sampleAuthoredRoad(road,road.turns[0].start-10).demand).toBe(0);
 expect(sampleAuthoredRoad(road,road.turns[0].end+10).demand).toBe(0);
 expect(Math.abs(road.turns[0].steer)).toBeLessThan(Math.abs(road.turns[1].steer));
});

it('P0 R5a: banked S has two opposite, finite physical cross slopes in the shared track',()=>{
 expect(road.banks).toHaveLength(3);
 const track=createAuthoredCoastTrack(road,identity);
 const sweeper=track.sample((road.banks![0].start+road.banks![0].end)/2);
 const left=track.sample((road.banks![1].start+road.banks![1].end)/2);
 const right=track.sample((road.banks![2].start+road.banks![2].end)/2);
 expect(sweeper.right.y).toBeGreaterThan(.15);
 expect(left.right.y).toBeGreaterThan(.15);
 expect(right.right.y).toBeLessThan(-.15);
 for(let d=350;d<=4710;d+=13){
  const p=track.sample(d);
  expect(p.position.toArray().every(Number.isFinite)).toBe(true);
  expect(p.right.toArray().every(Number.isFinite)).toBe(true);
  expect(Math.abs(p.right.y)).toBeLessThan(.36);
 }
 for(const bank of road.banks!){
  for(const edge of [bank.start,bank.end]){
   const before=track.sample(edge-.05),after=track.sample(edge+.05);
   expect(Math.abs(before.right.y-after.right.y)).toBeLessThan(.015);
   expect(before.position.distanceTo(after.position)).toBeLessThan(.3);
  }
 }
});

it('P0 R5a: stage authoring rejects impossible teaching or banking configuration',()=>{
 const invalid=(alter:(s:typeof COAST_STAGE)=>void)=>{
  const data=structuredClone(COAST_STAGE);alter(data);
  expect(()=>validateCoastStage(data)).toThrow();
 };
 invalid(s=>{s.onboarding.traffic.firstCivilianDistance=950;});
 invalid(s=>{s.onboarding.traffic.nextWaveDistance=3500;});
 invalid(s=>{s.onboarding.breakdownsAfter=4200;});
 invalid(s=>{s.onboarding.lessons[1].start=s.road.turns[0].start-50;});
 invalid(s=>{const b=s.road.banks![0];b.ramp=(b.end-b.start)/2;});
 invalid(s=>{s.road.banks![0].degrees=30;});
 invalid(s=>{s.road.turns[1].rampFraction=.5;});
 invalid(s=>{s.onboarding.driftLessons[0].start=4800;});
 invalid(s=>{s.onboarding.driftLessons[1].suggestedEntryKmh=260;});
 invalid(s=>{s.onboarding.accident.distance=s.onboarding.accident.start+20;});
 invalid(s=>{s.road.turns[3].steer=0.1;});
 const broken=structuredClone(road);broken.banks![1].start=broken.banks![0].start+1;
 expect(()=>validateAuthoredRoad(broken)).toThrow();
});

it('R5a.1: dramatic beginner sweeper and longer S keep coherent entry/exit transitions',()=>{
 const [sweep,left,right]=road.turns;
 expect(sweep.start).toBe(900);
 expect(sweep.end-sweep.start).toBeGreaterThanOrEqual(900);
 expect(Math.abs(sweep.steer)).toBeGreaterThanOrEqual(.24);
 expect(Math.abs(sweep.steer)).toBeLessThan(.32); // deliberately not drift-required
 expect(left.end-left.start).toBeGreaterThanOrEqual(750);
 expect(right.end-right.start).toBeGreaterThanOrEqual(750);
 expect(Math.abs(left.steer)).toBeGreaterThan(.35);
 expect(Math.abs(right.steer)).toBeGreaterThan(.35);
 expect(left.steer*right.steer).toBeLessThan(0);
 expect(plan.lessons[2].start).toBe(sweep.end);
 expect(plan.lessons[3].end).toBe(right.end);
 const track=createAuthoredCoastTrack(road,identity);
 for(const turn of [sweep,left,right]){
  for(const edge of [turn.start,turn.end]){
   const prev=track.sample(edge-.1),next=track.sample(edge+.1);
   expect(prev.position.distanceTo(next.position)).toBeLessThan(.35);
   expect(Math.abs(prev.right.y-next.right.y)).toBeLessThan(.02);
  }
 }
});

it('R5a.2: the left-to-right S has no neutral straight and retains smooth joins',()=>{
 const [sweep,left,right]=road.turns;
 expect(road.startDistance).toBe(350);
 expect(sweep.start).toBe(900);
 expect(left.end).toBe(right.start);
 expect(left.rampFraction).toBeLessThan(.1);
 expect(right.rampFraction).toBeLessThan(.1);
 expect(sampleAuthoredRoad(road,left.end).demand).toBeCloseTo(0,12);
 expect(sampleAuthoredRoad(road,left.end-50).demand).toBeLessThan(-.2);
 expect(sampleAuthoredRoad(road,right.start+50).demand).toBeGreaterThan(.2);
 const track=createAuthoredCoastTrack(road,identity);
 for(let d=left.end-110;d<=right.start+110;d+=5){
  const p=track.sample(d);
  expect(p.position.toArray().every(Number.isFinite)).toBe(true);
  expect(p.right.toArray().every(Number.isFinite)).toBe(true);
 }
 for(const d of [left.end-1,left.end,left.end+1]){
  const a=track.sample(d-.01),b=track.sample(d+.01);
  expect(a.position.distanceTo(b.position)).toBeLessThan(.04);
  expect(Math.abs(a.right.y-b.right.y)).toBeLessThan(.01);
 }
});

it('R5b: two drift-demanding authored turns have a long safe recovery gap',async()=>{
 const [first,second]=road.turns.slice(4,6);
 const [a5,a6]=plan.driftLessons;
 expect(first.start).toBe(a5.start);
 expect(first.end).toBe(a5.end);
 expect(second.start).toBe(a6.start);
 expect(second.end).toBe(a6.end);
 expect(a5.suggestedEntryKmh).toBeGreaterThan(a6.suggestedEntryKmh);
 expect(Math.abs(second.steer)).toBeGreaterThan(Math.abs(first.steer));
 expect(first.steer*second.steer).toBeLessThan(0);
 expect(second.start-first.end).toBeGreaterThan(500);
 const track=createAuthoredCoastTrack(road,identity);
 const {requiredSteering}=await import('../src/challenges');
 for(const turn of [first,second]){
  const apex=track.sample((turn.start+turn.end)/2);
  // At high cruising speed the steering demand is intentionally above
  // the available authority: lift/brake early instead of blindly full throttle.
  expect(Math.abs(requiredSteering(apex.curvature,280/3.6))).toBeGreaterThan(1);
  expect(Math.abs(apex.right.y)).toBeLessThan(.38);
  for(const edge of [turn.start,turn.end]){
   const before=track.sample(edge-.05),after=track.sample(edge+.05);
   expect(before.position.distanceTo(after.position)).toBeLessThan(.12);
  }
 }
 expect(coastLessonAt((a5.start+a5.end)/2)?.id).toBe('A5');
 expect(coastLessonAt((a6.start+a6.end)/2)?.id).toBe('A6');
});

it('R5b: no nonlocal early-road overlap before the new scenic rebuild',()=>{
 const track=createAuthoredCoastTrack(road,identity),stations=[];
 for(let d=350;d<=7350;d+=50){
  const p=track.sample(d).position;
  stations.push({d,x:p.x,z:p.z});
 }
 for(let i=0;i<stations.length;i++)for(let j=i+11;j<stations.length;j++){
  const a=stations[i],b=stations[j];
  expect(Math.hypot(a.x-b.x,a.z-b.z),`road self-approach at ${a.d}/${b.d}`).toBeGreaterThan(45);
 }
});

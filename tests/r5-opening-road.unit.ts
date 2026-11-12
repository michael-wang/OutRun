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
 expect(sampleAuthoredRoad(road,1200).demand).toBe(0);
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
 invalid(s=>{s.onboarding.lessons[1].start=900;});
 invalid(s=>{const b=s.road.banks![0];b.ramp=(b.end-b.start)/2;});
 invalid(s=>{s.road.banks![0].degrees=30;});
 const broken=structuredClone(road);broken.banks![1].start=broken.banks![0].start+1;
 expect(()=>validateAuthoredRoad(broken)).toThrow();
});

it('R5a.1: dramatic beginner sweeper and longer S keep coherent entry/exit transitions',()=>{
 const [sweep,left,right]=road.turns;
 expect(sweep.start).toBe(1400);
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

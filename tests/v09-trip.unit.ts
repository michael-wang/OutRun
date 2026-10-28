import {describe,it,expect} from 'vitest';
import {generateTrip} from '../src/trip';
import {createPilotTrack,pilotSample} from '../src/pilot-composer';
import {BRICK_START} from '../src/bricks';

describe('long trip recipe',()=>{
 it('generates reproducible and distinct complete multi-phase plans',()=>{
  const plans=Array.from({length:5},(_,i)=>generateTrip(i+1));
  expect(new Set(plans.map(p=>p.contentFingerprint)).size).toBe(5);
  for(const p of plans){expect(generateTrip(p.seed)).toEqual(p);expect(p.length).toBe(69000);expect(p.beats.length).toBeGreaterThan(20);expect(new Set(p.worldPhases.map(x=>x.world)).size).toBe(3);expect(p.placements.filter(x=>x.channel==='curvature').length).toBeGreaterThan(40);}
 });
 it('produces finite sampled road poses through the far end',()=>{
  const p=generateTrip(1),t=createPilotTrack(p);
  for(let s=0;s<=p.length;s+=500){const pose=t.sample(BRICK_START+s),q=pilotSample(p,BRICK_START+s);expect(Number.isFinite(pose.position.x+pose.position.y+pose.position.z+q.lanes)).toBe(true);expect(q.lanes).toBeGreaterThanOrEqual(2);expect(q.lanes).toBeLessThanOrEqual(8);}
 },30000);
});

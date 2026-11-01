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
 it('reduces r7 city elevation while keeping mountain drama and legacy r6 intact',()=>{
  for(const seed of [1,2,7]){
   const trip=generateTrip(seed,7),legacy=generateTrip(seed,6);
   const elevation=trip.placements.filter(p=>p.channel==='elevation');
   const oldElevation=legacy.placements.filter(p=>p.channel==='elevation');
   expect(elevation).toHaveLength(oldElevation.length);
   let city=0,dramaticCanyon=0;
   for(let i=0;i<elevation.length;i++){
    const placement=elevation[i],before=oldElevation[i],beat=trip.beats.find(b=>b.id===placement.beat)!;
    expect(placement.startS).toBe(before.startS);
    expect(placement.endS).toBe(before.endS);
    if(beat.world==='city'){
     city++;
     expect(placement.parameters.amplitude).toBeLessThan(24);
     expect(placement.parameters.amplitude).toBeLessThan(before.parameters.amplitude);
     for(const frac of [.12,.25,.48,.68,.85]){
      const point=pilotSample(trip,BRICK_START+placement.startS+(placement.endS-placement.startS)*frac);
      expect(Math.abs(point.grade)).toBeLessThan(.15);
     }
    }else{
     expect(placement.parameters.amplitude).toBe(before.parameters.amplitude);
     if(beat.world==='canyon'&&beat.verticality==='dramatic'&&placement.parameters.amplitude>=115)dramaticCanyon++;
    }
   }
   expect(city).toBeGreaterThan(0);
   expect(dramaticCanyon).toBeGreaterThan(0);
  }
 });
 it('produces finite sampled road poses through the far end',()=>{
  const p=generateTrip(1),t=createPilotTrack(p);
  for(let s=0;s<=p.length;s+=500){const pose=t.sample(BRICK_START+s),q=pilotSample(p,BRICK_START+s);expect(Number.isFinite(pose.position.x+pose.position.y+pose.position.z+q.lanes)).toBe(true);expect(q.lanes).toBeGreaterThanOrEqual(2);expect(q.lanes).toBeLessThanOrEqual(8);}
 },30000);
});

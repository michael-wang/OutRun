import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createState,step} from '../src/handling';
import {createTrack} from '../src/track';
import {COURSE,REFERENCE_SPEED,requiredSteering,curvatureForDemand,steeringAuthority,curvePressure} from '../src/challenges';
import {scriptedDriver,plannedSpeed} from './driver';
it('inverse demand calibrates every authored core at reference and safe speed',()=>{
 const table=COURSE.filter(c=>c.targetRequiredSteering).map(c=>({id:c.id,target:c.targetRequiredSteering,k:curvatureForDemand(c.targetRequiredSteering),at230:requiredSteering(curvatureForDemand(c.targetRequiredSteering),REFERENCE_SPEED),at190:requiredSteering(curvatureForDemand(c.targetRequiredSteering),190/3.6)}));
 for(const row of table)expect(row.at230).toBeCloseTo(row.target,10);
 expect(table.find(r=>r.id==='extreme')!.at190).toBeLessThan(1);
 mkdirSync('docs/evidence/v0.4.2',{recursive:true});writeFileSync('docs/evidence/v0.4.2/calibration.json',JSON.stringify({course:COURSE,table},null,2));
});
it('normal core matching cancels drift, neutral fails and excess input moves inward',()=>{
 for(const u of [-.25,.5,.75]){
  const k=curvatureForDemand(u),v=REFERENCE_SPEED;
  expect(steeringAuthority(v)*u-curvePressure(k,v)).toBeCloseTo(0,10);
  for(const [input,sign] of [[0,-Math.sign(u)],[u,0],[Math.sign(u),Math.sign(u)]]){
   const s={...createState(),speed:v};for(let i=0;i<240;i++){s.speed=v;step(s,{gas:false,brake:false,steer:input},1/120,k,1.75);}
   if(sign)expect(s.lateral*sign).toBeGreaterThan(3);else expect(Math.abs(s.lateral)).toBeLessThan(.03);
  }
 }
});
it('straight neutral preserves lateral offset after strong correction; visual yaw cannot drive path',()=>{
 const s={...createState(),speed:60,lateral:2,heading:2,velocityHeading:-1,yawRate:100,slipAngle:1};
 for(let i=0;i<360;i++)step(s,{gas:true,brake:false,steer:0},1/120,0,1.75);
 expect(s.lateral).toBe(2);expect(s.lateralRate).toBe(0);expect(s.heading).toBe(0);expect(s.slip).toBe(0);
});
it('full course rewards deliberate notches and planned braking; continuous inverse geometry closes',()=>{
 const track=createTrack(),runs=[];
 for(const careful of [false,true]){
  const s={...createState(),speed:REFERENCE_SPEED},driver=scriptedDriver(),trace=[];let time=0,off=0;
  while(s.distance<track.length&&time<240){const input=careful?driver(s,track.sample(s.distance).curvature,plannedSpeed(s.distance,track.sample)):{gas:true,brake:false,steer:0};for(let j=0;j<12;j++)step(s,input,1/120,track.sample(s.distance).curvature,1.75);time+=.1;off+=Number(s.offRoad);trace.push({...s,time});}
  runs.push({careful,time,off,trace});expect(s.distance).toBeGreaterThanOrEqual(track.length);
 }
 expect(runs[1].off).toBe(0);expect(runs[1].time).toBeGreaterThan(60);expect(runs[1].time).toBeLessThan(95);expect(runs[1].time).toBeLessThan(runs[0].time);
 for(let d=0;d<track.length;d+=5){const a=track.sample(d),b=track.sample(d+.01),delta=b.position.clone().sub(a.position).normalize();expect(delta.dot(a.tangent)).toBeGreaterThan(.99999);expect(Math.abs(a.curvature)).toBeLessThan(.004);}
 expect(track.sample(track.length-.001).position.distanceTo(track.sample(0).position)).toBeLessThan(.002);
 writeFileSync('docs/evidence/v0.4.2/course-unit.json',JSON.stringify(runs,null,2));
});
it('normal stationary start completes a playable lap within the 60–90 second target',()=>{
 const track=createTrack(),s=createState(),driver=scriptedDriver();let seconds=0,off=0;
 while(s.distance<track.length&&seconds<100){const input=driver(s,track.sample(s.distance).curvature,plannedSpeed(s.distance,track.sample));for(let i=0;i<12;i++)step(s,input,1/120,track.sample(s.distance).curvature,1.75);seconds+=.1;off+=Number(s.offRoad);}
 expect(s.distance).toBeGreaterThanOrEqual(track.length);expect(seconds).toBeGreaterThan(60);expect(seconds).toBeLessThan(90);expect(off).toBe(0);
 writeFileSync('docs/evidence/v0.4.2/standing-start.json',JSON.stringify({seconds,off,final:s},null,2));
});

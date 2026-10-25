import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {bodyYawTarget} from '../src/body-pose';
import {createState,step} from '../src/handling';
import {COURSE,PRESSURE_GAIN,REFERENCE_SPEED,curvatureForDemand,requiredSteering} from '../src/challenges';
import {createTrack} from '../src/track';
it('earlier proportional pose stays quiet on straights and reaches a genuine loaded peak',()=>{
 const rows=[0,.1,.25,.5,.75,1].map(u=>({u,beforeDegrees:u<=.25?0:u===.5?17.5:u===.75?35:42,afterDegrees:bodyYawTarget(u,u===1?1.2:u,REFERENCE_SPEED)*180/Math.PI}));
 expect(rows.map(r=>r.afterDegrees)).toEqual([0,expect.any(Number),6,20,40,57]);
 for(const u of [.1,.25,1])expect(bodyYawTarget(u,0,REFERENCE_SPEED)).toBe(0);
 expect(bodyYawTarget(1,.75,REFERENCE_SPEED)*180/Math.PI).toBe(50);
 expect(bodyYawTarget(-1,-1.2,REFERENCE_SPEED)).toBe(-bodyYawTarget(1,1.2,REFERENCE_SPEED));
 mkdirSync('docs/evidence/v0.6',{recursive:true});writeFileSync('docs/evidence/v0.6/pose-before-after.json',JSON.stringify(rows,null,2));
});
it('both substantial sweepers preserve the accepted gain and pass full gas without brakes',()=>{
 expect(PRESSURE_GAIN).toBeCloseTo(.6094527155598083,12);const track=createTrack(),runs=[];
 for(const id of ['medium','high']){const c=COURSE.find(c=>c.id===id)!,angle=Math.abs(curvatureForDemand(c.targetRequiredSteering)*(c.length-c.transitionLength))*180/Math.PI;
  expect(angle).toBeGreaterThan(70);expect(angle).toBeLessThan(110);
  const s={...createState(),distance:c.start-80,speed:REFERENCE_SPEED},rows=[];
  while(s.distance<c.end+40){const k=track.sample(s.distance).curvature,steer=Math.round(requiredSteering(k,s.speed)*4)/4;for(let j=0;j<6;j++)step(s,{gas:true,brake:false,steer},1/120,track.sample(s.distance).curvature,1.75);rows.push({...s});}
  expect(rows.every(s=>!s.offRoad&&s.speed*3.6>=220)).toBe(true);runs.push({id,angle,rows});
 }
 writeFileSync('docs/evidence/v0.6/full-gas-unit.json',JSON.stringify(runs,null,2));
});

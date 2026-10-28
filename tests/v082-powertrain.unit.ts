import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createState,step} from '../src/handling';
it('integrates real shift forces and grade-dependent attainable speeds at 30/60 Hz',()=>{
 const runs=[];
 for(const fps of [30,60])for(const grade of [0,.05,-.05])for(const throttle of [true,false]){
  const s=createState();if(grade||!throttle)s.speed=300/3.6;const rows=[];
  for(let f=0;f<fps*80;f++){for(let rem=1/fps;rem>1e-9;){const dt=Math.min(rem,1/120),before=s.speed;step(s,{gas:throttle,brake:false,steer:0},dt,0,1.75,7,grade);expect(s.speed).toBeCloseTo(Math.max(0,Math.min(100,before+s.netAcceleration*dt)),9);rem-=dt;}rows.push({t:(f+1)/fps,speed:s.speed*3.6,distance:s.distance,rpm:s.rpm,gear:s.gear,force:s.driveForce,drag:s.roadDrag,shiftDrag:s.shiftDrag,traction:s.tractionFactor,acceleration:s.netAcceleration,grade});}
  runs.push({fps,grade,throttle,rows});
  if(throttle&&grade===0){expect(s.speed*3.6).toBeGreaterThan(295);expect(s.speed*3.6).toBeLessThan(305);expect(new Set(rows.map(r=>r.gear)).size).toBe(6);}
  if(throttle&&grade<0)expect(s.speed*3.6).toBeGreaterThan(310);
  if(throttle&&grade>0)expect(s.speed*3.6).toBeLessThan(295);
 }
 mkdirSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2',{recursive:true});writeFileSync('docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/grade-shift-traces.json',JSON.stringify(runs));
});

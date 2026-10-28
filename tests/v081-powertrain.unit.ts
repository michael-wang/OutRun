import {it,expect} from 'vitest';
import {createState,step,MAX_SPEED} from '../src/handling';
import {GEAR_RATIOS} from '../src/powertrain';
import {effectivePace} from '../src/pace';
it('six ratio-driven gears yield progressive acceleration and force-based shift dips at 30/60 fps',()=>{
 const runs=[30,60].map(fps=>{const s=createState(),rows=[];for(let frame=0;frame<fps*80;frame++){for(let left=1/fps;left>1e-9;){const dt=Math.min(left,1/120),before={...s};step(s,{gas:true,brake:false,steer:0},dt,0,1.75);expect(s.speed).toBeCloseTo(Math.min(MAX_SPEED,Math.max(0,before.speed+s.netAcceleration*dt)),10);expect(s.distance-before.distance).toBeCloseTo(s.speed*effectivePace(s.speed,1.75)*dt,10);left-=dt;}rows.push({...s,t:(frame+1)/fps});}return rows;});
 for(const rows of runs){const at=(kmh:number)=>rows.find(r=>r.speed*3.6>=kmh-1e-6)!.t,a=at(100),b=at(200),c=at(300);expect(a).toBeLessThan(b-a);expect(b-a).toBeLessThan(c-b);expect(c).toBeGreaterThan(20);expect(c).toBeLessThan(45);const shifts=[];for(let i=1;i<rows.length;i++)if(rows[i].gear>rows[i-1].gear)shifts.push(rows.slice(i,i+Math.ceil(0.18/(rows[0].t))));expect(shifts).toHaveLength(5);for(const event of shifts){expect(Math.min(...event.map(r=>r.tractionFactor))).toBe(0);expect(Math.min(...event.map(r=>r.netAcceleration))).toBeLessThan(0);expect(event.every(r=>r.gearRatio===GEAR_RATIOS[r.gear-1])).toBe(true);}expect(rows.at(-1)!.speed*3.6).toBeGreaterThan(299);expect(rows.at(-1)!.speed*3.6).toBeLessThan(305);}
 expect(runs[0].at(-1)!.distance).toBeCloseTo(runs[1].at(-1)!.distance,7);
});

import {expect,it} from 'vitest';
import {createState,step} from '../src/handling';
import {EngineSound} from '../src/sound';
import {roadRpm} from '../src/powertrain';
const throttle={gas:true,brake:false,steer:0};
it('six genuine gears reach 300 with measured shifts and frame-independent acceleration',()=>{
 const runs=[30,60].map(fps=>{const s=createState(),trace=[];let last=s.gear;const shifts=[];for(let frame=0;frame<fps*80;frame++){for(let left=1/fps;left>1e-9;){const dt=Math.min(left,1/120);step(s,throttle,dt,0,1.75);left-=dt;}if(s.gear!==last){shifts.push({from:last,to:s.gear,kmh:s.speed*3.6,at:(frame+1)/fps,before:trace.at(-1)?.rpm});last=s.gear;}trace.push({...s,time:(frame+1)/fps});}return {s,trace,shifts};});
 for(const r of runs){const at=(v:number)=>r.trace.find(x=>x.speed*3.6>=v-1e-6)!.time;expect(at(100)).toBeGreaterThan(3);expect(at(100)).toBeLessThan(6);expect(at(200)).toBeGreaterThan(8);expect(at(200)).toBeLessThan(16);expect(at(300)).toBeGreaterThan(20);expect(at(300)).toBeLessThan(45);expect(r.s.speed*3.6).toBeGreaterThan(299);expect(r.s.speed*3.6).toBeLessThan(305);expect(r.shifts.map(s=>[s.from,s.to])).toEqual([[1,2],[2,3],[3,4],[4,5],[5,6]]);for(const shift of r.shifts){const after=r.trace.find(x=>x.time>=shift.at+.15)!;expect(after.rpm).toBeLessThan(shift.before-400);}expect(r.s.distance).toBeGreaterThan(2500);}
 expect(runs[0].s.distance).toBeCloseTo(runs[1].s.distance,7);expect(runs[0].s.rpm).toBeCloseTo(runs[1].s.rpm,7);
});
it('gear affects torque, hysteresis prevents hunting, and braking downshifts cleanly',()=>{
 const slower={...createState(),speed:90/3.6,gear:2,gearInitialized:true,rpm:roadRpm(2,90/3.6)},higher={...createState(),speed:90/3.6,gear:3,gearInitialized:true,rpm:roadRpm(3,90/3.6)};step(slower,throttle,1/120,0);step(higher,throttle,1/120,0);expect(slower.speed).not.toBe(higher.speed);expect(slower.rpm).toBeGreaterThan(higher.rpm);
 const hold={...createState(),speed:45/3.6,gear:2,gearInitialized:true,rpm:roadRpm(2,45/3.6)};for(let i=0;i<240;i++){hold.speed=(i%2?39:49)/3.6;step(hold,throttle,1/120,0);expect(hold.gear).toBe(2);}
 const s={...createState(),speed:300/3.6};step(s,throttle,1/120,0);expect(s.gear).toBe(6);const changes=[];for(let i=0;i<1200;i++){const old=s.gear;step(s,{gas:false,brake:true,steer:0},1/120,0);if(old!==s.gear)changes.push(s.gear);}expect(changes).toEqual([5,4,3,2,1]);expect(s.speed).toBe(0);expect(s.rpm).toBeCloseTo(1000,0);
});
it('engine pitch follows RPM and drops after an upshift; pause silences the active state',()=>{
 const audio=new EngineSound();audio.update(50,0,true,1/60,{rpm:7000,gear:2,shiftRemaining:0});const high=audio.inspect();audio.update(50,0,true,1/60,{rpm:4600,gear:3,shiftRemaining:.12});const shifted=audio.inspect();expect(shifted.engineHz).toBeLessThan(high.engineHz);expect(shifted.gear).toBe(3);for(let i=0;i<60;i++)audio.update(50,.2,true,1/60,{rpm:4600,gear:3,shiftRemaining:0});expect(audio.inspect().skidLevel).toBe(0);audio.pause();expect(audio.inspect().active).toBe(false);expect(audio.inspect().windLevel).toBe(0);
});

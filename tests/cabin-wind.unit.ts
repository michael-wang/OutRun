import {describe,it,expect} from 'vitest';
import {cabinWind} from '../src/cabin-wind';
const base={airX:0,airZ:0,velocityX:0,velocityZ:30,yaw:0,time:2};
describe('relative open-cabin airflow',()=>{
 it('subtracts actual world travel once, is rotation invariant and preserves crosswind',()=>{
  const a=cabinWind(base),b=cabinWind({...base,velocityX:30,velocityZ:0,yaw:Math.PI/2});
  expect(b.x).toBeCloseTo(a.x);expect(b.z).toBeCloseTo(a.z);
  expect(a.z).toBeLessThan(0);
  expect(cabinWind({...base,airX:8}).x-a.x).toBeCloseTo(5.2);
  const matched=cabinWind({...base,velocityZ:0,airZ:0});expect(matched.z).toBe(0);
 });
 it('has deterministic, continuous changing flow at 60/80 and bounded high-speed output',()=>{
  for(const velocityZ of [60/3.6,80/3.6,120/3.6,300/3.6,10000]){
   const frames=Array.from({length:360},(_,i)=>cabinWind({...base,velocityZ,time:i/60}));
   frames.forEach((f,i)=>{
    expect(f).toEqual(cabinWind({...base,velocityZ,time:i/60}));
    expect(Math.hypot(f.x,f.y,f.z)).toBeLessThan(51);
    if(i)expect(Math.abs(f.x-frames[i-1].x)).toBeLessThan(1);
   });
   expect(Math.max(...frames.map(f=>f.x))-Math.min(...frames.map(f=>f.x))).toBeGreaterThan(4);
  }
  expect(cabinWind({...base,velocityX:NaN})).toEqual({x:0,y:0,z:0,exposure:0});
 });
});

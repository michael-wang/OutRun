import {describe,it,expect} from 'vitest';
import {cabinWind,experimentalHairWind,hairWindPreset} from '../src/cabin-wind';
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
it('samples continuous, distinct lock turbulence with stronger wild forcing and calm idle',()=>{
 expect(hairWindPreset('unknown')).toBe('baseline');
 const flow=cabinWind(base);
 for(const preset of ['dramatic','wild'] as const){
  const sequences=Array.from({length:6},(_,chain)=>Array.from({length:360},(_,i)=>experimentalHairWind(preset,flow,25,i/60,chain,2,.3,0,{x:0,y:0,z:0})));
  sequences.forEach(seq=>seq.forEach((f,i)=>{
   expect(Object.values(f).every(Number.isFinite)).toBe(true);
   if(i)expect(Math.hypot(f.x-seq[i-1].x,f.y-seq[i-1].y,f.z-seq[i-1].z)).toBeLessThan(.7);
  }));
  expect(sequences[0]).not.toEqual(sequences[1]);
  expect(experimentalHairWind(preset,{x:0,y:0,z:0,exposure:0},0,8,0,2,0,0,{x:0,y:0,z:0})).toEqual({x:0,y:0,z:0});
 }
 const energy=(p:'dramatic'|'wild')=>Array.from({length:360},(_,i)=>experimentalHairWind(p,flow,25,i/60,1,2,0,0,{x:0,y:0,z:0})).reduce((n,f)=>n+f.x*f.x+f.y*f.y+f.z*f.z,0);
 expect(energy('wild')).toBeGreaterThan(energy('dramatic')*1.8);
});

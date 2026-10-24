import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createState,step} from '../src/handling';
import {createState as oldState,step as oldStep} from './fixtures/v032-handling';
import {EngineSound} from '../src/sound';
it('quantifies progressive tap and hold response against the preserved v0.3.2 integrator',()=>{
 const rows=[];
 for(const duration of [.18,.7,1,1.2])for(const side of [-1,1]){
  const before=oldState(),after=createState();before.speed=after.speed=65;
  for(let i=0;i<Math.round(duration*120);i++){oldStep(before,{gas:true,brake:false,steer:side},1/120,0,1.75);step(after,{gas:true,brake:false,steer:side},1/120,0,1.75);}
  rows.push({duration,side,before,after});
  if(duration===.18){expect(Math.abs(after.lateral)).toBeLessThan(.5);expect(Math.abs(after.heading)).toBeLessThan(Math.abs(before.heading)*.4);}
  if(duration>=1)expect(Math.abs(after.heading)).toBeGreaterThan(.2);
 }
 mkdirSync('docs/evidence/v0.4',{recursive:true});writeFileSync('docs/evidence/v0.4/steering-before-after.json',JSON.stringify(rows,null,2));
});
it('quiet gentle steering and persistent meaningful slip drive hysteretic squeal',()=>{
 const sound=new EngineSound();for(let i=0;i<300;i++)sound.update(113,.15,true,1/120);expect(sound.inspect().skidLevel).toBe(0);
 for(let i=0;i<20;i++)sound.update(113,.8,true,1/120);expect(sound.inspect().skidLevel).toBeGreaterThan(.1);
 for(let i=0;i<40;i++)sound.update(113,0,true,1/120);expect(sound.inspect().skidLevel).toBe(0);
});

it('mirrors left/right response and brake wins concurrent throttle',()=>{
 for(const duration of [.18,.7,1.2]){
  const left={...createState(),speed:65},right={...createState(),speed:65};
  for(let i=0;i<duration*120;i++){step(left,{gas:true,brake:false,steer:-1},1/120,0,1.75);step(right,{gas:true,brake:false,steer:1},1/120,0,1.75);}
  expect(left.lateral).toBeCloseTo(-right.lateral,10);expect(left.worldHeading).toBeCloseTo(-right.worldHeading,10);
 }
 const brake={...createState(),speed:55},both={...brake};
 for(let i=0;i<120;i++){step(brake,{gas:false,brake:true,steer:0},1/120,0,1.75);step(both,{gas:true,brake:true,steer:0},1/120,0,1.75);}
 expect(both.speed).toBe(brake.speed);expect(both.distance).toBe(brake.distance);
});

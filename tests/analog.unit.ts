import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {InputLatch} from '../src/input';
import {createState,step} from '../src/handling';
import {createState as oldState,step as oldStep} from './fixtures/v04-handling';
it('one analog axis has exclusive touch ownership, independent pedals and deterministic keyboard travel',()=>{
 const input=new InputLatch();input.press('gas','gas');input.setAnalog('finger',-.5);expect(input.snapshot()).toEqual({gas:true,brake:false,steer:-.5});
 input.setAnalog('other',1);expect(input.steeringTarget).toBe(-.5);input.setAnalog('finger',.8);input.release('other');expect(input.steeringTarget).toBe(.8);input.release('finger');expect(input.snapshot()).toEqual({gas:true,brake:false,steer:0});
 for(const sign of [-1,1]){input.clear();input.press('key',sign<0?'left':'right');input.update(.15);expect(input.steeringTarget).toBeCloseTo(sign*.375);input.update(.25);expect(input.steeringTarget).toBe(sign);input.release('key');input.update(.125);expect(input.steeringTarget).toBe(0);}
 const runs=[];for(const hz of [30,60,120]){input.clear();input.press('key','right');for(let i=0;i<hz*.4;i++)input.update(1/hz);runs.push(input.steeringTarget);}expect(runs.every(v=>Math.abs(v-1)<1e-8)).toBe(true);
});
it('direct analog yaw stops on neutral, reverses promptly, and never points the car at the road',()=>{
 for(const sign of [-1,1]){
  const s={...createState(),speed:65};step(s,{gas:true,brake:false,steer:sign*.5},1/120,0,1.75);expect(s.yawRate*sign).toBeGreaterThan(.5);
  const heading=s.worldHeading;for(let i=0;i<60;i++)step(s,{gas:true,brake:false,steer:0},1/120,.003,1.75);
  expect(s.yawRate).toBe(0);expect(s.worldHeading).toBe(heading);
  step(s,{gas:true,brake:false,steer:-sign*.5},1/120,0,1.75);expect(s.yawRate*sign).toBeLessThan(-.5);
 }
});
it('records matched v0.4 versus analog keyboard press/release/reversal traces',()=>{
 const experiments=[];
 for(const sign of [-1,1])for(const long of [false,true]){
  const before={...oldState(),speed:65},after={...createState(),speed:65},input=new InputLatch(),rows=[];
  for(let i=0;i<360;i++){
   const t=i/120,first=long?.9:.15,second=first+.5,end=second+(long?.6:.15);
   const direction=t<first?sign:t<second?0:t<end?-sign:0;
   input.release('left');input.release('right');if(direction)input.press(direction<0?'left':'right',direction<0?'left':'right');input.update(1/120);
   step(after,{gas:true,brake:false,steer:input.steeringTarget},1/120,0,1.75);oldStep(before,{gas:true,brake:false,steer:direction},1/120,0,1.75);
   rows.push({t,target:input.steeringTarget,before:{...before},after:{...after}});
   if(t>first+.13&&t<second)expect(after.yawRate).toBe(0);
  }
  experiments.push({sign,long,rows});
 }
 mkdirSync('docs/evidence/v0.4.1',{recursive:true});writeFileSync('docs/evidence/v0.4.1/handling-traces.json',JSON.stringify(experiments,null,2));
});

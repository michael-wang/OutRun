import {it,expect} from 'vitest';
import {InputLatch} from '../src/input';
import {quantizeSteering} from '../src/steering';
it('all nine notches, configurable counts, symmetric dead zone and hysteresis',()=>{
 for(const n of [3,4,5])for(let i=-n;i<=n;i++)expect(quantizeSteering(i/n,0,n)).toBe(i/n||0);
 for(const sign of [-1,1]){
  expect(quantizeSteering(sign*.09)).toBe(0);expect(quantizeSteering(sign*.11)).toBe(sign*.25);
  let last=sign*.25;for(const x of [.36,.38,.37,.39,.375]){last=quantizeSteering(sign*x,last);expect(last).toBe(sign*.25);}
  last=quantizeSteering(sign*.41,last);expect(last).toBe(sign*.5);
  for(const x of [.38,.36,.37])expect(quantizeSteering(sign*x,last)).toBe(sign*.5);
  expect(quantizeSteering(sign*.34,last)).toBe(sign*.25);expect(quantizeSteering(0,last)).toBe(0);
  expect(quantizeSteering(-sign*.8,last)).toBe(-sign*.75);
 }
});
it('exclusive analog ownership, independent pedals and continuous raw cursor with effective notches',()=>{
 const i=new InputLatch();i.press('gas','gas');i.setAnalog('finger',-.52);expect(i.steeringTarget).toBe(-.52);expect(i.snapshot()).toEqual({gas:true,brake:false,steer:-.5});
 i.setAnalog('other',1);expect(i.steeringTarget).toBe(-.52);i.release('other');i.release('finger');expect(i.snapshot()).toEqual({gas:true,brake:false,steer:0});
 for(const sign of [-1,1]){i.clear();i.press('key',sign<0?'left':'right');i.update(.15);expect(i.steeringTarget).toBeCloseTo(sign*.375);expect(i.snapshot().steer).toBe(sign*.25);i.update(.25);expect(i.snapshot().steer).toBe(sign);i.release('key');i.update(.125);expect(i.snapshot().steer).toBe(0);}
});
it('keyboard quantization is identical at 30/60/120 Hz and reversing crosses neutral promptly',()=>{
 for(const hz of [30,60,120]){const i=new InputLatch();i.press('right','right');for(let t=0;t<hz*.4;t++)i.update(1/hz);expect(i.snapshot().steer).toBe(1);i.release('right');i.press('left','left');for(let t=0;t<hz*.3;t++)i.update(1/hz);expect(i.snapshot().steer).toBeLessThan(0);i.clear();expect(i.steeringTarget).toBe(0);}
});

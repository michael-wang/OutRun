import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.7d1/regressions/v0.7d/regressions/v0.7c1';mkdirSync(root,{recursive:true});
test('compact active steering travel retains nine stable notches and independent gas in both layouts',async({browser})=>{
 const traces=[];
 for(const [width,height] of [[844,390],[960,432]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await c.newPage();await p.goto('/');
  for(const swapped of [false,true]){
   if(swapped){await p.locator('#settings').click();await p.locator('#swap').check();await p.locator('#close-settings').click();}
   await p.locator(swapped?'#resume':'#drive').click();await p.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({speed:230/3.6});});
   const box=(await p.locator('#steering-strip').boundingBox())!,pedal=(await p.locator('[data-control=gas]').boundingBox())!,touch=await touchDriver(p,c);expect(box.width).toBeGreaterThanOrEqual(120);expect(box.width).toBeLessThanOrEqual(160);expect(box.height).toBeGreaterThanOrEqual(48);expect(box.height).toBeLessThanOrEqual(64);expect(swapped?box.x>pedal.x:box.x<pedal.x).toBe(true);
   const rows=[];for(const notch of [-1,-.75,-.5,-.25,0,.25,.5,.75,1]){await touch(notch===-1?-.99:notch===1?.99:notch,true,false);await p.evaluate(()=>(window as any).__drive.advance(.12));const s=await p.evaluate(()=>(window as any).__drive.snapshot());expect(s.inputs.gas).toBe(true);expect(s.effectiveSteer).toBe(notch);rows.push({notch,raw:s.rawSteer,applied:s.appliedSteer});}
   await touch(.25,true,false);const delta=4/box.width;for(let i=0;i<8;i++){await touch(.375+(i%2?delta:-delta),true,false);await p.evaluate(()=>(window as any).__drive.advance(.03));expect((await p.evaluate(()=>(window as any).__drive.snapshot())).effectiveSteer).toBe(.25);}
   await touch(-1.1,true,false,-45);await p.evaluate(()=>(window as any).__drive.advance(.12));let held=await p.evaluate(()=>(window as any).__drive.snapshot());expect(held.appliedSteer).toBe(-1);expect(held.rawSteer).toBe(-1);expect(held.inputs.gas).toBe(true);await touch(1.1,true,false,45);await p.evaluate(()=>(window as any).__drive.advance(.12));held=await p.evaluate(()=>(window as any).__drive.snapshot());expect(held.appliedSteer).toBe(1);expect(held.rawSteer).toBe(1);expect(held.inputs.gas).toBe(true);
   await p.screenshot({path:`${root}/compact-${width}-${swapped}.png`});await touch(null,true,false);await p.evaluate(()=>(window as any).__drive.advance(.1));let s=await p.evaluate(()=>(window as any).__drive.snapshot());expect(s.inputs.gas).toBe(true);expect(s.appliedSteer).toBe(0);await touch(null,false,false);await p.locator('#pause').click();traces.push({width,height,swapped,box,centerToLock:box.width/2,fullTravel:box.width,rows});
  }await c.close();
 }writeFileSync(`${root}/compact-steering.json`,JSON.stringify(traces,null,2));
});

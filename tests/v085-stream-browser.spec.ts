import {test,expect} from '@playwright/test';

test('experimental streamer replaces past chunks and maintains tire contact at boundaries',async({page})=>{
 await page.goto('/?stage=1&seed=1&stream=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready,{timeout:30000});
 const initial=await page.evaluate(()=>(window as any).__drive.streaming());expect(initial.chunks.length).toBeLessThan(10);
 await page.keyboard.press('KeyP');
 for(const distance of [999,1001,4999,5001,8999,9001,12500]){
  await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:40,lateral:0});},distance);
  await page.waitForFunction(()=>(window as any).__drive.streaming().ready,{timeout:30000});
  const data=await page.evaluate(()=>{const g=(window as any).__drive;g.advance(.01,{gas:false,brake:false,steer:0});return {stream:g.streaming(),contacts:g.wheelContacts(),memory:g.scenery().memory};});
  expect(data.stream.error).toBe('');expect(data.stream.chunks.length).toBeLessThanOrEqual(7);
  for(const contact of data.contacts)expect(Math.abs(contact.gap??100)).toBeLessThan(.1);
 }
 const last=await page.evaluate(()=>(window as any).__drive.streaming());expect(last.chunks.every((c:any)=>c.index>=11)).toBe(true);
});

test('early Play and replay wait for the correct window before the clock advances',async({page})=>{
 await page.goto('/?stage=1&seed=1');await page.keyboard.press('KeyP');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:12500,speed:50});});
 await page.waitForFunction(()=>(window as any).__drive.streaming().ready);
 await page.keyboard.press('KeyR');await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
 const data=await page.evaluate(()=>({state:(window as any).__drive.snapshot(),stream:(window as any).__drive.streaming()}));
 expect(data.state.distance).toBe(350);expect(data.state.elapsed).toBe(0);expect(data.stream.chunks.some((c:any)=>c.index===0&&c.road==='ready')).toBe(true);expect(data.stream.chunks.every((c:any)=>c.index<=5)).toBe(true);
});

test('rapid window changes discard work outside the current route window',async({page})=>{
 await page.goto('/?stage=1&seed=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);for(const distance of [9500,2500,12500,350])g.reset({distance,speed:50});});
 await page.waitForFunction(()=>(window as any).__drive.streaming().ready);await page.waitForTimeout(500);
 const stream=await page.evaluate(()=>(window as any).__drive.streaming());expect(stream.error).toBe('');expect(stream.chunks.every((c:any)=>c.index<=5)).toBe(true);expect(stream.queued).toBe(0);expect(stream.retiring).toBe(0);expect(stream.history.some((e:any)=>e.kind==='dispose')).toBe(true);
 await page.goto('/?stage=1&seed=2');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);expect(await page.evaluate(()=>(window as any).__drive.brick().stageCode)).toBe('S01-v0.8.3-r2-2-ALB2');
});

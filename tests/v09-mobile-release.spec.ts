import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('Play needs complete nearby scenery, not the entire preload window',async({page})=>{
 await page.addInitScript(()=>{
  const Native=window.Worker;
  window.Worker=class extends Native{postMessage(data:any,options?:any){if(data.index>=2)return;super.postMessage(data,options);}} as typeof Worker;
 });
 await page.goto('/?perf=1');await page.locator('#l2-play').click();
 await expect(page.locator('#l2-lab')).toBeHidden({timeout:10000});
 const stream=await page.evaluate(()=>(window as any).__drive.streaming());
 expect(stream.ready).toBe(true);expect(stream.fullyReady).toBe(false);expect(stream.nearby).toEqual([0,1]);
 await expect(page.locator('#perf')).toContainText('FPS');
});

test('production hides diagnostics and uses only the current PWA cache',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?perf=1');
 await expect(page.locator('#perf')).toHaveCount(0);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>caches.keys())).toEqual(['coast-drive-v09-mobile-1']);
 await page.waitForFunction(async()=>{const cache=await caches.open('coast-drive-v09-mobile-1');return (await cache.keys()).some(r=>r.url.includes('road-worker-'));});
});

test('mobile streaming keeps complete scenery through fast chunk crossings in all worlds',async({browser})=>{
 test.setTimeout(120000);mkdirSync('docs/evidence/v0.9-mobile',{recursive:true});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto('/?perf=1');await page.locator('#l2-play').tap();await expect(page.locator('#l2-lab')).toBeHidden({timeout:10000});
 const phases=await page.evaluate(()=>(window as any).__drive.brick().worldPhases.slice(0,3));
 const rows=[];
 for(const phase of phases){
  const start=350+phase.startS+1000;
  await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:83.3});},start);
  await page.waitForFunction(()=>(window as any).__drive.streaming().ready);
  for(let i=0;i<15;i++){
   await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:83.3}),start+i*100);
   await page.waitForTimeout(250);
   const state=await page.evaluate(()=>{const g=(window as any).__drive;return {stream:g.streaming(),wheels:g.wheelContacts(),perf:g.perf(),scenery:g.scenery()};});
   expect(state.stream.error).toBe('');expect(state.stream.ready).toBe(true);
   for(const index of state.stream.nearby)expect(state.stream.sceneryCounts.find((c:any)=>c.index===index)?.instances).toBeGreaterThan(0);
   for(const wheel of state.wheels)expect(Math.abs(wheel.gap??100)).toBeLessThan(.1);
   rows.push({world:phase.world,distance:start+i*100,...state,stream:{...state.stream,history:undefined}});
  }
  await page.screenshot({path:`docs/evidence/v0.9-mobile/${phase.world}.png`});
 }
 writeFileSync('docs/evidence/v0.9-mobile/streaming.json',JSON.stringify({method:'Scripted 100 m jumps every 250 ms (up to 400 m/s), mobile viewport and 4x main-thread CPU throttle; not physical-device driving',rows},null,2));
 await context.close();
});

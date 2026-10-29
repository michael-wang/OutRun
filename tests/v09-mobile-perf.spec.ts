import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('mobile browser performance probe',async({browser})=>{
 test.setTimeout(240000);
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto('/?perf=1');await page.locator('#l2-play').tap();
 await expect(page.locator('#l2-lab')).toBeHidden({timeout:120000});
 const startup=await page.evaluate(()=>({ms:performance.now(),stream:(window as any).__drive.streaming()}));
 const samples=[];
 for(const distance of [350,24000,47000]){
  await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:65});},distance);
  await page.waitForFunction(()=>(window as any).__drive.streaming().ready,null,{timeout:120000});
  await page.waitForFunction(()=>(window as any).__drive.streaming().fullyReady,null,{timeout:120000});await page.waitForTimeout(5000);
  samples.push(await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),perf:g.perf(),scenery:g.scenery(),stream:g.streaming()};}));
 }
 mkdirSync('docs/evidence/v0.9-mobile',{recursive:true});
 writeFileSync(`docs/evidence/v0.9-mobile/${process.env.OUTRUN_PERF_LABEL??'after'}.json`,JSON.stringify({environment:'Edge desktop, 915x412 touch, DPR 2.625, CDP main-thread CPU slowdown 4x; not Pixel 8 hardware or GPU',startup,samples},null,2));
 await context.close();
});

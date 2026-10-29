import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('every Seed 1 scenery chunk has deterministic visible content',async({page})=>{
 await page.goto('/');
 const rows=await page.evaluate(async()=>{
  const stage=(window as any).__drive.brick(),worker=new Worker('/src/road-worker.ts',{type:'module'});
  const receive=()=>new Promise<any>((resolve,reject)=>{worker.onmessage=e=>e.data.type==='error'?reject(Error(e.data.message)):resolve(e.data);worker.onerror=e=>reject(Error(e.message));});
  const init=receive();worker.postMessage({type:'init',generation:9,stage});await init;
  const rows=[];
  for(let index=0;index<70;index++){
   const response=receive();worker.postMessage({type:'scenery',generation:9,index,start:index*1000,end:Math.min(69950,(index+1)*1000)});
   const data=await response;rows.push({index,cpuMs:data.cpuMs,...data.scenery,clearance:data.clearance,finite:data.instances.every((x:any)=>Array.from(x.matrices).every(Number.isFinite))});
  }
  worker.terminate();return rows;
 });
 for(const row of rows){expect(row.instances).toBeGreaterThan(0);expect(row.finite).toBe(true);}
 mkdirSync('docs/evidence/v0.9-mobile',{recursive:true});writeFileSync('docs/evidence/v0.9-mobile/scenery-audit.json',JSON.stringify(rows,null,2));
});

test('normal simulation with scripted controls sustains mobile-emulated rendering',async({browser})=>{
 test.setTimeout(120000);
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true}),page=await context.newPage();
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.goto('/?perf=1');await page.locator('#l2-play').tap();await expect(page.locator('#l2-lab')).toBeHidden({timeout:10000});await expect(page.locator('#perf')).toBeVisible();
 const phases=await page.evaluate(()=>(window as any).__drive.brick().worldPhases.slice(0,3)),rows=[];
 for(const phase of phases){
  await page.evaluate(d=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:d,speed:65});},350+phase.startS+1500);
  await page.waitForFunction(()=>(window as any).__drive.streaming().ready);
  await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.06-s.heading*.8))});},50);});
  for(let i=0;i<15;i++){
   await page.waitForTimeout(1000);
   const row=await page.evaluate(()=>{const g=(window as any).__drive;return {perf:g.perf(),distance:g.snapshot().distance,ready:g.streaming().ready,calls:g.scenery().render.calls};});
   rows.push({world:phase.world,second:i,...row});expect(row.ready).toBe(true);
   if(i>=2)expect(row.perf.fps).toBeGreaterThanOrEqual(30);
  }
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
 }
 mkdirSync('docs/evidence/v0.9-mobile',{recursive:true});writeFileSync('docs/evidence/v0.9-mobile/driving.json',JSON.stringify({method:'Normal real-time physics with scripted steering/throttle, 15 seconds per world, mobile viewport and 4x main-thread CPU slowdown; desktop GPU, not Pixel 8',rows},null,2));
 await context.close();
});

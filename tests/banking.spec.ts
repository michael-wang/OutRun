import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const root='docs/evidence/banking';
test('banked L2P-B road, wheel contacts, transition driving and mobile rendering',async({browser})=>{
 test.setTimeout(180000);mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const samples=[],runs=[];
 for(const strength of [0,4,10]){
  await page.goto(`/?lab=pilots&pilot=L2P-B&bank=${strength}&perf=1`);await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:1080,speed:50,lateral:0});});await stageReady(page);await page.waitForTimeout(1600);
  const sample=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),wheels:g.wheelContacts(),seams:g.supportAudit()};});samples.push({strength,...sample});expect(sample.state.bankDegrees).toBeCloseTo(strength);for(const w of sample.wheels)expect(Math.abs(w.gap??1)).toBeLessThan(.03);expect(sample.seams.maxSeam).toBeLessThan(.001);await page.screenshot({path:`${root}/${strength===0?'flat':strength===4?'gentle':'strong'}.png`,scale:'css'});
  if(strength===4)continue;
  await page.evaluate(()=>{const g=(window as any).__drive;g.reset({distance:650,speed:50});});await stageReady(page);
  if(strength===10)await page.evaluate(()=>{const w=window as any;w.chunks=[];w.rec=new MediaRecorder(document.querySelector('canvas')!.captureStream(30),{mimeType:'video/webm;codecs=vp8'});w.rec.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.rec.start();});
  await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<50,brake:s.speed>51,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.08))});},16);});
  const rows=[];for(let i=0;i<60;i++){await page.waitForTimeout(200);const r=await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();return {distance:s.distance,lateral:s.lateral,bank:s.bankDegrees,perf:g.perf(),wheels:g.wheelContacts(),ready:g.streaming().ready};});rows.push(r);if(r.distance>1400)break;}
  await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
  if(strength===10){const bytes=await page.evaluate(async()=>{const w=window as any;await new Promise<void>(r=>{w.rec.onstop=r;w.rec.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(`${root}/drive.webm`,Buffer.from(bytes));}
  runs.push({strength,rows});writeFileSync(`${root}/verification.json`,JSON.stringify({samples,runs,errors},null,2));expect(rows.at(-1)!.distance).toBeGreaterThan(1400);for(const r of rows){expect(r.ready).toBe(true);for(const w of r.wheels)expect(Math.abs(w.gap??1)).toBeLessThan(.06);}expect(rows.slice(8).every(r=>r.perf.fps>=30)).toBe(true);
 }
 await page.goto('/?bank=10');await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.snapshot().bankDegrees)).toBe(0);
 expect(errors).toEqual([]);await context.close();
});

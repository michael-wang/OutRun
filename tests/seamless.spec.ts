import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
test('seamless banking gameplay evidence',async({browser})=>{
 test.setTimeout(180000);const root='docs/evidence/seamless',phase=process.env.SEAM_PHASE??'after';mkdirSync(root,{recursive:true});
 const context=await browser.newContext({viewport:{width:960,height:432},deviceScaleFactor:2,isMobile:true,hasTouch:true}),page=await context.newPage();
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});const samples=[];
 await page.goto('/?seed=1&perf=1');await stageReady(page);await page.addStyleTag({content:'#perf,#immersive-note{display:none!important}'});await page.locator('#l2-play').tap();await page.evaluate(()=>(window as any).__drive.manual(true));
 for(const distance of [620,970,1000,1930,2000,2280,3000,3220]){
  await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:70,lateral:0}),distance);await stageReady(page);await page.waitForTimeout(300);
  await page.screenshot({path:`${root}/${phase}-${distance}.png`,scale:'css'});
  samples.push(await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),wheels:g.wheelContacts(),seams:g.supportAudit(),perf:g.perf()};}));
 }
 if(phase==='after'){
 await page.evaluate(()=>{const g=(window as any).__drive;g.reset({distance:560,speed:75,lateral:0});});await stageReady(page);
 await page.evaluate(()=>{const w=window as any,g=w.__drive;w.chunks=[];w.rec=new MediaRecorder(document.querySelector('canvas')!.captureStream(30),{mimeType:'video/webm;codecs=vp8'});w.rec.ondataavailable=(e:BlobEvent)=>w.chunks.push(e.data);w.rec.start();g.manual(false);w.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<75,brake:s.speed>76,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.15-s.lateralRate*.05))});},16);});
 const drive=[];for(let i=0;i<100;i++){await page.waitForTimeout(250);const r=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),wheels:g.wheelContacts(),ready:g.streaming().ready,perf:g.perf()};});drive.push(r);if(r.state.distance>2350)break;}
 const bytes=await page.evaluate(async()=>{const w=window as any;clearInterval(w.driver);w.__drive.manual(true);await new Promise<void>(r=>{w.rec.onstop=r;w.rec.stop();});return Array.from(new Uint8Array(await new Blob(w.chunks).arrayBuffer()));});writeFileSync(root+'/banking.webm',Buffer.from(bytes));writeFileSync(root+'/drive.json',JSON.stringify(drive,null,2));expect(drive.at(-1)!.state.distance).toBeGreaterThan(2300);expect(drive.every(r=>r.ready)).toBe(true);
 }
 writeFileSync(`${root}/${phase}.json`,JSON.stringify(samples,null,2));expect(samples.every(s=>s.seams.maxSeam<.001)).toBe(true);await context.close();
});
test('r4 multi-seed chunk and feature contact checks',async({page})=>{
 test.setTimeout(120000);const rows=[];
 for(const seed of [1,2,7]){
  await page.goto(`/?seed=${seed}`);await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>(window as any).__drive.manual(true));
  const points=await page.evaluate(()=>{const b=(window as any).__drive.brick(),f=b.bankFeatures.find((f:any)=>f.kind==='showcase');return [1000,2000,3000,f.start,f.start+150,(f.start+f.end)/2,f.end-150,f.end];});
  for(const d of points){await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:75,lateral:1.75}),d);await stageReady(page);const r=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),wheels:g.wheelContacts(),traffic:g.trafficContacts(),seams:g.supportAudit()};});for(const w of r.wheels)expect(Math.abs(w.gap??1)).toBeLessThan(.08);for(const w of r.traffic)expect(Math.abs(w.gap??1)).toBeLessThan(.15);expect(r.seams.maxSeam).toBeLessThan(.001);rows.push({seed,...r});}
 }
 writeFileSync('docs/evidence/seamless/contacts.json',JSON.stringify(rows,null,2));
});

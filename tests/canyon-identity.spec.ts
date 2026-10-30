import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const phase=process.env.CANYON_BEFORE==='1'?'before':'after',root='docs/evidence/canyon-identity';
test('Seed 1 canyon identical viewpoint comparison',async({page})=>{
 mkdirSync(root+'/'+phase,{recursive:true});await page.setViewportSize({width:915,height:412});await page.goto('/');await stageReady(page);await page.evaluate(()=>(window as any).__drive.manual(true));const rows=[];
 for(const distance of [620,720,820]){await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:65}),distance);await stageReady(page);await page.waitForTimeout(400);const r=await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();return {distance:s.distance,camera:s.camera,sample:g.sample(s.distance),stream:g.streaming(),traffic:g.traffic(),contacts:g.trafficContacts()};});rows.push(r);expect(r.stream.ready).toBe(true);for(const c of r.contacts)expect(Math.abs(c.gap??1)).toBeLessThan(.16);await page.screenshot({path:root+'/'+phase+'/'+distance+'.png'});}
 writeFileSync(root+'/'+phase+'/samples.json',JSON.stringify(rows,null,2));
 if(phase==='after'){const before=JSON.parse(readFileSync(root+'/before/samples.json','utf8'));for(let i=0;i<rows.length;i++){expect(JSON.parse(JSON.stringify(rows[i].sample))).toEqual(before[i].sample);expect(JSON.parse(JSON.stringify(rows[i].camera))).toEqual(before[i].camera);}}
});
test('drive through canyon with streaming and mobile performance',async({browser})=>{
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,recordVideo:{dir:'test-results/canyon-video',size:{width:915,height:412}}}),page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:580,speed:55,lateral:1.75});});await stageReady(page);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<55,brake:s.speed>57,steer:s.requiredSteer-(s.lateral-1.75)*.1});},16);});
 const rows=[];for(let i=0;i<14;i++){await page.waitForTimeout(500);rows.push(await page.evaluate(()=>{const g=(window as any).__drive;return {distance:g.snapshot().distance,perf:g.perf(),ready:g.streaming().ready,traffic:g.traffic().actors.length,contacts:g.wheelContacts()};}));}
 await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});for(const r of rows){expect(r.ready).toBe(true);for(const c of r.contacts)expect(Math.abs(c.gap??1)).toBeLessThan(.12);}expect(rows.slice(3).every(r=>r.perf.fps>=30)).toBe(true);
 writeFileSync(root+'/performance.json',JSON.stringify({environment:'Edge 915x412 DPR 2.625 touch; 4x CPU slowdown, desktop GPU; not physical Pixel 8',rows},null,2));const video=page.video()!;await context.close();await video.saveAs(root+'/drive.webm');
});

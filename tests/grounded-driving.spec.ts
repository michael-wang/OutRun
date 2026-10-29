import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const before=process.env.OUTRUN_GROUNDED_BEFORE==='1',root=`docs/evidence/grounded-driving/comparison/${before?'before':'after'}`;
test('Seed 1 canyon grounded driving comparison',async({browser})=>{
 test.setTimeout(180000);mkdirSync(root,{recursive:true});
 const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,recordVideo:before?undefined:{dir:root,size:{width:915,height:412}}}),page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();await page.evaluate(()=>(window as any).__drive.manual(true));
 const points=await page.evaluate(()=>{const g=(window as any).__drive,phase=g.brick().worldPhases.find((p:any)=>p.world==='canyon'),rows=[];for(let d=phase.startS+650;d<phase.endS+100;d+=20){const p=g.sample(d);rows.push({d,grade:p.grade,curvature:p.curvature});}const uphill=rows.reduce((a,b)=>a.grade>b.grade?a:b),downhill=rows.reduce((a,b)=>a.grade<b.grade?a:b);const crest=rows.filter((r,i)=>i>0&&i<rows.length-1&&rows[i-1].grade>0&&rows[i+1].grade<0&&r.d>uphill.d&&r.d<downhill.d).sort((a,b)=>Math.abs(a.grade)-Math.abs(b.grade))[0]??rows[Math.floor(rows.length/2)];const bend=rows.find(r=>[0,40,80,120].every(a=>{const k=g.sample(r.d+a).curvature;return Math.sign(k)===Math.sign(r.curvature)&&Math.abs(k)>.0034&&Math.abs(k)<.005;}))??rows.reduce((a,b)=>Math.abs(a.curvature)>Math.abs(b.curvature)?a:b);return {phase,uphill,crest,downhill,normal:{d:2750},corner:{d:bend.d-40},drift:{d:bend.d-40}};});
 const rows=[];
 for(const name of ['normal','corner','drift','uphill','crest','downhill'] as const){
  await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:65}),(points[name] as any).d);await stageReady(page);
  if(name==='corner'||name==='drift')for(let i=0;i<(name==='corner'?30:36);i++)await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();g.advance(1/60,{gas:true,brake:false,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.08))});});
  await page.screenshot({path:`${root}/${name}.png`});rows.push({name,point:points[name],...await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),wheels:g.wheelContacts(),effects:g.tireEffects?.(),render:g.scenery().render};})});
 }
 for(const row of rows)for(const wheel of row.wheels)expect(Math.abs(wheel.gap??1)).toBeLessThan(.12);
 if(!before){expect(rows[0].effects.particles).toBe(0);expect(rows[1].effects.particles).toBeGreaterThan(0);expect(rows[1].state.slip).toBeGreaterThan(.5);expect(rows[2].effects.segments).toBeGreaterThan(rows[1].effects.segments);}
 writeFileSync(`${root}/comparison.json`,JSON.stringify({points,rows},null,2));
 await context.close();if(!before)await page.video()!.saveAs(`${root}/grounded-driving.webm`);
});

 test('real-time canyon driving, streaming and replay cleanup',async({browser})=>{
 test.setTimeout(120000);const dir='docs/evidence/grounded-driving';mkdirSync(dir,{recursive:true});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,recordVideo:{dir:`${dir}/recording`,size:{width:915,height:412}}}),page=await context.newPage();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:4000,speed:65});});await stageReady(page);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.08))});},16);});
 const rows=[];for(let i=0;i<15;i++){await page.waitForTimeout(1000);rows.push(await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),perf:g.perf(),effects:g.tireEffects(),stream:g.streaming(),render:g.scenery().render,memory:g.scenery().memory,wheels:g.wheelContacts()};}));}
 await page.evaluate(()=>{clearInterval((window as any).driver);(window as any).__drive.manual(true);});
 for(const r of rows){expect(r.stream.ready).toBe(true);expect(r.effects.particles).toBeLessThanOrEqual(48);expect(r.effects.segments).toBeLessThanOrEqual(384);for(const wheel of r.wheels)expect(Math.abs(wheel.gap??1)).toBeLessThan(.12);}
 expect(rows.some(r=>r.effects.particles>0)).toBe(true);expect(rows.slice(2).every(r=>r.perf.fps>=30)).toBe(true);
 await page.locator('#pause').tap();await page.locator('#l2-replay').tap();await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.tireEffects().segments)).toBe(0);
 await page.goto('/?seed=2');await stageReady(page);expect(await page.evaluate(()=>(window as any).__drive.tireEffects())).toMatchObject({particles:0,segments:0});expect(errors).toEqual([]);
 writeFileSync(`${dir}/driving.json`,JSON.stringify({environment:'Edge mobile emulation, 915x412, DPR 2.625, 4x CPU; desktop GPU, video recording enabled; not physical Pixel 8',rows,errors},null,2));
 const video=page.video()!;await context.close();await video.saveAs(`${dir}/grounded-driving.webm`);
});

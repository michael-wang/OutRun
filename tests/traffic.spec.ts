import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {stageReady} from './stage-ready';
const root='docs/evidence/traffic-mvp';
test('moving traffic approach, overtake and later large vehicles on mobile',async({browser})=>{
 test.setTimeout(120000);mkdirSync(root,{recursive:true});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,recordVideo:{dir:`${root}/raw`,size:{width:915,height:412}}}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 await page.goto('/?perf=1');await stageReady(page);await page.locator('#l2-play').tap();
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:350,speed:65,lateral:1.75});});await stageReady(page);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(false);(window as any).trafficDriver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-(s.lateral-1.75)*.12))});},16);});
 const rows:any[]=[],shots=new Set<string>();
 for(let i=0;i<60;i++){
  await page.waitForTimeout(250);const row=await page.evaluate(()=>{const g=(window as any).__drive;return {state:g.snapshot(),traffic:g.traffic(),perf:g.perf(),ready:g.streaming().ready,render:g.scenery().render};});rows.push(row);
  for(const a of row.traffic.actors){const delta=a.distance-row.state.distance;let name='';if(a.id===0&&delta>25&&delta<65)name='approaching-car';if(a.id===0&&delta>5&&delta<28)name='overtaking-car';if(a.type===1&&delta>8&&delta<35)name='bus-later';if(a.type===2&&delta>12&&delta<70)name='truck-later';if(name&&!shots.has(name)){shots.add(name);await page.screenshot({path:`${root}/${name}.png`,scale:'css'});}}
 }
 await page.evaluate(()=>{clearInterval((window as any).trafficDriver);(window as any).__drive.manual(true);});
 expect(rows.some(r=>r.traffic.actors.some((a:any)=>a.id===0&&a.distance<r.state.distance-10))).toBe(true);expect(shots.has('approaching-car')).toBe(true);expect(shots.has('overtaking-car')).toBe(true);expect(shots.has('bus-later')).toBe(true);expect(shots.has('truck-later')).toBe(true);expect(errors).toEqual([]);
 for(const r of rows){expect(r.ready).toBe(true);expect(r.traffic.actors.length).toBeLessThanOrEqual(12);for(const a of r.traffic.actors)expect(a.visible).toBe(true);}expect(rows.slice(8).every(r=>r.perf.fps>=30)).toBe(true);
 const first=rows.find(r=>r.traffic.actors.some((a:any)=>a.id===0))!,last=rows.filter(r=>r.traffic.actors.some((a:any)=>a.id===0)).at(-1)!;expect(last.traffic.actors.find((a:any)=>a.id===0).distance).toBeGreaterThan(first.traffic.actors.find((a:any)=>a.id===0).distance+50);
 writeFileSync(`${root}/driving.json`,JSON.stringify({environment:'Edge 915x412 touch DPR 2.625, 4x CPU slowdown, desktop GPU, recording; not Pixel 8',shots:[...shots],rows,errors},null,2));const video=page.video()!;await context.close();await video.saveAs(`${root}/traffic.webm`);
});
test('traffic seed/replay, contact slowdown, streamed geometry and historical route isolation',async({page})=>{
 await page.goto('/');await stageReady(page);await page.locator('#l2-play').click();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:350,speed:0});});
 const inspect=()=>page.evaluate(()=>(window as any).__drive.traffic());const first=await inspect();
 await page.evaluate(()=>(window as any).__drive.reset({distance:350,speed:0}));const replay=await inspect();expect(replay.actors.map((a:any)=>[a.id,a.distance])).toEqual(first.actors.map((a:any)=>[a.id,a.distance]));
 const car=replay.actors.find((a:any)=>a.type===0);await page.evaluate(a=>{const g=(window as any).__drive;g.reset({distance:a.distance-5,speed:65,lateral:a.lateral});},car);await stageReady(page);
 await page.evaluate(()=>(window as any).__drive.advance(.05,{gas:true,brake:false,steer:0}));const hit=await page.evaluate(()=>(window as any).__drive.snapshot());expect(hit.speed).toBeLessThan(50);expect((await inspect()).impacts).toBe(1);expect(Math.abs(hit.heading)).toBeLessThan(.3);
 const contactRows=[];for(const distance of [4950,5790,5990,24000,47000,68000]){await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:0}),distance);await stageReady(page);const t=await inspect();expect(t.actors.length).toBeLessThanOrEqual(12);for(const a of t.actors){expect(a.visible).toBe(true);const half=await page.evaluate(d=>(window as any).__drive.sample(d).halfWidth,a.distance);expect(half).toBeGreaterThan(0);expect(Math.abs(a.lateral)+(a.type===0?.9:1.175)).toBeLessThan(half);}const contacts=await page.evaluate(()=>(window as any).__drive.trafficContacts());contactRows.push({distance,contacts});for(const c of contacts)expect(Math.abs(c.gap??1),JSON.stringify(c)).toBeLessThan(.16);await page.screenshot({path:`${root}/road-${distance}.png`});}
 writeFileSync(`${root}/contacts.json`,JSON.stringify(contactRows,null,2));
 await page.goto('/?stage=1');await stageReady(page);expect(await inspect()).toBeUndefined();
});

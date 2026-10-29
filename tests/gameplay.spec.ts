import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.8.4/regressions/v0.8.3/regressions/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c';
const snap=(p:any)=>p.evaluate(()=>(window as any).__drive.snapshot());
test('trusted finger jitter stays inside a notch until a deliberate threshold crossing',async({browser})=>{
 const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('/?mode=free');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const touch=await touchDriver(page,context),rows=[];
 for(const [raw,expected] of [[.25,.25],[.365,.25],[.385,.25],[.375,.25],[.415,.5],[.385,.5],[.365,.5],[.33,.25],[.06,.25],[.04,0],[-.76,-.75],[0,0]]){
  await touch(raw,true,false);await expect.poll(async()=>Number((await page.evaluate(()=>(window as any).__drive.steering())).rawSteer.toFixed(3))).toBe(raw);const s=await page.evaluate(()=>(window as any).__drive.steering());expect(s.effectiveSteer).toBe(expected);expect(s.rawSteer).toBeCloseTo(raw,3);rows.push(s);
 }
 await touch(null,true,false);expect((await snap(page)).inputs).toEqual({gas:true,brake:false,steer:0});mkdirSync(root,{recursive:true});writeFileSync(`${root}/hysteresis-touch.json`,JSON.stringify(rows,null,2));await context.close();
});
test('five authored challenges: trusted touch notches, paired failures/braking and neutral exit',async({browser})=>{
 mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true}));
 await page.goto('/?challenge=low');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const touch=await touchDriver(page,context),course=await page.evaluate(()=>(window as any).__drive.challenges()),runs=[];
 const advance=()=>page.evaluate(()=>(window as any).__drive.advance(.05,undefined,false));
 for(const id of ['low','medium','high']){
  const c=course.find((c:any)=>c.id===id);
  for(const kind of ['none','matching',...(id==='high'?['weak']:[])]){
   await touch(null,false,false);await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:230/3.6}),c.start+c.transitionLength);
   const u=kind==='none'?0:kind==='weak'?.5:c.targetRequiredSteering;await touch(u,true,false);const rows=[];
   for(let i=0;i<60;i++){const state=await snap(page);await touch(u,state.speed*3.6<231,false);await advance();rows.push(await snap(page));}
   if(kind==='matching'){expect(rows.every(s=>!s.offRoad)).toBe(true);expect(Math.abs(rows.at(-1).lateral)).toBeLessThan(1);}
   else expect(rows.some(s=>s.offRoad)).toBe(true);
   await page.evaluate(()=>(window as any).__drive.advance(0));await page.screenshot({path:`${root}/${id}-${kind}.png`});runs.push({id,kind,rows});
  }
 }
 const c=course.find((c:any)=>c.id==='extreme');
 for(const braked of [false,true]){
  await touch(null,false,false);await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:230/3.6}),c.start-100);const rows=[];
  for(let i=0;i<400;i++){
   const s=await snap(page);if(s.distance>=c.end)break;
   const need=await page.evaluate(()=>{const g=(window as any).__drive;return g.steering().requiredSteer;});
   // Full inward lock on the core in BOTH runs; gentle authored ramp on entry.
   const core=s.distance>=c.start+c.transitionLength&&s.distance<=c.end-c.transitionLength;
   const raw=core?1:Math.max(0,Math.min(1,Math.round(need*4)/4));
   await touch(raw,!braked||s.speed<190/3.6,braked&&s.speed>191/3.6);await advance();rows.push(await snap(page));
  }
  expect(rows.at(-1).distance).toBeGreaterThanOrEqual(c.end);
  expect(rows.some(s=>s.offRoad)).toBe(!braked);if(braked)expect(rows.some(s=>s.inputs.brake)).toBe(true);
  await touch(null,false,false);const x=(await snap(page)).lateral;await page.evaluate(()=>(window as any).__drive.advance(.5));expect((await snap(page)).lateral).toBeCloseTo(x,8);
  await page.screenshot({path:`${root}/extreme-${braked?'braked':'fast'}.png`});runs.push({id:'extreme',braked,rows});
 }
 const a=course.find((c:any)=>c.id==='s-left'),b=course.find((c:any)=>c.id==='s-right');
 await touch(null,false,false);await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:230/3.6}),a.start-30);const rows=[];
 for(let i=0;i<180;i++){
  const s=await snap(page);if(s.distance>b.end+30)break;
  const need=await page.evaluate(()=>(window as any).__drive.steering().requiredSteer);await touch(Math.round(need*4)/4,s.speed*3.6<231,false);await advance();rows.push(await snap(page));
 }
 expect(rows.every(s=>!s.offRoad)).toBe(true);expect(rows.some(s=>s.inputs.steer===-.5)).toBe(true);expect(rows.some(s=>s.inputs.steer===.5)).toBe(true);expect(rows.some(s=>s.inputs.steer===0)).toBe(true);
 await touch(null,false,false);const x=(await snap(page)).lateral;
 // Release check stays on the authored straight, before the next canyon bend.
 expect(await page.evaluate(()=>{const g=(window as any).__drive,s=g.snapshot();return Math.abs(g.sample(s.distance+s.travelSpeed*.25).curvature);})).toBeLessThan(1e-8);
 await page.evaluate(()=>(window as any).__drive.advance(.25));expect((await snap(page)).lateral).toBeCloseTo(x,8);
 runs.push({id:'s',rows});expect(errors).toEqual([]);writeFileSync(`${root}/paired-gameplay.json`,JSON.stringify({runs,errors},null,2));await context.close();
});

import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchDriver} from './touch-driver';
test('full-gas left/right sweepers and measured high-speed peak pose use actual touch',async({browser})=>{
 const root='docs/evidence/v0.7d/regressions/v0.7c1/regressions/v0.7c';mkdirSync(root,{recursive:true});const context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true}),page=await context.newPage();
 await page.goto('/');await page.locator('#drive').click();await page.evaluate(()=>(window as any).__drive.manual(true));const touch=await touchDriver(page,context),course=await page.evaluate(()=>(window as any).__drive.challenges()),runs=[];
 for(const id of ['medium','high','extreme']){
  const c=course.find((c:any)=>c.id===id);await touch(null,false,false);await page.evaluate(d=>(window as any).__drive.reset({distance:d,speed:230/3.6}),id==='extreme'?c.start+c.transitionLength:c.start-80);const rows=[];
  for(let i=0;i<200;i++){const s=await page.evaluate(()=>(window as any).__drive.snapshot());if(id==='extreme'?s.elapsed>=.8:s.distance>=c.end+40)break;
   const need=await page.evaluate(()=>(window as any).__drive.steering().requiredSteer);await touch(id==='extreme'?1:Math.round(need*4)/4,true,false);await page.evaluate(()=>(window as any).__drive.advance(.05));rows.push(await page.evaluate(()=>(window as any).__drive.snapshot()));
  }
  expect(rows.every(s=>s.inputs.gas&&!s.inputs.brake&&!s.offRoad&&s.speed*3.6>=220)).toBe(true);
  if(id==='extreme'){expect(Math.max(...rows.map(s=>s.heading*180/Math.PI))).toBeGreaterThan(50);await page.screenshot({path:`${root}/peak-pose.png`});}
  else expect(rows.at(-1).distance).toBeGreaterThan(c.end);
  runs.push({id,rows});
 }
 writeFileSync(`${root}/full-gas-touch.json`,JSON.stringify(runs,null,2));await context.close();
});

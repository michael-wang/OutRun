import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.4.3';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const hard of [true,false]){
 const label=hard?'hard-detents':'soft-detents',context=await browser.newContext({viewport:{width:960,height:432},hasTouch:true,isMobile:true,recordVideo:{dir:root,size:{width:960,height:432}}}),page=await context.newPage();
 await page.goto('http://127.0.0.1:5173/?challenge=medium');await page.locator('#drive').click();await page.evaluate(hard=>{const g=window.__drive,c=g.challenges().find(c=>c.id==='medium');g.manual(true);g.reset({distance:c.start+c.transitionLength,speed:230/3.6});g.hardDetents(hard);},hard);
 const cdp=await context.newCDPSession(page),b=await page.locator('#steering-strip').boundingBox(),gas=await page.locator('[data-control=gas]').boundingBox();let began=false;const rows=[];
 for(let frame=0;frame<150;frame++){
  const t=frame/60,raw=t<.4?-.5:t<.6?-.75:t<1.1?-.5:t<1.2?0:t<1.6?-.5:0;
  const touchPoints=[{id:1,x:gas.x+gas.width/2,y:gas.y+gas.height/2},{id:2,x:b.x+b.width*(raw+1)/2,y:b.y+b.height/2}];
  await cdp.send('Input.dispatchTouchEvent',{type:began?'touchMove':'touchStart',touchPoints});began=true;
  await page.evaluate(()=>window.__drive.advance(1/60));rows.push(await page.evaluate(()=>window.__drive.snapshot()));await page.waitForTimeout(16);
 }
 await page.screenshot({path:`${root}/${label}.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${label}.webm`);unlinkSync(await video.path());writeFileSync(`${root}/${label}.json`,JSON.stringify({description:'Same current geometry and reference entry; hard mode reproduces v0.4.2 instantaneous correction only. Pose remains v0.4.3. Fixed 60Hz simulated time, trusted touch.',rows},null,2));
}
await browser.close();

import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {stageReady} from './stage-ready';
import {touchDriver} from './touch-driver';
const root='docs/evidence/v0.9-final-hud/after';
for(const width of [915,568])for(const swapped of [false,true])test(`public HUD and safe countdown ${width} swapped=${swapped}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:width===915?412:320},isMobile:true,hasTouch:true}),page=await context.newPage();
 await page.addInitScript(swapped=>{localStorage.setItem('first-drive-controls-swapped',String(swapped));Object.defineProperty(HTMLElement.prototype,'requestFullscreen',{value:undefined,configurable:true});},swapped);
 await page.goto('/');await stageReady(page);await page.locator('#l2-play').tap();
 await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:2750,speed:266/3.6});g.advance(.1);});
 for(const id of ['l2-praise','l2-issue','photo-button'])await expect(page.locator(`#${id}`)).toBeHidden();
 await expect(page.locator('#l2-hud')).toBeHidden();await expect(page.locator('#drive-hud')).toHaveText(/^0:00 · [1-9]\d* FPS$/);
 await expect(page.locator('#route-title')).toHaveText('10-Minute Road Trip');await expect(page.locator('#release-version')).toHaveText('v0.9-r1');
 for(const selector of ['#drive-hud','#route-name','#release-version']){
  const box=(await page.locator(selector).boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
  for(const target of ['#pause','#speed','#steering-strip','[data-control=gas]','[data-control=brake]']){const b=(await page.locator(target).boundingBox())!;expect(box.x<b.x+b.width&&b.x<box.x+box.width&&box.y<b.y+b.height&&b.y<box.y+box.height,selector+' clears '+target).toBe(false);}
 }
 const center=(await page.locator('#drive-hud').boundingBox())!;expect(center.x+center.width/2).toBeCloseTo(width/2,0);
 mkdirSync(root,{recursive:true});await page.screenshot({path:`${root}/public-${width}-${swapped}.png`});
 await page.evaluate(()=>{const g=(window as any).__drive;g.reset({distance:2750,speed:0});g.advance(33.1,{gas:false,brake:true,steer:0},false);});await expect(page.locator('#drive-hud')).toHaveText(/^0:33 · [1-9]\d* FPS$/);
 await page.screenshot({path:`${root}/timer-${width}-${swapped}.png`});
 await page.locator('#pause').tap();const frozen=await page.evaluate(()=>(window as any).__drive.snapshot().distance);
 await page.locator('#l2-play').tap();await expect(page.locator('#ready-countdown')).toBeVisible();
 for(const selector of ['#steering-strip','[data-control=gas]','[data-control=brake]'])await expect(page.locator(selector)).toBeVisible();
 const touch=await touchDriver(page,context);await touch(.8,true,true);
 await page.evaluate(()=>(window as any).__drive.advance(.2));
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().distance)).toBe(frozen);
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});
 await page.screenshot({path:`${root}/countdown-${width}-${swapped}.png`});await expect(page.locator('#ready-countdown')).toBeHidden({timeout:2200});
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs)).toEqual({gas:false,brake:false,steer:0});
 await touch(null,false,false);await touch(.8,true,false);await page.evaluate(()=>(window as any).__drive.advance(.1));expect(await page.evaluate(()=>(window as any).__drive.snapshot().inputs.gas)).toBe(true);await touch(null,false,false);
 // Blurring during a subsequent countdown still cancels resume.
 await page.locator('#pause').tap();await page.locator('#l2-play').tap();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#ready-countdown')).toBeHidden();await expect(page.locator('#touch')).toBeHidden();await expect(page.locator('#l2-play')).toBeVisible();
 await context.close();
});
test('production public and explicit QA entry retain feedback and camera',async({page})=>{
 for(const qa of [false,true]){
  await page.goto(`http://127.0.0.1:4173/${qa?'?qa=1':''}`);await page.locator('#l2-play').click();await expect(page.locator('#l2-lab')).toBeHidden();
  await expect(page.locator('#drive-hud')).toHaveText(/^\d+:\d{2} · [1-9]\d* FPS$/);await expect(page.locator('#release-version')).toBeVisible();
  for(const id of ['l2-praise','l2-issue','photo-button']){if(qa)await expect(page.locator(`#${id}`)).toBeVisible();else await expect(page.locator(`#${id}`)).toBeHidden();}
  if(qa){await page.locator('#photo-button').click();await expect(page.locator('#photo-status')).toBeVisible();await page.locator('#l2-praise').click();await expect(page.locator('#l2-feedback-dialog')).toBeVisible();}
 }
});

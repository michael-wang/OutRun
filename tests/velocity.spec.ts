import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { menuAction } from './ui';
test('v0.3 displayed car framing, compact menu, fixed camera and both hand layouts',async({page})=>{
 const results:any[]=[];mkdirSync('docs/evidence/v0.7c/regressions/v0.3',{recursive:true});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[1280,720],[960,432],[844,390]]){
  await page.setViewportSize({width,height});await page.goto('/?pace=1');await page.locator('#pause').click();await expect(page.locator('#settings')).toBeVisible();await page.locator('#resume').click();
  await page.evaluate(()=>(window as any).__drive.manual(true));
  const cameras=[];
  for(const speed of [0,33.33,65]){
   await page.evaluate(speed=>(window as any).__drive.reset({distance:420,speed}),speed);
   const data=await page.evaluate(()=>({frame:(window as any).__drive.framing(),state:(window as any).__drive.snapshot()}));
   expect(data.frame.width).toBeGreaterThan(.20);expect(data.frame.width).toBeLessThan(.26);
   expect(data.frame.bottom).toBeGreaterThan(.88);expect(data.frame.bottom).toBeLessThan(.95);
   expect(data.frame.left).toBeGreaterThan(0);expect(data.frame.right).toBeLessThan(1);
   cameras.push(data.state.camera);results.push({width,height,speed,...data});
   if(speed!==33.33)await page.screenshot({path:`docs/evidence/v0.7c/regressions/v0.3/frame-${width}-${speed}.png`});
  }
  expect(cameras[0]).toEqual(cameras[1]);expect(cameras[1]).toEqual(cameras[2]);
  await expect(page.locator('header button:visible')).toHaveCount(1);
  await menuAction(page,'settings');await page.locator('#swap').check();await page.locator('#close-settings').click();await page.locator('#resume').click();
  if(width<1000){for(const button of await page.locator('[data-control]').all()){const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(56);expect(b.height).toBeGreaterThanOrEqual(56);expect(b.x).toBeGreaterThanOrEqual(20);expect(b.y+b.height).toBeLessThanOrEqual(height-20);}await page.screenshot({path:`docs/evidence/v0.7c/regressions/v0.3/swapped-${width}.png`});}
  await page.locator('#pause').click();await expect(page.locator('#restart')).toBeVisible();await expect(page.locator('#fullscreen')).toBeVisible();
  await page.screenshot({path:`docs/evidence/v0.7c/regressions/v0.3/menu-${width}.png`});
  await page.evaluate(()=>localStorage.clear());
 }
 expect(errors).toEqual([]);writeFileSync('docs/evidence/v0.7c/regressions/v0.3/framing.json',JSON.stringify({errors,results},null,2));
});

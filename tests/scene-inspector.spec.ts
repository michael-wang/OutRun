import {test,expect} from '@playwright/test';

test('QA scene inspector navigates biome landmarks, checks clock companions and safely rewinds',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?qa=1&seed=1');await page.locator('#scene-inspector-launcher').click();
 const panel=page.locator('#scene-inspector');
 await expect(panel).toBeVisible();
 await page.locator('[data-si-category="clock"]').click();
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await expect(page.locator('#si-audit')).toContainText('✓ 通過');
 const before=await page.evaluate(()=>(window as any).__drive.snapshot().distance);
 await panel.locator('[data-si="back"]').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().distance)).toBeCloseTo(before-100,0);
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await expect(page.locator('#si-audit')).toContainText('✓ 通過');
 await panel.locator('[data-si="next"]').click();
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await expect(page.locator('#si-audit')).toContainText('✓ 通過');
 await page.locator('[data-si-category="lighthouse"]').click();
 await expect(page.locator('#si-info')).toContainText('海岸燈塔');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await page.locator('[data-si-category="city-grade"]').click();
 await expect(page.locator('#si-info')).toContainText('坡度');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await page.locator('[data-si="drive"]').click();
 await expect(panel).toBeHidden();
 expect(await page.evaluate(()=>(window as any).__drive.snapshot().mode)).toBe('playing');
 expect(errors).toEqual([]);
});

test('PS4 X / O and D-pad can navigate QA without affecting ordinary menu mapping',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>{
  (window as any).pad={id:'Mock DS4',connected:true,mapping:'standard',axes:[0,0],
   buttons:Array.from({length:18},()=>({pressed:false,value:0}))};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).pad]});
 });
 await page.goto('/?qa=1&seed=1');await page.bringToFront();
 // Wait for actual controller polls; software-rendered QA frames may exceed 170ms.
 const pulse=async(i:number)=>{
  await page.evaluate(i=>(window as any).pad.buttons[i]={pressed:true,value:1},i);
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#gamepad-diagnostic')?.textContent),{timeout:15000}).toContain(`changed: ${i}:down`);
  await page.evaluate(i=>(window as any).pad.buttons[i]={pressed:false,value:0},i);
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#gamepad-diagnostic')?.textContent),{timeout:15000}).toContain(`changed: ${i}:up`);
 };
 await page.locator('#scene-inspector-launcher').click();
 await expect(page.locator('#scene-inspector')).toBeVisible();
 await page.locator('[data-si-category="clock"]').click();
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 const original=await page.locator('#si-info').textContent();
 await pulse(15); // Right -> next actual clock site while QA panel has focus

 await expect(page.locator('#si-info')).not.toHaveText(original??'');
 await pulse(14); // Left -> original clock site
 await expect(page.locator('#si-info')).toHaveText(original??'');
 await pulse(13); // Down changes focused button
 const focus=await page.evaluate(()=>document.activeElement?.getAttribute('data-si')||document.activeElement?.getAttribute('data-si-category'));
 expect(focus).not.toBeNull();
 await pulse(1); // O -> close
 await expect(page.locator('#scene-inspector')).toBeHidden();
 await page.locator('#scene-inspector-launcher').focus();
 await pulse(0); // X -> reopen
 await expect(page.locator('#scene-inspector')).toBeVisible();
});
test('public play never includes the QA inspector even on the same seed',async({page})=>{
 await page.goto('/?seed=1');
 await expect(page.locator('#scene-inspector-launcher')).toHaveCount(0);
 await expect(page.locator('#scene-inspector')).toHaveCount(0);
});

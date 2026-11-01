import {test,expect} from '@playwright/test';

test('trip pause stays visually minimal, with full controls and review only on demand',async({page})=>{
 test.setTimeout(110000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?qa=1&seed=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:45000});
 await page.locator('#l2-play').click();
 await page.keyboard.press('KeyP');
 const dock=page.locator('#trip-pause-dock'),review=page.locator('#l2-lab');
 await expect(dock).toBeVisible();
 await expect(page.locator('#tp-actions')).toBeHidden();
 await expect(review).toBeHidden();
 const bounds=await dock.boundingBox();
 expect(bounds).not.toBeNull();expect(bounds!.width).toBeLessThan(310);
 expect(bounds!.x+bounds!.width).toBeLessThan(0.4*page.viewportSize()!.width);
 await dock.locator('#tp-more').click();
 await expect(page.locator('#tp-actions')).toBeVisible();
 await dock.locator('#tp-review').click();
 await expect(review).toBeVisible();await expect(review).toHaveClass(/trip-review-drawer/);
 const drawer=await review.boundingBox();
 expect(drawer).not.toBeNull();expect(drawer!.width).toBeLessThan(450);
 expect(drawer!.x+drawer!.width).toBeLessThan(.55*page.viewportSize()!.width);
 await dock.locator('#tp-more').click();
 await expect(review).toBeHidden();
 await dock.locator('#tp-more').click();
 await dock.locator('#tp-sound').click();
 await expect(dock.locator('#tp-sound')).toContainText('音效關');
 await dock.locator('#tp-settings').click();
 const prefs=page.locator('#preferences');
 await expect(prefs).toBeVisible();await expect(prefs).toHaveClass(/trip-settings-drawer/);
 expect((await prefs.boundingBox())!.width).toBeLessThan(400);
 await page.locator('#close-settings').click();
 await expect(dock).toBeVisible();
 await page.keyboard.press('KeyQ');
 await expect(page.locator('#scene-inspector')).toBeVisible();
 await expect(review).toBeHidden();
 await expect(page.locator('#tp-actions')).toBeHidden();
 await page.keyboard.press('KeyQ');
 await expect(page.locator('#scene-inspector')).toBeHidden();
 await page.keyboard.press('KeyP');
 await expect(dock).toBeHidden();
 // Q must also interrupt active driving and restore an unobscured paused road.
 await page.keyboard.press('KeyQ');
 await expect(page.locator('#scene-inspector')).toBeVisible();
 await expect(dock).toBeVisible();
 await expect(review).toBeHidden();
 await page.keyboard.press('KeyQ');
 await expect(page.locator('#scene-inspector')).toBeHidden();
 expect(errors).toEqual([]);
});

test('public trip pause keeps scenery visible without any QA controls',async({page})=>{
 await page.goto('/?seed=1&playerui=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:45000});
 await page.locator('#player-play').click();
 await page.keyboard.press('KeyP');
 await expect(page.locator('#trip-pause-dock')).toBeVisible();
 await expect(page.locator('#player-start')).toBeHidden();
 await expect(page.locator('#l2-lab')).toBeHidden();
 await expect(page.locator('#tp-review')).toBeHidden();
 await expect(page.locator('#scene-inspector')).toHaveCount(0);
 await page.keyboard.press('KeyQ');await expect(page.locator('#scene-inspector')).toHaveCount(0);
 await page.locator('#tp-resume').click();
 await expect(page.locator('#trip-pause-dock')).toBeHidden();
});

test('QA scene inspector navigates biome landmarks, checks clock companions and safely rewinds',async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?qa=1&seed=1');await page.locator('#scene-inspector-launcher').click();
 const panel=page.locator('#scene-inspector');
 await expect(panel).toBeVisible();
 await page.locator('[data-si-category="clock"]').click();
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await expect(page.locator('#si-audit')).toContainText('✓ 通過');
 const chaseCamera=await page.evaluate(()=>(window as any).__drive.snapshot().camera.position);
 await panel.locator('[data-si="view-side"]').click();
 await expect(panel.locator('[data-si="view-side"]')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().camera.position)).not.toEqual(chaseCamera);
 await panel.locator('[data-si="view-road"]').click();
 await expect(panel.locator('[data-si="view-road"]')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().camera.position)).toEqual(chaseCamera);
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
 // The additional camera control must also work through standard PS4 X.
 const chase=await page.evaluate(()=>(window as any).__drive.snapshot().camera.position);
 await page.locator('[data-si="view-side"]').focus();
 await pulse(0);
 await expect(page.locator('[data-si="view-side"]')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().camera.position)).not.toEqual(chase);
 await pulse(1); // O closes QA and restores normal driving camera
 await expect(page.locator('#scene-inspector')).toBeHidden();
 await page.locator('#scene-inspector-launcher').click();
 await expect(page.locator('[data-si="view-road"]')).toHaveAttribute('aria-pressed','true');
 await pulse(3); // Triangle -> close QA from the controller, without touching pause
 await expect(page.locator('#scene-inspector')).toBeHidden();
 await expect(page.locator('#trip-pause-dock')).toBeVisible();
 await pulse(3); // Triangle -> reopen QA directly from paused gameplay
 await expect(page.locator('#scene-inspector')).toBeVisible();
 await pulse(3); // Triangle -> close again
 await expect(page.locator('#scene-inspector')).toBeHidden();
 await pulse(13); // Down through ordinary paused-menu focus
 const dockFocus=await page.evaluate(()=>document.activeElement?.id);
 expect(['tp-resume','tp-more','scene-inspector-launcher']).toContain(dockFocus);
});
test('public play never includes the QA inspector even on the same seed',async({page})=>{
 await page.goto('/?seed=1');
 await expect(page.locator('#scene-inspector-launcher')).toHaveCount(0);
 await expect(page.locator('#scene-inspector')).toHaveCount(0);
});

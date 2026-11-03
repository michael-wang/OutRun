import {test,expect} from '@playwright/test';

test('QA camera and inspector actions share a tidy upper-right dock without overlap',async({page})=>{
 test.setTimeout(90000);
 await page.goto('/?qa=1&seed=1&streamhud=1');
 await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:45000});
 await page.locator('#l2-play').click();
 const tools=page.locator('#qa-tools'),qa=page.locator('#scene-inspector-launcher'),photo=page.locator('#photo-button');
 await expect(tools).toBeVisible();await expect(qa).toBeVisible();await expect(photo).toBeVisible();
 for(const size of [{width:1705,height:863},{width:915,height:412}]){
  await page.setViewportSize(size);
  const shell=await tools.boundingBox(),a=await qa.boundingBox(),b=await photo.boundingBox();
  expect(shell).not.toBeNull();expect(a).not.toBeNull();expect(b).not.toBeNull();
  expect(a!.x).toBeGreaterThan(shell!.x-1);
  expect(b!.x).toBeGreaterThan(shell!.x-1);
  expect(b!.y).toBeGreaterThan(a!.y+a!.height+3);
  expect(Math.abs(a!.x-b!.x)).toBeLessThan(2);
  expect(a!.x).toBeGreaterThan(size.width-185);
  expect(a!.x+a!.width).toBeLessThanOrEqual(size.width);
  const hud=page.locator('#stream-health-hud');
  await expect(hud).toBeVisible();
  const diagnostics=await hud.boundingBox();
  expect(diagnostics!.x+diagnostics!.width).toBeLessThanOrEqual(shell!.x+1);
  await page.keyboard.press('KeyQ');
  await expect(page.locator('#scene-inspector')).toBeVisible();
  const dialog=await page.locator('#scene-inspector').boundingBox();
  const moved=await hud.boundingBox();
  expect(moved!.x+moved!.width).toBeLessThanOrEqual(dialog!.x+1);
  await page.keyboard.press('KeyQ');
 }
});
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
 await expect(page.locator('#scene-inspector-launcher')).toHaveAttribute('data-key-hint','Q');
 expect(await page.locator('#scene-inspector-launcher').evaluate(e=>getComputedStyle(e,'::after').content)).toContain('Q');
 await expect(dock.locator('#tp-resume')).toHaveAttribute('data-key-hint','P');
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
 await page.locator('[data-si-category="junction"]').click();
 await expect(page.locator('[data-si-category="junction"]')).toContainText('匯入／出口 (2)');
 await expect(page.locator('#si-info')).toContainText('右側匯入道路');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await page.locator('[data-si="next"]').click();
 await expect(page.locator('#si-info')).toContainText('右側出口分岔');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 // R2.0: the authored canyon river bend has a reproducible inspector stop.
 await page.locator('[data-si-category="canyon-prototype"]').click();
 await expect(page.locator('[data-si-category="canyon-prototype"]')).toContainText('(1)');
 await expect(page.locator('#si-audit')).toContainText('Scenery Foundation R2.0');
 await expect(page.locator('#si-audit')).toContainText('固定世界高度');
 await expect(page.locator('#si-audit')).toContainText('Vista Reveal');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 // Scenery R1.0 exposes both landscape roles at the exact streamed road.
 await page.locator('[data-si-category="scenery-section"]').click();
 await expect(page.locator('[data-si-category="scenery-section"]')).toContainText('(32)');
 await expect(page.locator('#si-audit')).toContainText('Scenery Credibility R1.1');
 await expect(page.locator('#si-audit')).toContainText('左側：');
 await expect(page.locator('#si-audit')).toContainText('右側：');
 // The director's signed curvature and measured intensity are planned before QA.
 await page.locator('[data-si-category="scenic-beat"]').click();
 await expect(page.locator('[data-si-category="scenic-beat"]')).toContainText('(32)');
 await expect(page.locator('#si-audit')).toContainText('Scenic Director R1');
 await expect(page.locator('#si-audit')).toContainText('目標張力');
 await expect(page.locator('#si-audit')).toContainText('實測');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 // R0 is built from the same seed BEFORE gameplay, and QA merely navigates
 // the fixed inventory. The six feature kinds share one compact category.
 await page.locator('[data-si-category="road-feature"]').click();
 await expect(page.locator('#si-feature-filters')).toBeVisible();
 // A truthful seed may have zero long curves; do not fabricate one for QA.
 const longCurve=page.locator('[data-si-feature="long-curve"]');
 if(await longCurve.isEnabled()){
  await longCurve.click();
  await expect(longCurve).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#si-audit')).toContainText('長距離彎道');
  await expect(page.locator('#si-audit')).toContainText('Driving Intensity');
  await expect(page.locator('#si-audit')).toContainText('轉向需求峰值／平均');
  await expect(page.locator('#si-audit')).toContainText('累積轉角');
  await expect(page.locator('#si-info')).toContainText('張力');
  await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 }else await expect(longCurve).toContainText('(0)');
 await page.locator('[data-si-feature="merge"]').click();
 await expect(page.locator('#si-audit')).toContainText('4→5 車道');
 await expect(page.locator('#si-audit')).toContainText('Driving Intensity');
 await expect(page.locator('#si-audit')).toContainText('230 km/h');
 await expect(page.locator('#si-info')).toContainText('張力');
 await expect(page.locator('#si-info')).toContainText('車道匯入');
 await page.locator('[data-si-feature="exit"]').click();
 await expect(page.locator('#si-audit')).toContainText('5→4 車道');
 await expect(page.locator('#si-info')).toContainText('車道匯出');
 await page.locator('[data-si-category="city-grade"]').click();
 await expect(page.locator('#si-feature-filters')).toBeHidden();
 await expect(page.locator('#si-info')).toContainText('坡度');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 await page.locator('[data-si-category="canyon-arch"]').click();
 await expect(page.locator('#si-info')).toContainText('右側巨型砂岩拱門');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 const text=await page.locator('#si-info').textContent();
 const match=/拱門 · (\d+)m.*目前 (\d+)m/.exec(text??'');
 expect(match).not.toBeNull();
 expect(Number(match![1])-Number(match![2])).toBeGreaterThanOrEqual(140);
 expect(Number(match![1])-Number(match![2])).toBeLessThanOrEqual(400);
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
 await expect(page.locator('html')).toHaveAttribute('data-input-mode','gamepad');
 await expect(page.locator('#scene-inspector-launcher')).toHaveAttribute('data-pad-hint','△');
 expect(await page.locator('#scene-inspector-launcher').evaluate(e=>getComputedStyle(e,'::after').content)).toContain('△');
 await expect(page.locator('#tp-resume')).toHaveAttribute('data-pad-hint','OPTIONS');

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
 await page.locator('#tp-more').click(); // Expand ordinary pause commands
 await expect(page.locator('#tp-more')).toHaveAttribute('data-pad-hint','✕');
 await expect(page.locator('#tp-new-route')).toHaveAttribute('data-key-hint','N');
 await expect(page.locator('#tp-review')).toHaveAttribute('data-key-hint','V');
 await expect(page.locator('#tp-actions')).toBeVisible();
 await pulse(1); // PS4 O collapses extras without restarting or leaving pause
 await expect(page.locator('#tp-actions')).toBeHidden();
 await expect(page.locator('#trip-pause-dock')).toBeVisible();
});
test('public play never includes the QA inspector even on the same seed',async({page})=>{
 await page.goto('/?seed=1');
 await expect(page.locator('#scene-inspector-launcher')).toHaveCount(0);
 await expect(page.locator('#scene-inspector')).toHaveCount(0);
});


test('Designer’s Cut opens the fixed canyon without changing procedural 10m routes',async({page})=>{
 test.setTimeout(90000);
 const failures:string[]=[];page.on('pageerror',error=>failures.push(error.message));
 await page.goto('/?showcase=canyon&qa=1');
 await expect(page.locator('#stage-seed')).toHaveValue('CUT-CANYON-01');
 await expect(page.locator('#route-title')).toContainText('Grand Canyon');
 await page.waitForFunction(()=>(window as any).__drive?.streaming()?.fullyReady,null,{timeout:45000});
 await page.locator('#scene-inspector-launcher').click();
 await page.locator('[data-si-category="canyon-prototype"]').click();
 await expect(page.locator('#si-audit')).toContainText('大峽谷');
 await expect(page.locator('#si-status')).toContainText('已載入',{timeout:45000});
 expect(failures).toEqual([]);
});

test('Canyon Road Lock: eight manual beats, four lanes, no runtime Blender dependency',async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let askedForBlender=false;page.on('request',r=>{if(r.url().includes('/__local_art/'))askedForBlender=true;});
 await page.goto('/?showcase=canyon&road=lock&qa=1');
 await expect(page.locator('#stage-seed')).toHaveValue('CUT-CANYON-ROADLOCK-01');
 await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready,null,{timeout:45000});
 await expect(page.locator('[data-si-category="road-lock"]')).toHaveCount(1);
 await page.locator('#scene-inspector-launcher').click();
 await page.locator('[data-si-category="road-lock"]').click();
 await expect(page.locator('[data-si-category="road-lock"]')).toContainText('(8)');
 await expect(page.locator('#si-audit')).toContainText('Grand Canyon Road Lock');
 await expect(page.locator('#si-audit')).toContainText('四線道');
 const state=await page.evaluate(()=>({length:(window as any).__drive.brick().length,
  art:(window as any).__drive.blenderArt().status}));
 expect(state.length).toBe(5650);
 expect(state.art).toBe('disabled');
 expect(askedForBlender).toBe(false);
 expect(errors).toEqual([]);
});

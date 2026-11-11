import {test,expect,type Page} from '@playwright/test';

test.use({viewport:{width:915,height:412},isMobile:true,hasTouch:true,serviceWorkers:'block'});

async function enterReady(page:Page){
 await page.goto('/?trafficSeed=17');
 await page.locator('#boot-enter').tap();
 await page.locator('#start-race').tap();
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');
 await expect(page.locator('#race-start')).toBeVisible();
}
async function expectTouchCues(page:Page,highlighted:boolean){
 const controls=page.locator('#steering-strip, #touch button[data-control]');
 const outlines=await controls.evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).outlineStyle));
 expect(outlines).toEqual(Array(3).fill(highlighted?'solid':'none'));
 await expect(page.locator('.steer-directions span')).toHaveText(['<','>']);
 await expect(page.locator('.pedal-symbol')).toHaveText(['^','v']);
}
test('START pulses on the stationary grid and touch outlines last until GO',async({page})=>{
 test.setTimeout(180000);
 await enterReady(page);
 const before=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {distance:g.driveState().distance,clock:g.race().time,
   rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 expect(before.clock).toBe(0);
 expect(await page.locator('#touch').getAttribute('inert')).not.toBeNull();
 await expectTouchCues(page,true);
 await expect(page.locator('[data-control=gas]')).toHaveAttribute('aria-label','油門');
 expect(await page.locator('#race-start').evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('race-start-pulse');
 await page.screenshot({path:test.info().outputPath('ready-to-race-915x412.png')});
 await page.waitForTimeout(2200);
 await page.keyboard.press('Space');
 const after=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {distance:g.driveState().distance,clock:g.race().time,
   rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 expect(after).toEqual(before);
 await page.locator('#race-start').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 await expect(page.locator('#race-ready')).toBeHidden();
 await expectTouchCues(page,true);
 await page.screenshot({path:test.info().outputPath('countdown-915x412.png')});
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 await expectTouchCues(page,false);
 await page.screenshot({path:test.info().outputPath('driving-915x412.png')});
 const cues=await page.evaluate(()=>(window as any).__drive.snapshot().audio.raceStartCues);
 expect(cues).toEqual([3,2,1,'GO']);
});
test('keyboard Enter begins countdown and remapped hints follow their control',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('first-drive-controls-swapped','true'));
 await enterReady(page);
 await expect(page.locator('#touch')).toHaveClass(/swapped/);
 await expectTouchCues(page,true);
 const gas=await page.locator('[data-control=gas]').boundingBox();
 const steering=await page.locator('#steering-strip').boundingBox();
 expect(gas!.x+gas!.width).toBeLessThan(steering!.x);
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('#race-start').evaluate(el=>getComputedStyle(el,'::before').animationName)).toBe('none');
 await page.keyboard.press('Enter');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
});
test('replay waits for START again instead of launching automatically',async({page})=>{
 test.setTimeout(180000);
 await enterReady(page);
 await page.locator('#race-start').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.race().time)).toBeGreaterThan(1);
 await page.keyboard.up('Space');
 await page.locator('#pause').tap();
 await page.keyboard.press('KeyR');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:120000});
 await expect(page.locator('#race-start')).toBeVisible();
 const time=await page.evaluate(()=>(window as any).__drive.race().time);
 expect(time).toBe(0);
});

test('PS4 Cross confirms START without using throttle or a second focus click',async({page})=>{
 await page.addInitScript(()=>{
  const buttons=Array.from({length:18},()=>({pressed:false,value:0,touched:false}));
  const pad={id:'DualShock standard',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
  (window as any).__readyPad=pad;
 });
 await enterReady(page);
 await page.locator('#race-start').focus();
 // Allow the first gamepad poll to observe the neutral Cross button.
 await page.waitForTimeout(120);
 await page.evaluate(()=>{
  (window as any).__readyPad.buttons[0]={pressed:true,value:1,touched:true};
 });
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown',{timeout:5000});
});

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
test('loaded course waits indefinitely until START, with instructions beside real controls',async({page})=>{
 test.setTimeout(180000);
 await enterReady(page);
 const before=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {distance:g.driveState().distance,clock:g.race().time,
   rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 expect(before.clock).toBe(0);
 expect(await page.locator('#touch').getAttribute('inert')).not.toBeNull();
 await expect(page.locator('.race-control-tip-steering')).toBeVisible();
 await expect(page.locator('.race-control-tip-pedals')).toBeVisible();
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
 await expect(page.locator('.race-control-tip-steering')).toBeHidden();
 await expect(page.locator('.race-control-tip-pedals')).toBeHidden();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
 const cues=await page.evaluate(()=>(window as any).__drive.snapshot().audio.raceStartCues);
 expect(cues).toEqual([3,2,1,'GO']);
});
test('keyboard Enter begins countdown and remapped hints follow their control',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('first-drive-controls-swapped','true'));
 await enterReady(page);
 await expect(page.locator('#touch')).toHaveClass(/swapped/);
 const pedalHelp=await page.locator('.race-control-tip-pedals').boundingBox();
 const steerHelp=await page.locator('.race-control-tip-steering').boundingBox();
 expect(pedalHelp&&steerHelp).toBeTruthy();
 expect(pedalHelp!.x).toBeLessThan(steerHelp!.x);
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

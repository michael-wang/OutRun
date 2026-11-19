import {test,expect,type Page} from '@playwright/test';
const flags='';
async function open(page:Page,at?:number){
 await page.addInitScript(()=>{const w=window as any;w.__pad={id:'QA standard',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>w.__pad.connected?[w.__pad]:[]});});
 await page.goto('/?'+flags+(at===undefined?'':'&at='+at));if(at!==undefined){await running(page);return;}if(await page.locator('#boot-enter').isVisible())await page.locator('#boot-enter').click();await page.locator('#start-race').click();await ready(page);
 expect(await page.evaluate(()=>(window as any).__drive.optionB().state)).toBe('ready');expect(await page.evaluate(()=>(window as any).__drive.macroInspect().beachLife)).toBe(true);
}
async function running(page:Page){await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:90000});await expect(page.locator('#game-loading')).toBeHidden();}
async function ready(page:Page){await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:60000});await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});await expect(page.locator('#race-start')).toBeVisible();}
async function pulse(page:Page,n:number){await page.evaluate(n=>(window as any).__pad.buttons[n].pressed=true,n);await page.waitForTimeout(80);await page.evaluate(n=>(window as any).__pad.buttons[n].pressed=false,n);await page.waitForTimeout(80);}
async function play(page:Page){await page.locator('#race-start').click();await running(page);}
for(const at of [undefined,4000])test('restart preserves original station and launch mode '+at,async({page},info)=>{
 test.setTimeout(180000);await open(page,at);
 const launch=async()=>{if(at===undefined)await play(page);else await running(page);};
 const reset=async()=>{
  if(at===undefined){await ready(page);await page.waitForTimeout(600);await ready(page);}
  else await running(page);
  expect(await page.evaluate(()=>(window as any).__drive.snapshot().distance)).toBe(at??350);
  expect(new URL(page.url()).searchParams.get('at')).toBe(at===undefined?null:String(at));
 };
 await launch();await page.keyboard.down('Space');await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().speed)).toBeGreaterThan(3);await page.keyboard.up('Space');await page.locator('#pause').click();await page.locator('#tp-restart').click();await reset();
 await launch();await page.locator('#pause').click();await page.keyboard.press('r');await reset();
 await launch();await page.evaluate(()=>{const g=(window as any).__drive;g.manual(true);g.reset({distance:14549,speed:40});g.advance(.2,{gas:true,brake:false,steer:0});g.manual(false);});await expect(page.locator('#result-replay')).toBeVisible();await page.locator('#result-replay').click();await reset();
});
test('pause navigation works across stick/D-pad/mouse, held confirm and reconnect',async({page},info)=>{
 test.setTimeout(180000);await open(page);await play(page);await page.evaluate(()=>(window as any).__pad.axes[0]=.72);await pulse(page,9);await expect(page.locator('#tp-resume')).toBeFocused();
 await page.evaluate(()=>(window as any).__pad.axes[1]=1);await expect(page.locator('#tp-restart')).toBeFocused();await page.evaluate(()=>(window as any).__pad.axes.fill(0));await page.waitForTimeout(80);
 // Hold confirm through replay loading. It must not activate START on return.
 await page.evaluate(()=>(window as any).__pad.buttons[0].pressed=true);await ready(page);await page.waitForTimeout(1000);await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');expect(await page.evaluate(()=>(window as any).__drive.snapshot().distance)).toBe(350);await page.evaluate(()=>(window as any).__pad.buttons[0].pressed=false);await page.waitForTimeout(100);await pulse(page,0);await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await pulse(page,9);await pulse(page,13);await expect(page.locator('#tp-restart')).toBeFocused();await pulse(page,13);await pulse(page,13);await expect(page.locator('#tp-more')).toBeFocused();await pulse(page,0);await expect(page.locator('#tp-settings')).toBeFocused();await pulse(page,1);await expect(page.locator('#tp-more')).toBeFocused();
 await page.locator('#tp-resume').click();await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');await page.locator('#pause').click();await expect(page.locator('#tp-resume')).toBeFocused();await pulse(page,13);await expect(page.locator('#tp-restart')).toBeFocused();await expect(page.locator('#tp-restart')).toHaveCSS('outline-style','solid');
 // Simulated blur lifecycle: headless Chrome keeps both QA tabs focused (see probe evidence).
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));(window as any).__pad.buttons[0].pressed=true;});await page.waitForTimeout(200);await expect(page.locator('html')).toHaveAttribute('data-drive-mode','paused');await page.evaluate(()=>(window as any).__pad.buttons[0].pressed=false);await page.waitForTimeout(80); await page.evaluate(()=>(window as any).__pad.connected=false);await page.waitForTimeout(100);await page.evaluate(()=>{(window as any).__pad.buttons[0].pressed=true;(window as any).__pad.connected=true;});await page.waitForTimeout(200);await expect(page.locator('html')).toHaveAttribute('data-drive-mode','paused');await page.evaluate(()=>(window as any).__pad.buttons[0].pressed=false);await page.waitForTimeout(80);await pulse(page,12);await expect(page.locator('#tp-resume')).toBeFocused();
 await page.screenshot({path:info.outputPath('pause-gamepad-recovered.png')});await pulse(page,0);await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.evaluate(()=>(window as any).__pad.axes[2]=1);await expect.poll(()=>page.evaluate(()=>(window as any).__drive.cameraOrbit().angle)).toBeGreaterThan(.4);await page.evaluate(()=>(window as any).__pad.axes[2]=0);await pulse(page,11);expect(await page.evaluate(()=>(window as any).__drive.cameraOrbit().angle)).toBe(0);await pulse(page,17);await expect(page.locator('#photo-status')).toContainText('Saved');
 await page.evaluate(()=>(window as any).__pad.buttons=(window as any).__pad.buttons.slice(0,17));await pulse(page,10);await expect(page.locator('#photo-status')).toContainText('Saved');
});

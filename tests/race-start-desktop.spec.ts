import {test,expect,type Page} from '@playwright/test';

test.use({viewport:{width:1440,height:810},serviceWorkers:'block'});

async function openCoast(page:Page){
 await page.goto('/?trafficSeed=17');
 await page.locator('#start-race').click();
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');
}

test('desktop fast loading never bypasses explicit START, even through old Play actions',async({page})=>{
 test.setTimeout(180000);
 await openCoast(page);
 await expect(page.locator('#race-start')).toBeVisible();
 const original=await page.evaluate(()=>({time:(window as any).__drive.race().time,
  rivals:(window as any).__drive.race().rivals.map((r:any)=>r.distance)}));
 expect(original.time).toBe(0);
 // Previously a fast desktop loading callback could invoke start() from menu.
 await page.evaluate(()=>{
  document.getElementById('l2-play')?.click();
  document.getElementById('drive')?.click();
 });
 await page.waitForTimeout(1800);
 expect(await page.locator('html').getAttribute('data-drive-mode')).toBe('ready');
 expect(await page.evaluate(()=>(window as any).__drive.race().time)).toBe(0);
 expect((await page.evaluate(()=>(window as any).__drive.race().rivals.map((r:any)=>r.distance)))).toEqual(original.rivals);
 await page.screenshot({path:test.info().outputPath('desktop-ready-1440x810.png')});
 await page.locator('#race-start').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:10000});
});

test('a deliberately delayed road build also stops on START, not on a countdown',async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker{
   postMessage(message:any,transfer?:Transferable[]){
    if(message.type==='init'){
     (window as any).__releaseRoad=()=>super.postMessage(message,transfer);return;
    }
    super.postMessage(message,transfer);
   }
  } as typeof Worker;
 });
 await page.goto('/?trafficSeed=17');
 await page.locator('#start-race').click();
 await expect(page.locator('#game-loading')).toBeVisible();
 await page.waitForFunction(()=>!!(window as any).__releaseRoad,null,{timeout:60000});
 await page.waitForTimeout(500);
 expect(await page.locator('#race-start').isVisible()).toBe(false);
 await page.evaluate(()=>(window as any).__releaseRoad());
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await expect(page.locator('#race-start')).toBeVisible();
 await page.waitForTimeout(1200);
 expect(await page.locator('html').getAttribute('data-drive-mode')).toBe('ready');
 expect(await page.evaluate(()=>(window as any).__drive.race().time)).toBe(0);
 await page.keyboard.press('Enter');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
});


test('a held controller Cross from stage selection does not count as a second START',async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  const buttons=Array.from({length:18},()=>({pressed:false,value:0,touched:false}));
  const pad={id:'DualShock standard',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons};
  Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});
  (window as any).__stagePad=pad;
 });
 await page.goto('/?trafficSeed=17');
 await expect(page.locator('#racing-menu')).toBeVisible();
 // Allow the menu pad to sample neutral Cross once.
 await page.waitForTimeout(160);
 await page.evaluate(()=>{
  (window as any).__stagePad.buttons[0]={pressed:true,value:1,touched:true};
 });
 await expect(page.locator('#game-loading')).toBeVisible({timeout:15000});
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');
 await page.waitForTimeout(250);
 expect(await page.locator('html').getAttribute('data-drive-mode')).toBe('ready');
 expect(await page.evaluate(()=>(window as any).__drive.race().time)).toBe(0);
 await page.evaluate(()=>{
  (window as any).__stagePad.buttons[0]={pressed:false,value:0,touched:false};
 });
 await page.waitForTimeout(100);
 await page.evaluate(()=>{
  (window as any).__stagePad.buttons[0]={pressed:true,value:1,touched:true};
 });
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown',{timeout:5000});
});

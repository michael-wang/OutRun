import {test,expect} from '@playwright/test';

test('the public coast starts automatically at zero speed with its approved HUD',async({browser})=>{
 const context=await browser.newContext({viewport:{width:896,height:414},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();
  await page.goto('/?at=850&trafficSeed=1234');
  await page.locator('#start-race').click();
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await expect(page.locator('#view canvas')).toBeVisible();
  await expect(page.locator('#player-start')).toBeHidden({timeout:60000});
  await expect(page.locator('#speed')).toBeVisible();
  const state=await page.evaluate(()=>(window as any).__drive.snapshot());
  expect(state.mode).toBe('playing');
  expect(state.speed).toBe(0);
  expect(state.distance).toBe(850);
  await expect(page.locator('#stage-seed')).toBeHidden();
  await expect(page.locator('#l2-export')).toBeHidden();
  await expect(page.locator('#l2-next')).toBeHidden();
  await expect(page.locator('#results-menu')).toBeHidden();
 }finally{await context.close();}
});

test('portrait waits for landscape, then launches automatically without tapping Play',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();
  await page.goto('/');
  await page.locator('#start-race').click();
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await expect(page.locator('#rotate')).toBeVisible();
  await expect(page.locator('#player-start')).toBeHidden();
  await expect(page.locator('#rotate-fullscreen')).toBeHidden();
  await expect(page.locator('#l2-lab')).toBeHidden();
  const style=await page.locator('#rotate').evaluate(el=>({backgroundColor:getComputedStyle(el).backgroundColor,backgroundImage:getComputedStyle(el).backgroundImage}));
  expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(style.backgroundImage).toContain('linear-gradient');
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#rotate')).toBeHidden({timeout:60000});
  await expect(page.locator('#player-start')).toBeHidden({timeout:60000});
  await expect.poll(()=>page.evaluate(()=>(window as any).__drive?.snapshot()?.mode)).toBe('playing');
 }finally{await context.close();}
});

test('diagnostic at= coordinate starts stationary with the public driving HUD',async({page})=>{
 await page.goto('/?at=1360&trafficSeed=2026');
  await page.locator('#start-race').click();
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
 await expect(page.locator('#player-start')).toBeHidden({timeout:60000});
 const state=await page.evaluate(()=>(window as any).__drive.snapshot());
 expect(state.mode).toBe('playing');
 expect(state.distance).toBe(1360);
 expect(state.speed).toBe(0);
 await expect(page.locator('#drive-distance')).toHaveText('1,360 m');
 await expect(page.locator('#qa-tools')).toBeHidden();
});

test('iPhone landscape also auto-launches, with no inert fullscreen button',async({browser})=>{
 const ua='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
 const context=await browser.newContext({viewport:{width:896,height:414},isMobile:true,hasTouch:true,userAgent:ua});
 await context.addInitScript(()=>{
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false});
  Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
 });
 try{
  const page=await context.newPage();
  await page.goto('/');
  await page.locator('#start-race').click();
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await expect(page.locator('#player-start')).toBeHidden({timeout:60000});
  await expect(page.locator('#player-install-guide')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toBeHidden();
  await expect(page.locator('#speed')).toBeVisible();
 }finally{await context.close();}
});

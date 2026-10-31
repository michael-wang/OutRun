import {test,expect} from '@playwright/test';

test('player-first Trip opening uses approved artwork and QA hidden',async({browser})=>{
 const context=await browser.newContext({viewport:{width:896,height:414},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();
  await page.goto('/?seed=1&playerui=1');
  await expect(page.locator('#view canvas')).toBeVisible();
  await expect(page.locator('#player-start')).toBeVisible();
  await expect(page.locator('#l2-lab')).toBeHidden();
  await expect(page.locator('#player-play')).toBeVisible();
  await expect(page.locator('#player-play')).toContainText('Start driving');
  await expect(page.locator('#stage-seed')).toBeHidden();
  await expect(page.locator('#l2-export')).toBeHidden();
  await expect(page.locator('#l2-difficulty')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toBeHidden();
  await expect(page.locator('#player-options')).toBeVisible();
  await expect(page.locator('#player-sound')).toBeVisible();
  await page.locator('#player-play').tap();
  await expect(page.locator('#player-start')).toBeHidden({timeout:45000});
  await expect(page.locator('#view canvas')).toBeVisible();
  await expect(page.locator('#speed')).toBeVisible();
 }finally{await context.close();}
});

test('portrait shows transparent rotation cue over artwork, not QA or opaque screen',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();
  await page.goto('/?seed=1&playerui=1');
  await expect(page.locator('#view canvas')).toBeVisible();
  await expect(page.locator('#rotate')).toBeVisible();
  await expect(page.locator('#player-start')).toBeHidden();
  await expect(page.locator('#rotate-fullscreen')).toBeHidden();
  await expect(page.locator('#rotate-pause')).toBeHidden();
  await expect(page.locator('#l2-lab')).toBeHidden();
  const style=await page.locator('#rotate').evaluate(el=>({backgroundColor:getComputedStyle(el).backgroundColor,backgroundImage:getComputedStyle(el).backgroundImage}));
  expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(style.backgroundImage).toContain('linear-gradient');
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#rotate')).toBeHidden();
  await expect(page.locator('#player-start')).toBeVisible();
 }finally{await context.close();}
});

test('QA mode retains full authoring controls and does not show player menu',async({page})=>{
 await page.goto('/?qa=1&seed=1');
 await expect(page.locator('#l2-lab')).toBeVisible();
 await expect(page.locator('#stage-seed')).toBeVisible();
 await expect(page.locator('#l2-export')).toBeVisible();
 await expect(page.locator('#player-start')).toBeHidden();
});

test('public iPhone entry stays minimal without an inert fullscreen button',async({browser})=>{
 const ua='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';
 const context=await browser.newContext({viewport:{width:896,height:414},isMobile:true,hasTouch:true,userAgent:ua});
 await context.addInitScript(()=>{
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false});
  Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
 });
 try{
  const page=await context.newPage();
  await page.goto('/?seed=1&playerui=1');
  await expect(page.locator('#player-start')).toBeVisible();
  await expect(page.locator('#player-install-guide')).toBeHidden();
  await expect(page.locator('#player-install-help')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toBeHidden();
 }finally{await context.close();}
});

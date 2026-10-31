import {test,expect,type Browser} from '@playwright/test';

const iphoneUA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

async function iphonePage(browser:Browser,standalone=false){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:iphoneUA});
 await context.addInitScript((asApp:boolean)=>{
  Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false});
  Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
  if(asApp)Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
 },standalone);
 const page=await context.newPage();
 await page.goto('/?seed=1');
 return {page,context};
}

test('iPhone Safari: explain manual rotation and Home Screen instead of dead fullscreen',async({browser})=>{
 const {page,context}=await iphonePage(browser);
 try {
  await expect(page.locator('#rotate')).toBeVisible();
  await expect(page.locator('#rotate-iphone-hint')).toContainText('Add to Home Screen');
  await expect(page.locator('#rotate-fullscreen')).toBeHidden();
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#rotate')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toHaveText('Fullscreen help');
  await page.locator('#l2-fullscreen').click();
  await expect(page.locator('#l2-iphone-fullscreen-hint')).toContainText('Safari');
  await expect(page.locator('#l2-iphone-fullscreen-hint')).toBeVisible();
  await page.locator('#l2-play').click();
  await expect(page.locator('#immersive-note')).toBeHidden();
 } finally {await context.close();}
});

test('iPhone standalone Web App: do not offer browser fullscreen or install hints',async({browser})=>{
 const {page,context}=await iphonePage(browser,true);
 try {
  await expect(page.locator('#rotate-iphone-hint')).toBeHidden();
  await expect(page.locator('#rotate-fullscreen')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toBeHidden();
 } finally {await context.close();}
});

test('other touch browsers retain the existing fullscreen entry point',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'});
 try {
  const page=await context.newPage();
  await page.goto('/?seed=1');
  await expect(page.locator('#rotate-fullscreen')).toBeVisible();
  await expect(page.locator('#rotate-iphone-hint')).toBeHidden();
  await expect(page.locator('#l2-fullscreen')).toHaveText('Fullscreen');
 } finally {await context.close();}
});

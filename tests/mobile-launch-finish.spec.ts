import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const site=new URL(process.env.OUTRUN_SITE_BASE??'/','http://127.0.0.1:4173');
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});

test('portrait handoff keeps the artwork and progress anchor, then exports the finished drive in fullscreen',async({page})=>{
  test.setTimeout(180000);
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*.js',async route=>{await held;await route.continue();});
  await page.goto(new URL('?at=10300&fpsdiag=1',site).href,{waitUntil:'commit'});
  const loading=page.locator('#game-loading');
  await expect(loading).toBeVisible();
  const progress=await page.locator('#loading-track').boundingBox();
  const art=await loading.evaluate(el=>({
    url:el.querySelector('img')!.currentSrc,
    position:getComputedStyle(el.querySelector('img')!).objectPosition,
    shade:getComputedStyle(el,'::after').backgroundImage,
  }));
  release();
  await expect(loading).toBeHidden({timeout:90000});
  const launch=page.getByRole('button',{name:'開始駕駛!',exact:true});
  await expect(launch).toBeVisible();
  const ready=await page.locator('#startup-art').evaluate(el=>({
    url:el.querySelector('img')!.currentSrc,
    position:getComputedStyle(el.querySelector('img')!).objectPosition,
    shade:getComputedStyle(el,'::after').backgroundImage,
  }));
  expect(ready).toEqual(art);
  expect(ready.shade).toContain('gradient');
  const box=await launch.boundingBox();
  expect(Math.abs((box!.y+box!.height)-(progress!.y+progress!.height))).toBeLessThan(2);
  await launch.tap();
  await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.id)).toBe('app');
  // Chromium emulates touch and fullscreen. Set the viewport to model physical rotation.
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#touch')).toHaveClass(/active/,{timeout:30000});
  await page.keyboard.down('Space');
  const results=page.getByRole('region',{name:'旅程結算'});
  try{await expect(results).toBeVisible({timeout:60000});}
  finally{await page.keyboard.up('Space');}
  const button=results.getByRole('button',{name:'匯出 FPS 診斷 JSON'});
  await expect(button).toBeInViewport({ratio:1});
  expect(await button.evaluate(el=>document.fullscreenElement?.contains(el))).toBe(true);
  const download=page.waitForEvent('download');
  await button.tap();
  const file=await download;
  expect(file.suggestedFilename()).toMatch(/^outrun-fps-.*\.json$/);
  const report=JSON.parse(await readFile((await file.path())!,'utf8'));
  expect(report.kind).toBe('outrun-drive-fps-diagnostic-v1');
  expect(report.seconds.length).toBeGreaterThan(0);
  expect(await page.evaluate(()=>document.fullscreenElement?.id)).toBe('app');
});

test('manual rotation starts driving when fullscreen is denied',async({page})=>{
  await page.addInitScript(()=>{
    Element.prototype.requestFullscreen=async()=>{throw new Error('Fullscreen denied');};
  });
  await page.goto(site.href);
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await page.locator('#rotate-launch').tap();
  await expect(page.locator('#rotate-launch-status')).toContainText('請手動橫放手機');
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#touch')).toHaveClass(/active/,{timeout:30000});
  await expect(page.locator('#drive-fps-diagnostic')).toHaveCount(0);
});

test('iPhone portrait offers manual rotation and starts in landscape',async({browser})=>{
  const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  });
  try{
    const page=await context.newPage();
    await page.goto(site.href);
    await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
    await expect(page.locator('#rotate-instruction')).toContainText('請將手機轉為橫向');
    await expect(page.locator('#rotate-launch')).toBeHidden();
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#touch')).toHaveClass(/active/,{timeout:30000});
  }finally{await context.close();}
});

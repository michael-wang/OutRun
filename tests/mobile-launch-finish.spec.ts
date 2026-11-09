import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const site=new URL(process.env.OUTRUN_SITE_BASE??'/','http://127.0.0.1:4173');
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});

test('portrait reveals the parked car before one-tap driving and fullscreen results',async({page})=>{
  test.setTimeout(180000);
  let release!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/*.js',async route=>{await held;await route.continue();});
  await page.goto(new URL('?at=10300&fpsdiag=1',site).href,{waitUntil:'commit'});
  const loading=page.locator('#game-loading');
  await expect(loading).toBeVisible();
  const progress=await page.locator('#loading-track').boundingBox();
  await expect(loading.locator('img')).toBeVisible();
  release();
  await expect(loading).toBeHidden({timeout:90000});
  const launch=page.getByRole('button',{name:'開始駕駛!',exact:true});
  await expect(launch).toBeVisible();
  await expect(page.getByRole('heading',{name:'極速漫遊',exact:true})).toBeVisible();
  await expect(page.locator('.portrait-brand p')).toHaveText('海濱公路');
  const hint=page.locator('#rotate-instruction');
  await expect(hint).toBeVisible();
  await expect(page.locator('#startup-art')).toBeHidden();
  await expect(page.locator('#view canvas')).toBeInViewport({ratio:1});
  await expect(page.locator('html')).toHaveAttribute('data-drive-mode','menu');
  await expect(page.locator('#drive-distance')).toHaveText('10,300 m');
  const box=await launch.boundingBox();
  expect(Math.abs((box!.y+box!.height)-(progress!.y+progress!.height))).toBeLessThan(2);
  const hintBox=await hint.boundingBox();
  expect(hintBox!.y).toBeGreaterThan(box!.y+box!.height);
  expect(hintBox!.y+hintBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
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

test('manual rotation starts driving when fullscreen is denied',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    Element.prototype.requestFullscreen=async()=>{throw new Error('Fullscreen denied');};
  });
  await page.goto(site.href);
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await page.screenshot({path:testInfo.outputPath('portrait-ready.png')});
  await page.locator('#rotate-launch').tap();
  await expect(page.locator('#rotate-launch-status')).toContainText('請手動橫放手機');
  await expect(page.locator('#immersive-note')).toBeHidden();
  await expect(page.locator('#rotate-instruction')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-drive-mode','menu');
  await expect(page.locator('#startup-art')).toBeHidden();
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#touch')).toHaveClass(/active/,{timeout:30000});
  await expect(page.locator('#drive-fps-diagnostic')).toHaveCount(0);
});

test('a denied orientation lock leaves a single Chinese hint in portrait',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(screen.orientation,'lock',{value:async()=>{throw new Error('Orientation denied');}});
  });
  await page.goto(site.href);
  await expect(page.locator('#game-loading')).toBeHidden({timeout:90000});
  await page.locator('#rotate-launch').tap();
  await expect(page.locator('#rotate-launch-status')).toHaveText('請手動橫放手機，即可出發。');
  await expect(page.locator('#immersive-note')).toBeHidden();
  await expect(page.locator('#rotate-immersive-error')).toBeHidden();
  await expect(page.locator('#rotate-instruction')).toBeHidden();
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
    await expect(page.locator('#rotate-instruction')).toHaveText('橫放手機即可出發。');
    await expect(page.locator('#startup-art')).toBeHidden();
    await expect(page.locator('#rotate-launch')).toBeHidden();
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#touch')).toHaveClass(/active/,{timeout:30000});
  }finally{await context.close();}
});

import {test,expect} from '@playwright/test';

test('public game, pause and controls use Traditional Chinese without exposing QA',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?playerui=1');
  await expect(page.locator('#player-title')).toHaveText('極速漫遊');
  await expect(page.locator('#player-subtitle')).toHaveText('公路冒險');
  await expect(page.locator('#player-play')).toHaveText('開始駕駛');
  await expect(page.locator('#player-options')).toHaveText('操作設定');
  await expect(page.locator('#player-sound')).toHaveText('音效開');
  await expect(page.locator('#l2-lab')).toBeHidden();
  await page.locator('#player-options').click();
  await expect(page.locator('#preferences h2')).toHaveText('操作設定');
  await expect(page.locator('#close-settings')).toHaveText('完成');
  await page.locator('#close-settings').click();
  await page.locator('#player-sound').click();
  await expect(page.locator('#player-sound')).toHaveText('音效關');
  await page.locator('#player-sound').click();
  await expect(page.locator('#player-sound')).toHaveText('音效開');
  await expect(page.locator('#player-play')).toBeEnabled({timeout:45000});
  await page.locator('#player-play').click();
  await expect(page.locator('#player-start')).toBeHidden();
  await expect(page.locator('#pause')).toContainText('暫停');
  await page.locator('#pause').click();
  await expect(page.locator('#player-title')).toHaveText('暫停中');
  await expect(page.locator('#player-play')).toHaveText('繼續駕駛');
  await expect(page.locator('#player-restart')).toHaveText('重新開始');
  expect(errors).toEqual([]);
});

test('portrait public start shows Chinese rotation copy over approved portrait art',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{
    const page=await context.newPage();await page.goto('/?playerui=1');
    await expect(page.locator('#rotate')).toContainText('橫放手機，準備出發！');
    await expect(page.locator('#rotate')).toContainText('請將手機轉為橫向');
    await expect(page.locator('#startup-art')).toBeVisible();
    await expect(page.locator('#rotate-fullscreen')).toBeHidden();
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#rotate')).toBeHidden();
    await expect(page.locator('#player-title')).toHaveText('極速漫遊');
  }finally{await context.close();}
});

test('QA visual feedback: braking and actual upshift do not change driving logic',async({page})=>{
  await page.goto('/?qa=1');
  await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);
  const results=await page.evaluate(()=>{
    const drive=(window as any).__drive;
    drive.manual(true);
    drive.reset({distance:350,speed:49/3.6});
    const before=drive.brakeLights();
    const initial=drive.exhaust();
    drive.advance(.12,{gas:false,brake:true,steer:0});
    const braking=drive.brakeLights();
    drive.advance(.12,{gas:false,brake:false,steer:0});
    const released=drive.brakeLights();
    drive.reset({distance:350,speed:49/3.6});
    drive.advance(.4,{gas:true,brake:false,steer:0});
    const shifted=drive.snapshot(),burst=drive.exhaust();
    drive.advance(.65,{gas:false,brake:false,steer:0});
    const faded=drive.exhaust();
    return {before,initial,braking,released,gear:shifted.gear,burst,faded};
  });
  expect(results.before.braking).toBe(false);
  expect(results.braking.braking).toBe(true);
  expect(results.braking.emissiveIntensity).toBeGreaterThan(results.before.emissiveIntensity*4);
  expect(results.released.braking).toBe(false);
  expect(results.initial.bursts).toBe(0);
  expect(results.gear).toBe(2);
  expect(results.burst.bursts).toBe(1);
  expect(results.burst.flames).toBe(2);
  expect(results.burst.capacity).toBeLessThanOrEqual(20);
  expect(results.faded.flames).toBe(0);
  expect(results.faded.smoke).toBe(0);
});

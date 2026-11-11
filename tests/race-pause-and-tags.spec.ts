import {test,expect,type Page} from '@playwright/test';

test.use({viewport:{width:915,height:412},isMobile:true,hasTouch:true,serviceWorkers:'block'});

async function ready(page:Page,query='trafficSeed=17'){
 await page.goto('/?'+query);
 await page.locator('#boot-enter').tap();
 await page.locator('#start-race').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready',{timeout:120000});
 await expect(page.locator('#game-loading')).toBeHidden({timeout:120000});
 await page.locator('#race-start').tap();
}

test('pause freezes countdown numeral, HUD, control instructions and all vehicle positions',async({page})=>{
 test.setTimeout(180000);
 await ready(page);
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 const shown=page.locator('#ready-countdown');
 await expect(shown).toBeVisible();
 await page.locator('#pause').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','paused');
 await expect(page.locator('html')).toHaveAttribute('data-race-paused-phase','countdown');
 const before=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {time:g.race().time,countdown:g.race().countdown,
   number:document.getElementById('ready-countdown')!.textContent,
   player:g.driveState().distance,rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 await expect(page.locator('#trip-pause-dock')).toBeVisible();
 await expect(page.locator('#race-position')).toBeVisible();
 await expect(page.locator('#ready-countdown')).toBeVisible();
 await expect(page.locator('.control-cue:visible')).toHaveCount(3);
 await expect(page.locator('.control-cue').first()).toHaveCSS('animation-play-state','paused');
 await page.screenshot({path:test.info().outputPath('countdown-paused-controls-intact.png')});
 await page.waitForTimeout(1200);
 const after=await page.evaluate(()=>{
  const g=(window as any).__drive;
  return {time:g.race().time,countdown:g.race().countdown,
   number:document.getElementById('ready-countdown')!.textContent,
   player:g.driveState().distance,rivals:g.race().rivals.map((r:any)=>r.distance)};
 });
 expect(after).toEqual(before);
 await page.locator('#tp-resume').tap();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 await expect(page.locator('html')).not.toHaveAttribute('data-race-paused-phase',/countdown/);
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:process.env.CI?90000:10000});
});

test('pause in a running race keeps the live HUD and place markers visible',async({page})=>{
 test.setTimeout(180000);
 await ready(page);
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:process.env.CI?90000:10000});
 await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.race().time)).toBeGreaterThan(.8);
 await page.keyboard.up('Space');
 const hud=page.locator('#race-position');
 const rank=await hud.locator('.race-hud-rank').innerText();
 await page.locator('#pause').tap();
 await expect(page.locator('html')).toHaveAttribute('data-race-paused-phase','playing');
 await expect(hud).toBeVisible();
 expect(await hud.locator('.race-hud-rank').innerText()).toBe(rank);
 const frozenHud=await hud.innerText();
 await page.waitForTimeout(350);
 expect(await hud.innerText()).toBe(frozenHud);
 expect(await page.locator('#trip-pause-dock').isVisible()).toBe(true);
 await page.screenshot({path:test.info().outputPath('driving-paused-hud-intact.png')});
});

test('mobile opponent tags avoid the center HUD without entering the traffic sightline',async({page})=>{
 test.setTimeout(180000);
 await ready(page,'at=2400&trafficSeed=17');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing',{timeout:process.env.CI?90000:10000});
 const tags=await page.evaluate(()=>(window as any).__drive.rivalTags());
 expect(tags).toHaveLength(7);
 for(const tag of tags){
  expect(tag.markerDropPx).toBeGreaterThanOrEqual(0);
  expect(tag.markerDropPx).toBeLessThanOrEqual(22);
  expect(tag.scale[1]/tag.scale[0]).toBeGreaterThan(.64);
 }
 await page.screenshot({path:test.info().outputPath('rivals-below-race-hud-915x412.png')});
});

import {expect,test} from '@playwright/test';
import {touchDriver} from './touch-driver';

/** Visual-acceptance helper: emulate a landscape phone. Physical Pixel 8
 * remains the release authority for color, readability, touch and FPS. */
test('coast driving HUD reveals scenery, then shades only the held inputs',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
 try{
  const page=await ctx.newPage();
  await page.goto('/?seed=1&playerui=1');
  await page.locator('#player-play').tap();
  await expect(page.locator('#player-start')).toBeHidden({timeout:45000});
  for(const selector of ['#pause','#steering-strip','[data-control=gas]','[data-control=brake]','#drive-readout','#gear']){
   const bg=await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(bg,selector).toBe('rgba(0, 0, 0, 0)');
  }
  const touch=await touchDriver(page,ctx);
  await touch(.5,true,false);
  await expect(page.locator('[data-control=gas]')).toHaveClass(/pressed/);
  await expect(page.locator('#steering-strip')).toHaveClass(/pressed/);
  const shade=await page.locator('[data-control=gas]').evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(shade).not.toBe('rgba(0, 0, 0, 0)');
  const opacity=Number(shade.match(/rgba?\([^,]+,[^,]+,[^,]+,?\s*([\d.]*)\)/)?.[1]??1);
  expect(opacity).toBeLessThan(.35);
  await touch(null,false,false);
  await expect(page.locator('[data-control=gas]')).not.toHaveClass(/pressed/);
  await expect(page.locator('#steering-strip')).not.toHaveClass(/pressed/);
  expect(await page.locator('[data-control=gas]').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await touch(null,false,true);
  await expect(page.locator('[data-control=brake]')).toHaveClass(/pressed/);
  await touch(null,false,false);
  await expect(page.locator('[data-control=brake]')).not.toHaveClass(/pressed/);
 }finally{await ctx.close();}
});

import {test,expect} from '@playwright/test';

test('the old pace selectors cannot change normal start, travel or chase framing',async({page})=>{
 await page.setViewportSize({width:960,height:540});
 await page.goto('/?pace=2&paceTest=A&paceFov=0');
 await page.locator('#start-race').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','ready');
 await page.locator('#race-start').click();
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','countdown');
 await expect(page.locator('html')).toHaveAttribute('data-drive-mode','playing');
 await page.locator('#game-loading').waitFor({state:'hidden'});
 const samples=await page.evaluate(()=>{
  const game=(window as any).__drive;
  game.manual(true);
  return [100,200,250].map(kmh=>{
   game.reset({distance:420,speed:kmh/3.6});
   const start=game.snapshot();
   game.advance(1/120,{gas:false,brake:false,steer:0});
   const end=game.snapshot();
   return {speed:end.speed,measured:(end.distance-start.distance)/(end.elapsed-start.elapsed),distance:end.camera.distance};
  });
 });
 for(const sample of samples){
  expect(sample.measured).toBeCloseTo(sample.speed,6);
  expect(sample.distance).toBe(8);
 }
});

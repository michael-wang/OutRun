import {test,expect} from '@playwright/test';
import {stageReady} from './stage-ready';

test('default trip matches the explicit Seed 1 route and preserves replay',async({page})=>{
 await page.goto('/');await stageReady(page);
 const route=await page.evaluate(()=>(window as any).__drive.brick());
 expect(route.id).toBe('ROAD-TRIP-10M');expect(route.seed).toBe(1);expect(route.nominalDuration).toBeGreaterThan(590);expect(route.nominalDuration).toBeLessThan(630);
 await page.locator('#l2-play').click();await page.keyboard.down('Space');
 await expect.poll(()=>page.evaluate(()=>(window as any).__drive.snapshot().speed)).toBeGreaterThan(0);
 await page.keyboard.up('Space');await page.keyboard.press('KeyP');await page.locator('#l2-replay').click();
 expect(await page.evaluate(()=>(window as any).__drive.brick().stageCode)).toBe(route.stageCode);
 await page.goto('/?trip=10m&seed=1');await stageReady(page);
 expect(await page.evaluate(()=>(window as any).__drive.brick())).toEqual(route);
});

for(const [path,code] of [['/','TRIP-v0.9-r1-1-ALB1'],['/?seed=42','TRIP-v0.9-r1-16-ALB1']]){
 test(`production public entry ${path}`,async({page})=>{
  await page.goto(`http://127.0.0.1:4173${path}`);
  await expect(page.locator('#l2-lab h1')).toHaveText('10-Minute Road Trip');
  await expect(page.locator('#stage-seed')).toHaveValue(code);
  await expect(page.locator('#l2-lab a')).toHaveCount(0);
  await expect(page.locator('#l2-replay')).toBeVisible();await expect(page.locator('#l2-next')).toHaveText(/N\]?ew Route/ );
  await page.locator('#l2-play').click();await expect(page.locator('#l2-lab')).toBeHidden({timeout:30000});
  await page.keyboard.down('Space');await expect.poll(async()=>Number(await page.locator('#speed strong').innerText())).toBeGreaterThan(0);await page.keyboard.up('Space');
 });
}

for(const [path,selector] of [['/?stage=1','#stage-seed'],['/?lab=l2','#l2-select'],['/?lab=pilots','#l2-select'],['/?lab=bricks','#brick-select'],['/?mode=free','#drive'],['/?velocity','#drive']]){
 test(`production historical route ${path}`,async({page})=>{
  await page.goto(`http://127.0.0.1:4173${path}`);await expect(page.locator(selector)).toBeVisible();
  if(path==='/?stage=1')await expect(page.locator(selector)).toHaveValue('S01-v0.8.3-r1-1-ALB1');
 });
}

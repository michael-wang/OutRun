import {test,expect} from '@playwright/test';
test('production PWA opens Road Trip offline after a first online visit',async({browser})=>{
 const context=await browser.newContext(),page=await context.newPage();await page.goto('http://127.0.0.1:4173/');await expect(page.locator('#l2-lab h1')).toContainText('10-Minute Road Trip');await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(async()=>{for(const key of await caches.keys())for(const req of await (await caches.open(key)).keys())if(req.url.includes('road-worker-'))return true;return false;},null,{timeout:30000});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.goto('http://127.0.0.1:4173/');await page.locator('#l2-play').click({timeout:10000});await expect(page.locator('#l2-lab')).toBeHidden({timeout:30000});await expect(page.locator('canvas')).toBeVisible();await context.close();
});

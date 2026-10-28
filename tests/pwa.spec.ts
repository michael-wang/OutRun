import { test,expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
test('production manifest icons worker and playable build',async({page,request})=>{
 const origin='http://127.0.0.1:4173',errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const response=await request.get(`${origin}/manifest.webmanifest`);expect(response.ok()).toBe(true);const manifest=await response.json();expect(manifest.display).toBe('fullscreen');expect(manifest.orientation).toBe('landscape');expect(manifest.scope).toBe('/');expect(manifest.start_url).toBe('/');
 for(const size of [192,512]){const icon=manifest.icons.find((i:any)=>i.sizes===`${size}x${size}`);expect(icon.type).toBe('image/png');const result=await request.get(origin+icon.src);expect(result.ok()).toBe(true);const bytes=await result.body();expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));expect(bytes.readUInt32BE(16)).toBe(size);expect(bytes.readUInt32BE(20)).toBe(size);}
 await page.goto(origin);await expect(page.locator('#drive')).toBeVisible();expect(await page.locator('link[rel=manifest]').getAttribute('href')).toBe('/manifest.webmanifest');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 expect(await page.evaluate(()=>(window as any).__drive)).toBeUndefined();await page.locator('#drive').click();await page.keyboard.down('w');await page.waitForTimeout(1800);await page.keyboard.up('w');expect(Number(await page.locator('#speed strong').innerText())).toBeGreaterThan(0);
 expect(errors).toEqual([]);writeFileSync('docs/evidence/v0.8.2/regressions/v0.8.1/regressions/v0.8/regressions/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.2/pwa.json',JSON.stringify({manifest,workerControlled:true,productionDriving:true,errors,physicalInstall:'UNVERIFIED'},null,2));
});

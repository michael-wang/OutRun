import {test,expect} from '@playwright/test';

test('photo confirmation waits for the archive and the gallery is absent',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/__outrun_capture',async route=>{await gate;await route.fulfill({status:200,json:{path:'captures/private.png',count:1}});});
 await page.goto('/?stage=1&seed=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);await page.keyboard.press('KeyP');await page.waitForFunction(()=>(window as any).__drive.snapshot().mode==='playing');await page.keyboard.press('F8');
 await expect(page.locator('#photo-status')).toBeHidden();release();
 await expect(page.locator('#photo-status')).toHaveText('📸 Saved');
 await page.keyboard.press('KeyP');await expect(page.locator('#photos-open')).toHaveCount(0);await expect(page.locator('#photo-gallery')).toHaveCount(0);
});

test('archive failure cannot report a saved photo',async({page})=>{
 await page.route('**/__outrun_capture',route=>route.fulfill({status:500,body:'error'}));
 await page.goto('/?stage=1&seed=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);await page.keyboard.press('KeyP');await page.waitForFunction(()=>(window as any).__drive.snapshot().mode==='playing');const download=page.waitForEvent('download');await page.keyboard.press('F8');
 await expect(page.locator('#photo-status')).toContainText('PC save unconfirmed');expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test('an HTML response cannot be mistaken for a disk-save acknowledgement',async({page})=>{
 await page.route('**/__outrun_capture',route=>route.fulfill({status:200,contentType:'text/html',body:'<html>Not an archive</html>'}));
 await page.goto('/?stage=1&seed=1');await page.waitForFunction(()=>(window as any).__drive?.streaming()?.ready);await page.keyboard.press('KeyP');await page.waitForFunction(()=>(window as any).__drive.snapshot().mode==='playing');
 const download=page.waitForEvent('download');await page.keyboard.press('F8');await expect(page.locator('#photo-status')).toContainText('PC save unconfirmed');await download;
});

test('folder endpoint rejects cross-origin, paths and non-local hostnames',async({request})=>{
 const url='http://127.0.0.1:5173/__outrun_open_photos';
 expect((await request.post(url,{headers:{Origin:'http://evil.example'}})).status()).toBe(403);
 expect((await request.post(url,{headers:{Origin:'http://127.0.0.1:5173'},data:'C:\\Windows'})).status()).toBe(403);
 expect((await request.post(url,{headers:{Host:'example.com:5173',Origin:'http://example.com:5173'}})).status()).toBe(403);
});

test('local photo folder row is readable and its button has a touch-sized target',async({page})=>{
 await page.setViewportSize({width:960,height:540});await page.goto('/?stage=1&seed=1');await expect(page.locator('#photo-folder')).toBeVisible();
 const row=await page.locator('#photo-folder').boundingBox(),text=await page.locator('#photo-folder span').boundingBox(),button=await page.locator('#photo-folder button').boundingBox();
 expect(row&&text&&button).toBeTruthy();expect(Math.abs(text!.y+text!.height/2-(button!.y+button!.height/2))).toBeLessThan(5);expect(button!.height).toBeGreaterThanOrEqual(44);
});

test('production Stage starts without exposing a PC capture path',async({page})=>{
 await page.goto('http://127.0.0.1:4173/?stage=1&seed=1');
 await expect(page.locator('#photo-folder')).toHaveCount(0);await page.locator('#l2-play').click();
 await expect(page.locator('#l2-lab')).toBeHidden({timeout:30000});await expect(page.locator('canvas')).toBeVisible();
});

test('production install can start Stage offline after only visiting free drive',async({browser})=>{
 const context=await browser.newContext(),page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(async()=>{for(const key of await caches.keys())for(const request of await (await caches.open(key)).keys())if(request.url.includes('road-worker-'))return true;return false;},null,{timeout:30000});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.goto('http://127.0.0.1:4173/?stage=1&seed=1');await page.locator('#l2-play').click({timeout:10000});
 await expect(page.locator('#l2-lab')).toBeHidden({timeout:30000});await expect(page.locator('canvas')).toBeVisible();await context.close();
});

import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:540}}),rows=[],cdp=await page.context().newCDPSession(page);
await page.goto('http://127.0.0.1:5175/?trip=10m&seed=1&stream=1');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,{timeout:60000});await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.__drive.snapshot().mode==='playing');await page.evaluate(()=>window.__drive.manual(true));
// Each step represents ten seconds at 100 road units/s, wrapping the long route. This is a virtual traversal, not a real-time drive.
for(let seconds=0;seconds<=1200;seconds+=10){
 const distance=350+(seconds*115)%69000;
 await page.evaluate(distance=>window.__drive.reset({distance,speed:60,lateral:0}),distance);
 await page.waitForFunction(()=>window.__drive.streaming().ready,{timeout:30000});
 if(seconds%600===0)await cdp.send('HeapProfiler.collectGarbage');
 const row=await page.evaluate(seconds=>{const g=window.__drive;g.advance(.01,{gas:false,brake:false,steer:0});const scene=g.scenery(),stream=g.streaming();return {seconds,position:g.snapshot().distance,geometries:scene.memory.geometries,textures:scene.memory.textures,draws:scene.render.calls,chunks:stream.chunks.length,queued:stream.queued,heap:performance.memory?.usedJSHeapSize??null};},seconds);
 rows.push(row);if(seconds%300===0)console.log(JSON.stringify(row));
}
await writeFile('docs/evidence/v0.9/soak-gc.json',JSON.stringify(rows,null,2));await browser.close();

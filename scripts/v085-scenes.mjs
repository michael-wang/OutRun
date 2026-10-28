import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:540}}),rows=[];
await page.goto('http://127.0.0.1:5173/?stage=1&seed=1&stream=1');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,{timeout:60000});await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.__drive.snapshot().mode==='playing');await page.evaluate(()=>window.__drive.manual(true));
for(const d of [999,1001,4999,5001,8426,9001,12500]){await page.evaluate(d=>window.__drive.reset({distance:d,speed:65,lateral:0}),d);await page.waitForFunction(()=>window.__drive.streaming().ready,{timeout:30000});const row=await page.evaluate(d=>{const g=window.__drive;g.advance(.01,{gas:false,brake:false,steer:0});return {distance:d,sample:g.sample(d),contacts:g.wheelContacts(),visibility:g.visibility(),stream:g.streaming().chunks};},d);rows.push(row);await page.screenshot({path:`docs/evidence/v0.8.5/stream-scene-${d}.png`});}
await writeFile('docs/evidence/v0.8.5/scene-probes.json',JSON.stringify(rows,null,2));await browser.close();

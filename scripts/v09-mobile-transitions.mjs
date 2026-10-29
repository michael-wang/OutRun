import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:844,height:390}}),rows=[];
await page.goto('http://127.0.0.1:5175/?trip=10m&seed=1');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,{timeout:120000});await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.__drive.snapshot().mode==='playing');await page.evaluate(()=>window.__drive.manual(true));
const plan=await page.evaluate(()=>window.__drive.brick());
for(const [i,p] of plan.worldPhases.entries())if(i>0&&i<=2)for(const delta of [-150,150]){
 const d=350+p.startS+delta;await page.evaluate(d=>window.__drive.reset({distance:d,speed:65,lateral:0}),d);await page.waitForFunction(()=>window.__drive.streaming().ready,{timeout:60000});await page.evaluate(()=>window.__drive.advance(.01,{gas:false,brake:false,steer:0}));await page.screenshot({path:`docs/evidence/v0.9/mobile-transition-${i}-${delta<0?'before':'after'}.png`});rows.push(await page.evaluate(({i,d})=>({i,d,road:window.__drive.sample(d),contacts:window.__drive.wheelContacts(),stream:window.__drive.streaming().chunks,surface:window.__drive.surfaceProbe(d,0),support:window.__drive.supportAudit()}),{i,d}));
}
await writeFile('docs/evidence/v0.9/mobile-transitions.json',JSON.stringify(rows,null,2));await browser.close();

import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const root='docs/evidence/v0.5';const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true});
await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();await page.evaluate(()=>{window.__drive.manual(true);window.__drive.reset({distance:200,speed:65});});
const rows=[];
for(const size of [{width:960,height:432},{width:1440,height:900}]){await page.setViewportSize(size);await page.evaluate(()=>window.__drive.reset({distance:200,speed:65}));await page.screenshot({path:`${root}/car-chase-${size.width}.png`});rows.push({size,framing:await page.evaluate(()=>window.__drive.framing())});}
for(const view of ['front','side','cockpit']){await page.evaluate(v=>window.__drive.carView(v),view);await page.screenshot({path:`${root}/car-${view}.png`});}
await page.setViewportSize({width:960,height:432});await page.evaluate(()=>{const g=window.__drive,c=g.challenges().find(c=>c.id==='extreme');g.reset({distance:c.start+c.transitionLength+10,speed:65});g.advance(.5,{gas:true,brake:false,steer:1});});await page.screenshot({path:`${root}/car-peak.png`});rows.push({peak:await page.evaluate(()=>({state:window.__drive.snapshot(),framing:window.__drive.framing()}))});writeFileSync(`${root}/car-framing.json`,JSON.stringify(rows,null,2));await browser.close();

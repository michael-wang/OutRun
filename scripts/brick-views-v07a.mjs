import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true});
await page.goto('http://127.0.0.1:5173/?lab=bricks&brick=BRK-03');
await page.evaluate(()=>{const g=window.__drive,b=g.brick();g.manual(true);g.reset({distance:350+4.3*b.length/b.nominalDuration,speed:230/3.6});});
await page.screenshot({path:'docs/evidence/v0.7a/BRK-03-warning-close.png'});
await browser.close();

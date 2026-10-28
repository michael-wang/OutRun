import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:540}});
await page.goto('http://127.0.0.1:5174/?stage=1&seed=1');await page.locator('#photo-folder').waitFor({state:'visible'});await page.screenshot({path:'docs/evidence/v0.8.5/photo-menu.png'});
const result=page.waitForResponse(r=>r.url().endsWith('/__outrun_open_photos'));await page.locator('#photo-folder button').click();const response=await result;const row=await page.locator('#photo-folder').innerText();await writeFile('docs/evidence/v0.8.5/open-folder.json',JSON.stringify({status:response.status(),row},null,2));console.log(JSON.stringify({status:response.status(),row}));await browser.close();

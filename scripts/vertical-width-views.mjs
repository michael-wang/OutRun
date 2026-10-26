import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence/v0.7a1';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true});
const results=[];
for(let i=1;i<=8;i++){
 const id=`BRK-0${i}`;await page.goto(`http://127.0.0.1:5173/?lab=bricks&brick=${id}`);
 for(const t of i===3?[3,8,14]:i===5?[5,10.56,16]:i===6?[1,9,18]:i===7?[1,12,25]:[6,17]){
  const state=await page.evaluate(t=>{const g=window.__drive,b=g.brick();g.manual(true);g.reset({distance:350+t*b.length/b.nominalDuration,speed:230/3.6});return {sample:g.sample(g.snapshot().distance),state:g.snapshot(),art:g.scenery()};},t);
  await page.screenshot({path:`${root}/${id}-${t}s.png`});results.push({id,t,...state});
 }
}
writeFileSync(`${root}/static-views.json`,JSON.stringify(results,null,2));await browser.close();

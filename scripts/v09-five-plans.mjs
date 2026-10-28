import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:960,height:540}}),plans=[];
for(const seed of [1,2,3,4,5]){
 const before=Date.now();await page.goto(`http://127.0.0.1:5175/?trip=10m&seed=${seed}`);await page.waitForFunction(()=>window.__drive?.streaming()?.ready,{timeout:120000});
 const data=await page.evaluate(()=>{const g=window.__drive,b=g.brick(),samples=[];for(let s=0;s<=b.length;s+=100){const p=g.sample(350+s);samples.push({s,...p});}return {plan:b,samples,boot:g.streaming(),scene:g.scenery(),fingerprint:g.sceneFingerprint()};});
 plans.push({seed,readyMs:Date.now()-before,...data});
}
await writeFile('docs/evidence/v0.9/five-plans.json',JSON.stringify(plans,null,2));console.log(JSON.stringify(plans.map(p=>({seed:p.seed,code:p.plan.tripCode,fingerprint:p.plan.contentFingerprint,phases:p.plan.worldPhases.map(x=>x.world),readyMs:p.readyMs,initialChunks:p.boot.chunks.length}))));await browser.close();

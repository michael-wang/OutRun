import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='docs/evidence/coast-r85/views';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 const layout=await page.evaluate(async()=>{const m=await import('/src/coast-village-layout.ts');return {carts:m.COAST_VILLAGE_SITES.filter(s=>s.kind==='waffle'),rest:m.COAST_REST_SPOTS,sites:m.COAST_VILLAGE_SITES};});
 const views=[['homes',590],['bench',layout.rest[1].d-32],['family',layout.rest[2].d-30],['waffle',layout.carts[0].d-35],['market',layout.carts[0].d-90],['later-market',layout.carts[1].d-35]];
 const results=[];
 for(const [name,d]of views){await page.evaluate(d=>{window.__drive.manual(true);window.__drive.reset({distance:d,speed:65});},d);await page.waitForFunction(()=>window.__drive.streaming().ready,null,{timeout:60000});await page.waitForTimeout(1000);await page.screenshot({path:`${root}/${name}.png`});results.push(await page.evaluate(()=>({d:window.__drive.snapshot().distance,render:window.__drive.scenery().render,memory:window.__drive.scenery().memory})));}
 await writeFile(`${root}/views.json`,JSON.stringify({errors,layout,results},null,2));console.log(JSON.stringify({errors,carts:layout.carts,benches:layout.rest.length,results}));assert.deepEqual(errors,[]);
}finally{await browser.close();}

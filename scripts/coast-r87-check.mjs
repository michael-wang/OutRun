import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='docs/evidence/coast-r87/views';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 const layout=await page.evaluate(async()=>{const {COAST_VILLAGE_SITES}=await import('/src/coast-village-layout.ts'),{FARM_HOMES,FARM_SCARECROWS}=await import('/src/coast-farm-layout.ts');return {sites:COAST_VILLAGE_SITES,homes:FARM_HOMES,scarecrows:FARM_SCARECROWS};});
 const views=[];
 for(const d of [550,690,2315,2945,3000,3170,3400,3990,4110,4420,4710]){
  await page.evaluate(d=>{const g=window.__drive;g.manual(true);g.reset({distance:d,speed:65});},d);await page.waitForFunction(()=>window.__drive.streaming().ready);await page.waitForTimeout(900);
  await page.screenshot({path:`${root}/driver-${d}.png`});
  const view=await page.evaluate(()=>{const g=window.__drive;return {state:g.snapshot(),farm:g.coastFarm(),render:g.scenery().render};});views.push(view);assert.equal(view.state.laneCount,5);assert.equal(view.state.roadHalfWidth,8.75);
 }
 await writeFile(`${root}/views.json`,JSON.stringify({browser:'Desktop Edge touch emulation; normal chase camera; not physical Pixel 8',layout,views,errors},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({errors,homes:layout.sites.filter(s=>s.kind==='home').length,stalls:layout.sites.filter(s=>s.kind!=='home').length,farmhouses:layout.homes.length,scarecrows:layout.scarecrows.length,views:views.map(v=>({d:v.state.distance,render:v.render}))}));
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.env.FARM_EVIDENCE_DIR??'docs/evidence/coast-r84/views';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(r.url().includes('/assets/coast-'))assets.push(r.url());});
 const start=Date.now();await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});const initialReadyMs=Date.now()-start;
 const views=[];
 for(const d of (process.env.FARM_VIEWS??'1500,1750,2425,2600,3200,4520,4740,6000,6300,7460,7660,8400').split(',').map(Number)){
  await page.evaluate(d=>{const g=window.__drive;g.manual(true);g.reset({distance:d,speed:65});},d);
  await page.waitForFunction(()=>window.__drive.streaming().ready,null,{timeout:60000});await page.waitForTimeout(1200);
  await page.screenshot({path:`${root}/driver-${d}.png`});
  views.push(await page.evaluate(()=>{const g=window.__drive;return {state:g.snapshot(),farm:g.coastFarm(),boats:g.coastBoats(),render:g.scenery().render,memory:g.scenery().memory,streaming:g.streaming()};}));
 }
 await writeFile(`${root}/views.json`,JSON.stringify({browser:'Desktop Edge, touch emulation, normal journey/chase camera; not Pixel 8',initialReadyMs,errors,assets,views},null,2));
 console.log(JSON.stringify({initialReadyMs,errors,assets,views:views.map(v=>({d:v.state.distance,render:v.render,plots:v.farm.length}))}));assert.deepEqual(errors,[]);
 assert.equal(assets.filter(x=>x.endsWith('.glb')).length,5);assert.ok(views.every(v=>v.boats.length===14));assert.ok(views[0].farm.flatMap(f=>f.scarecrows).length>=3);
}finally{await browser.close();}

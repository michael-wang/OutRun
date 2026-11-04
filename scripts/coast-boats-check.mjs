import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.env.BOAT_EVIDENCE_DIR??'docs/evidence/coast-r82/views';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:576},hasTouch:true,isMobile:true,deviceScaleFactor:1}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(r.url().includes('/assets/coast-boats/'))assets.push(r.url());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 const views=[];
 for(const d of (process.env.BOAT_VIEWS??'1450,1750,2050,5600,8250').split(',').map(Number)){
  await page.evaluate(d=>{const g=window.__drive;g.manual(true);g.reset({distance:d,speed:65});},d);
  await page.waitForFunction(()=>window.__drive.streaming().ready,null,{timeout:60000});await page.waitForTimeout(1000);
  await page.screenshot({path:`${root}/driver-${d}.png`});
  views.push(await page.evaluate(()=>{const g=window.__drive;return {state:g.snapshot(),boats:g.coastBoats(),render:g.scenery().render,memory:g.scenery().memory};}));
 }
 await writeFile(`${root}/views.json`,JSON.stringify({browser:'Desktop Edge, touch emulation, normal journey/chase camera; not Pixel 8',errors,assets,views},null,2));
 assert.deepEqual(errors,[]);assert.equal(assets.filter(x=>x.endsWith('.glb')).length,2);assert.ok(views.every(v=>v.boats.length===4));
 console.log(JSON.stringify({errors,assets,views:views.map(v=>({d:v.state.distance,render:v.render}))}));
}finally{await browser.close();}

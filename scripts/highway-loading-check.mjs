// Real rendering in desktop Edge with touch emulation, not a Pixel 8 benchmark.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.env.HIGHWAY_EVIDENCE_DIR??'docs/evidence/coast-r81/highway';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true,deviceScaleFactor:2.75}),errors=[];
 const capture=async path=>{await page.evaluate(()=>{window.capturing=true;});await page.screenshot({path});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.capturing=false;resolve();}))));};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 await page.evaluate(()=>{const g=window.__drive;g.journeyLoadHold(true);g.manual(true);g.reset({distance:g.journey().chapters[0].end-500,speed:65});});
 await page.waitForTimeout(1200);assert.equal((await page.evaluate(()=>window.__drive.journey())).preparing,false);
 await page.evaluate(()=>{
  const g=window.__drive;window.trace=[];window.longFrames=[];let previous=0;
  function frame(t){if(previous&&t-previous>40)window.longFrames.push({ms:t-previous,d:g.snapshot().distance,index:g.journey().index,capture:!!window.capturing});previous=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});},30);
  window.sampler=setInterval(()=>{const s=g.snapshot(),j=g.journey();window.trace.push({d:s.distance,index:j.index,speed:s.speed,offRoad:s.offRoad,gap:s.surfaceError,curvature:g.sample(s.distance).curvature,preparing:j.preparing,prepared:j.prepared,exit:j.exitAt,water:g.coastWater(),memory:g.scenery().memory,traffic:g.traffic()?.actors.filter(a=>a.visible).length,recipes:g.traffic()?.highwayRecipes});},500);g.manual(false);
 });
 await page.waitForFunction(extra=>window.__drive.snapshot().distance>window.__drive.journey().chapters[0].end+extra,Number(process.env.HIGHWAY_WAIT_DISTANCE??4500),{timeout:120000});
 const held=await page.evaluate(()=>({journey:window.__drive.journey(),snapshot:window.__drive.snapshot()}));
 assert.equal(held.journey.index,0);assert.ok(held.snapshot.speed>0);assert.ok(held.journey.preparing);
 await capture(`${root}/extended-highway.png`);
 await page.evaluate(()=>window.__drive.journeyLoadHold(false));
 await page.waitForFunction(()=>window.__drive.journey().index===1,null,{timeout:120000});
 await page.waitForTimeout(7000);await capture(`${root}/city-arrival.png`);
 const result=await page.evaluate(()=>{clearInterval(window.driver);clearInterval(window.sampler);window.__drive.manual(true);return {trace:window.trace,longFrames:window.longFrames,journey:window.__drive.journey(),snapshot:window.__drive.snapshot()};});
 await writeFile(`${root}/drive.json`,JSON.stringify({browser:'Desktop Edge touch emulation; not a physical phone',errors,held,...result},null,2));
 assert.deepEqual(errors,[]);assert.ok(result.journey.loadStarts.every(x=>x.distance>=result.journey.chapters[x.index-1].end+260));
 const wait=result.trace.filter(x=>x.index===0&&x.d>held.journey.chapters[0].end+700);
 assert.ok(wait.every(x=>!x.offRoad&&x.gap!==null&&Math.abs(x.gap)<.15));assert.ok(wait.some(x=>Math.abs(x.curvature)>.0001));assert.ok(wait.some(x=>x.traffic>0));
 assert.ok(result.journey.transitions.every(x=>Math.abs(x.speedAfter-x.speedBefore)<.001));
 console.log(JSON.stringify({errors,heldDistance:held.snapshot.distance,loadStarts:result.journey.loadStarts,transitions:result.journey.transitions,longFrames:result.longFrames,waitSamples:wait.length}));
 if(process.env.HIGHWAY_CHECK_CANYON){
  await page.evaluate(()=>{const g=window.__drive;g.reset({distance:g.journey().chapters[1].end-500,speed:65});window.trace=[];window.longFrames=[];});
  await page.waitForTimeout(1200);assert.equal((await page.evaluate(()=>window.__drive.journey())).preparing,false);
  await page.evaluate(()=>{const g=window.__drive;window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});},30);window.sampler=setInterval(()=>{const s=g.snapshot();window.trace.push({d:s.distance,index:g.journey().index,speed:s.speed,offRoad:s.offRoad,gap:s.surfaceError});},500);g.manual(false);});
  await page.waitForFunction(()=>window.__drive.journey().index===2,null,{timeout:120000});await page.waitForTimeout(5000);
  await capture(root+'/canyon-arrival.png');
  const canyon=await page.evaluate(()=>{clearInterval(window.driver);clearInterval(window.sampler);window.__drive.manual(true);return {journey:window.__drive.journey(),trace:window.trace,longFrames:window.longFrames};});
  await writeFile(root+'/canyon.json',JSON.stringify({errors,...canyon},null,2));assert.deepEqual(errors,[]);assert.ok(canyon.journey.loadStarts.every(x=>x.distance>=canyon.journey.chapters[x.index-1].end+260));assert.ok(canyon.trace.every(x=>!x.offRoad));console.log(JSON.stringify({canyon:canyon.journey.transitions,preparations:canyon.journey.preparations}));
 }
}finally{await browser.close();}


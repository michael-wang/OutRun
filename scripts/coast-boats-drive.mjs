// Continuous high-speed drive + scene replay. Desktop touch emulation, not a phone benchmark.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='docs/evidence/coast-r82/drive';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true,deviceScaleFactor:2.75}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(r.url().includes('/assets/coast-boats/'))assets.push(r.url());});
 await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});
 await page.evaluate(()=>{
  const g=window.__drive;g.reset({distance:350,speed:65});g.manual(false);window.trace=[];window.frameTimes=[];window.capture=false;let last=0;
  function frame(t){if(last&&!window.capture)window.frameTimes.push(t-last);last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});},30);
  window.sampler=setInterval(()=>{const s=g.snapshot();window.trace.push({d:s.distance,time:s.elapsed,speed:s.speed,offRoad:s.offRoad,boats:g.coastBoats(),memory:g.scenery().memory,render:g.scenery().render,journey:g.journey().index});},1000);
 });
 for(const d of [1550,2250,5500,8050]){
  await page.waitForFunction(d=>window.__drive.snapshot().distance>=d,d,{timeout:90000});
  await page.evaluate(()=>{window.capture=true;});await page.screenshot({path:`${root}/moving-${d}.png`});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.capture=false;resolve();}))));
 }
 await page.waitForFunction(()=>window.__drive.journey().index===1,null,{timeout:90000});
 const result=await page.evaluate(()=>{clearInterval(window.driver);clearInterval(window.sampler);window.__drive.manual(true);const f=window.frameTimes.sort((a,b)=>a-b);return {trace:window.trace,frames:{count:f.length,p95:f[Math.floor(f.length*.95)],p99:f[Math.floor(f.length*.99)],worst:f.at(-1),over50:f.filter(x=>x>=50).length},journey:window.__drive.journey(),remainingBoats:window.__drive.coastBoats().length};});
 assert.equal(result.remainingBoats,0);assert.ok(result.trace.filter(x=>x.journey===0).every(x=>x.boats.length===4));assert.ok(result.trace.every(x=>!x.offRoad));
 // Exercise the real replay action and ensure retired boat resources were not cached live.
 await page.evaluate(()=>document.getElementById('restart').click());
 await page.waitForFunction(()=>!window.__drive.journey().transitioning&&window.__drive.journey().index===0&&window.__drive.coastBoats().length===4,null,{timeout:120000});
 const replay=await page.evaluate(()=>({boats:window.__drive.coastBoats(),memory:window.__drive.scenery().memory}));
 await writeFile(`${root}/drive.json`,JSON.stringify({browser:'Desktop Edge 960x432 touch, DPR 2.75; capture frames excluded; not Pixel 8',errors,assets,...result,replay},null,2));
 assert.deepEqual(errors,[]);assert.equal(assets.filter(x=>x.endsWith('.glb')).length,2);
 console.log(JSON.stringify({errors,frames:result.frames,chapter:result.journey.index,assets,replayBoats:replay.boats.length}));
}finally{await browser.close();}

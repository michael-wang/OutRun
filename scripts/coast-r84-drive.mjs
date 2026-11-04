// Continuous high-speed farm visit, chunk retirement + replay. Not a phone benchmark.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.env.FARM_DRIVE_DIR??'docs/evidence/coast-r84/final-drive';await mkdir(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:960,height:432},hasTouch:true,isMobile:true,deviceScaleFactor:2.75}),errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(r.url().includes('/assets/coast-'))assets.push(r.url());});
 const loadStart=Date.now();await page.goto('http://127.0.0.1:5180/');await page.waitForFunction(()=>window.__drive?.streaming()?.ready,null,{timeout:120000});const initialReadyMs=Date.now()-loadStart;
 const expectedScarecrows=await page.evaluate(async()=>{const {FARM_SCARECROWS}=await import('/src/coast-farm-layout.ts');return FARM_SCARECROWS.length;}),initialScarecrows=await page.evaluate(()=>window.__drive.coastFarm().flatMap(p=>p.scarecrows).length);
 await page.evaluate(()=>{
  const g=window.__drive;g.reset({distance:350,speed:65});g.manual(false);window.trace=[];window.frameTimes=[];window.capture=false;let last=0;
  function frame(t){if(last&&!window.capture)window.frameTimes.push(t-last);last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  window.driver=setInterval(()=>{const s=g.snapshot();g.controls({gas:s.speed<65,brake:s.speed>66,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.14))});},30);
  window.sampler=setInterval(()=>{const s=g.snapshot();window.trace.push({d:s.distance,time:s.elapsed,speed:s.speed,offRoad:s.offRoad,farm:g.coastFarm(),boats:g.coastBoats(),water:g.coastWater(),memory:g.scenery().memory,render:g.scenery().render,journey:g.journey().index});},1000);
 });
 for(const d of (process.env.DRIVE_VIEWS??'1520,2425,2640,3210,4520,6000,7500').split(',').map(Number)){
  await page.waitForFunction(d=>window.__drive.snapshot().distance>=d,d,{timeout:90000});
  await page.evaluate(()=>{window.capture=true;});await page.screenshot({path:`${root}/moving-${d}.png`});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{window.capture=false;resolve();}))));
 }
 await page.waitForFunction(()=>window.__drive.journey().index===1,null,{timeout:180000});
 const result=await page.evaluate(()=>{clearInterval(window.driver);clearInterval(window.sampler);window.__drive.manual(true);const f=window.frameTimes.sort((a,b)=>a-b);return {trace:window.trace,frames:{count:f.length,p95:f[Math.floor(f.length*.95)],p99:f[Math.floor(f.length*.99)],worst:f.at(-1),over50:f.filter(x=>x>=50).length},journey:window.__drive.journey(),remainingBoats:window.__drive.coastBoats().length,remainingFarms:window.__drive.coastFarm().length};});
 assert.equal(result.remainingBoats,0);assert.equal(result.remainingFarms,0);assert.ok(result.trace.filter(x=>x.journey===0).every(x=>x.boats.length===14));assert.ok(result.trace.every(x=>!x.offRoad));
 assert.ok(Math.max(...result.trace.map(x=>x.farm.length))>=91);assert.ok(result.trace.some(x=>x.farm.flatMap(p=>p.scarecrows).length===expectedScarecrows));
 // Exercise the real replay action; farmland must reappear without another download.
 await page.evaluate(()=>{window.replayProgress=[];window.replayObserver=new MutationObserver(()=>{const value=Number(document.getElementById('loading-percent').textContent.replace('%',''));if(window.replayProgress.at(-1)?.value!==value)window.replayProgress.push({value,title:document.getElementById('loading-title').textContent,artVisible:!document.getElementById('game-loading').hidden,appHidden:document.documentElement.dataset.loading==='true'});});window.replayObserver.observe(document.getElementById('game-loading'),{childList:true,subtree:true,attributes:true});document.getElementById('restart').click();});
 await page.waitForFunction(()=>!document.getElementById('game-loading').hidden&&document.documentElement.dataset.loading==='true');await page.screenshot({path:`${root}/restart-preparing.png`});
 await page.waitForFunction(()=>Number(document.getElementById('loading-percent').textContent.replace('%',''))>=75,null,{timeout:120000});await page.screenshot({path:`${root}/restart-progress.png`});
 await page.waitForFunction(()=>!window.__drive.journey().transitioning&&window.__drive.journey().index===0&&window.__drive.coastFarm().length>=64&&window.__drive.streaming().ready,null,{timeout:120000});
 const replay=await page.evaluate(()=>({farm:window.__drive.coastFarm(),boats:window.__drive.coastBoats(),water:window.__drive.coastWater(),memory:window.__drive.scenery().memory}));
 await page.waitForFunction(()=>document.getElementById('game-loading').hidden);
 const replayProgress=await page.evaluate(()=>{window.replayObserver.disconnect();return window.replayProgress;});
 assert.ok(replayProgress.length>4);assert.equal(replayProgress.at(-1).value,100);assert.ok(replayProgress.every((p,i)=>p.artVisible&&p.appHidden&&(!i||p.value>=replayProgress[i-1].value)));
 assert.equal(replay.water.boatShadow.size,512);assert.ok(result.trace.filter(x=>x.journey===0).every(x=>x.water.boatShadow.casters<=3));assert.equal(replay.farm.flatMap(p=>p.scarecrows).length,initialScarecrows);assert.ok(result.trace.some(x=>x.d>9100&&x.journey===0&&x.farm.length===0));
 await writeFile(`${root}/drive.json`,JSON.stringify({browser:'Desktop Edge 960x432 touch, DPR 2.75; capture frames excluded; not Pixel 8',initialReadyMs,errors,assets,...result,replay,replayProgress},null,2));
 assert.deepEqual(errors,[]);assert.equal(assets.filter(x=>x.endsWith('.glb')).length,5);
 console.log(JSON.stringify({errors,frames:result.frames,chapter:result.journey.index,assets,replayBoats:replay.boats.length}));
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.8.1';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const seed of [1,2,3]){
 const ctx=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:root,size:{width:960,height:540}}});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5173/?stage=1&seed=${seed}`);await page.keyboard.press('KeyP');
 await page.evaluate(()=>{
  const g=window.__drive;window.stageTrace=[];
  window.stageDriver=setInterval(()=>{
   const s=g.snapshot(),future=[0,70,140,210].map(d=>g.sample(s.distance+d).curvature),max=Math.max(...future.map(k=>Math.abs(k)));
   const limit=max>.005?49:64,steer=Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.10));
   g.controls({gas:s.speed<limit,brake:s.speed>limit+1,steer});
   window.stageTrace.push({time:s.elapsed,s:s.distance,speed:s.speed*3.6,steer,brake:s.speed>limit+1,lateral:s.lateral,offRoad:s.offRoad,grade:s.grade,lanes:s.laneCount,frames:s.frames});
   if(s.mode!=='playing'){clearInterval(window.stageDriver);g.controls();}
  },200);
 });
 const started=Date.now();await page.waitForFunction(()=>window.__drive.snapshot().mode==='paused',null,{timeout:300000,polling:1000});
 const result=await page.evaluate(()=>({stage:window.__drive.brick(),state:window.__drive.snapshot(),trace:window.stageTrace,scenery:window.__drive.scenery()}));
 await page.screenshot({path:`${root}/seed-${seed}-finish.png`});const video=page.video();await ctx.close();await video.saveAs(`${root}/seed-${seed}-full-drive.webm`);unlinkSync(await video.path());
 writeFileSync(`${root}/seed-${seed}-drive.json`,JSON.stringify({seed,wallSeconds:(Date.now()-started)/1000,errors,...result},null,2));
 console.log(JSON.stringify({seed,wallSeconds:(Date.now()-started)/1000,elapsed:result.state.elapsed,distance:result.state.distance,errors}));
}
await browser.close();

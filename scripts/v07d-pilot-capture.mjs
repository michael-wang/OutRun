import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.7d/pilots',desktop=process.env.OUTRUN_CAPTURE_DESKTOP==='1',size=desktop?{width:1280,height:720}:{width:960,height:432},out=root+(desktop?'/desktop':'');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),runs=[],errors=[];
for(let batch=0;batch<1;batch++){
 const context=await browser.newContext({viewport:size,hasTouch:!desktop,isMobile:!desktop,recordVideo:{dir:out,size}}),page=await context.newPage(),started=Date.now();page.on('pageerror',e=>errors.push(e.message));
 for(let i=0;i<3;i++){
  const id=['L2P-A','L2P-B','L2P-C'][i];await page.goto(`http://127.0.0.1:5173/?lab=pilots&pilot=${id}`);await page.screenshot({path:`${out}/${id}-menu.png`});await page.locator('#l2-play').click();
  const setup=await page.evaluate(()=>{const g=window.__drive,b=g.brick();window.l2Driver=setInterval(()=>{const s=g.snapshot(),demand=Math.max(...[0,60,120,200,300].map(a=>Math.abs(g.sample(s.distance+a).challenge.targetRequiredSteering))),limit=demand>1?180/3.6:65;g.controls({gas:limit===65||s.speed<limit,brake:s.speed>limit+.5,steer:Math.max(-1,Math.min(1,Math.round((s.requiredSteer-s.lateral*.09)*4)/4))});},25);return {candidate:b,fingerprint:g.sceneFingerprint()};});
  const start=(Date.now()-started)/1000,rows=[],shots=new Set();
  while(true){const row=await page.evaluate(()=>({s:window.__drive.snapshot(),art:window.__drive.scenery()}));rows.push(row);for(const fraction of [.25,.5,.75])if(!shots.has(fraction)&&row.s.distance>=350+setup.candidate.length*fraction){shots.add(fraction);await page.screenshot({path:`${out}/${id}-${fraction*100}.png`});}if(row.s.mode!=='playing'||row.s.elapsed>110)break;await page.waitForTimeout(100);}
  await page.evaluate(()=>{clearInterval(window.l2Driver);window.__drive.controls(undefined);});await page.screenshot({path:`${out}/${id}-complete.png`});const result={...setup,batch:batch+1,startVideoSeconds:start,endVideoSeconds:(Date.now()-started)/1000,elapsed:rows.at(-1).s.elapsed,offRoad:rows.filter(r=>r.s.offRoad).length,completed:rows.at(-1).s.distance>=350+setup.candidate.length,rows};runs.push(result);writeFileSync(`${out}/${id}.json`,JSON.stringify(result,null,2));console.log(id,result.elapsed,result.offRoad,result.completed);
 }
 const storage=await page.evaluate(()=>localStorage.getItem('outrun-l2-pilots-v1'));if(storage!==null)errors.push('Capture unexpectedly wrote feedback');const video=page.video();await context.close();await video.saveAs(`${out}/batch-${batch+1}.webm`);unlinkSync(await video.path());
}
await browser.close();writeFileSync(`${out}/capture-index.json`,JSON.stringify({errors,runs:runs.map(({rows,...r})=>r)},null,2));

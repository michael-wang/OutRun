import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const desktop=process.env.OUTRUN_CAPTURE_DESKTOP==='1',size=desktop?{width:1280,height:720}:{width:960,height:432};const root='docs/evidence/v0.7a1'+(desktop?'/desktop':'');mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:size,hasTouch:!desktop,isMobile:!desktop,recordVideo:{dir:root,size}}),page=await context.newPage();
const errors=[],runs=[];page.on('pageerror',e=>errors.push(e.message));
const started=Date.now();
for(const i of (desktop?[3,5,6,7]:[1,2,3,4,5,6,7,8])){
 const id=`BRK-0${i}`;await page.goto(`http://127.0.0.1:5173/?lab=bricks&brick=${id}`);await page.screenshot({path:`${root}/${id}-review.png`});await page.locator('#brick-play').click();
 const setup=await page.evaluate(()=>{const g=window.__drive,b=g.brick();window.labDriver=setInterval(()=>{const s=g.snapshot(),sample=g.sample,upcoming=Math.max(...[0,50,100,200,300].map(d=>Math.abs(sample(s.distance+d).challenge.targetRequiredSteering))),limit=upcoming>1?180/3.6:65;g.controls({gas:limit===65||s.speed<limit,brake:s.speed>limit+.5,steer:Math.max(-1,Math.min(1,Math.round((s.requiredSteer-s.lateral*.07)*4)/4))});},25);return {brick:b,fingerprint:g.sceneFingerprint()};});
 const rows=[],start=(Date.now()-started)/1000;let shot=false;const marks=new Set();
 while(true){const r=await page.evaluate(()=>({s:window.__drive.snapshot(),art:window.__drive.scenery(),w:window.__drive.wheels(),people:window.__drive.occupants()}));rows.push(r);for(const t of (i===3?[3,8,14]:[])){if(!marks.has(t)&&r.s.elapsed>=t){marks.add(t);await page.screenshot({path:`${root}/${id}-crest-${t}s.png`});}}if(!shot&&r.s.elapsed>(i===8?7:i===4?8:i===3?10:6)){await page.screenshot({path:`${root}/${id}-drive.png`});shot=true;}if(r.s.mode!=='playing'||r.s.elapsed>70)break;await page.waitForTimeout(100);}
 await page.evaluate(()=>{clearInterval(window.labDriver);window.__drive.controls(undefined);});await page.screenshot({path:`${root}/${id}-complete.png`});
 const result={...setup,startVideoSeconds:start,endVideoSeconds:(Date.now()-started)/1000,offRoad:rows.filter(r=>r.s.offRoad).length,elapsed:rows.at(-1).s.elapsed,rows};runs.push(result);console.log(id,result.elapsed,result.offRoad);writeFileSync(`${root}/${id}.json`,JSON.stringify(result,null,2));
}
const storage=await page.evaluate(()=>localStorage.getItem('outrun-brick-reviews-v1'));const video=page.video();await context.close();await video.saveAs(`${root}/${desktop?'desktop-profiles':'all-eight'}.webm`);unlinkSync(await video.path());await browser.close();writeFileSync(`${root}/capture-index.json`,JSON.stringify({errors,storage,runs:runs.map(({rows,...r})=>r)},null,2));

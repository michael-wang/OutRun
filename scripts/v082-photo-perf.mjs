import {chromium} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
for(const capture of [false,true]){
 const context=await browser.newContext({viewport:{width:960,height:540}}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/?stage=1&seed=1');await page.keyboard.press('KeyP');
 await page.evaluate(()=>{const g=window.__drive;window.stageDriver=setInterval(()=>{const s=g.snapshot(),k=Math.max(...[0,100,200,300].map(d=>Math.abs(g.sample(s.distance+d).curvature))),limit=k>.005?50:83;g.controls({gas:s.speed<limit,brake:s.speed>limit+1,steer:Math.max(-1,Math.min(1,s.requiredSteer-s.lateral*.1))});},100);});
 const sample=()=>page.evaluate(()=>({wall:performance.now(),state:window.__drive.snapshot(),heap:performance.memory?.usedJSHeapSize??null}));const before=await sample();
 for(let i=0;i<12;i++){await page.waitForTimeout(10000);if(capture)await page.keyboard.press('F8');}
 const after=await sample(),photos=await page.evaluate(()=>JSON.parse(localStorage.getItem('outrun-photos-v082')??'[]').length);const report=await page.evaluate(()=>window.__drive.telemetry());
 const wall=(after.wall-before.wall)/1000;results.push({capture,wall,fps:(after.state.frames-before.state.frames)/wall,heapBefore:before.heap,heapAfter:after.heap,stageSeconds:after.state.elapsed-before.state.elapsed,mode:after.state.mode,photosStored:photos,photoEvents:report.events.filter(x=>x.kind==='photo').length,errors});console.log(JSON.stringify(results.at(-1)));await context.close();
}
writeFileSync('docs/evidence/v0.8.2/photo-performance.json',JSON.stringify(results,null,2));await browser.close();

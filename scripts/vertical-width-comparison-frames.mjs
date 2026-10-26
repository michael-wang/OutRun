// Extract matched chase-camera moments from the real browser recordings.
// This changes only video playback, never the game or the historical evidence.
import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:960,height:432}});
for(const version of ['v0.7a','v0.7a1']){
 const index=JSON.parse(readFileSync(`docs/evidence/${version}/capture-index.json`,'utf8'));
 await page.goto(`http://127.0.0.1:5173/docs/evidence/${version}/all-eight.webm`);
 for(const [id,seconds] of [['BRK-03',3],['BRK-03',8],['BRK-03',14],['BRK-05',10.56]]){
  const run=index.runs.find(r=>r.brick.id===id),time=run.startVideoSeconds+seconds;
  await page.evaluate(async time=>{const video=document.querySelector('video');video.pause();video.controls=false;video.style.cssText='position:fixed;inset:0;width:960px;height:432px;object-fit:contain';await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=time;});},time);
  await page.locator('video').screenshot({path:`docs/evidence/v0.7a1/${id}-compare-${seconds}s-${version==='v0.7a'?'r1':'r2'}.png`});
 }
}
await browser.close();

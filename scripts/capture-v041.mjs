import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.4.1';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const label of ['corrections','bend','road-loop']){
 const context=await browser.newContext({viewport:{width:960,height:432},recordVideo:{dir:root,size:{width:960,height:432}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(async label=>{
  const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),g=window.__drive,driver=scriptedDriver();
  g.reset({distance:label==='road-loop'?5600:label==='bend'?1800:0,speed:65});window.captureRows=[];
  window.captureTimer=setInterval(()=>{const s=g.snapshot();
   if(label!=='corrections')g.controls(driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample,1.75)));
   window.captureRows.push({...s,wall:performance.now(),probes:label==='road-loop'?[0,20,60].map(a=>g.surfaceProbe(s.distance+a)):[]});
  },50);
 },label);
 if(label==='corrections'){
  await page.keyboard.down('Space');
  for(const [key,ms,rest] of [['a',150,500],['d',150,500],['a',900,500],['d',600,500]]){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);await page.waitForTimeout(rest);}
  await page.keyboard.up('Space');
 }else for(let i=0;i<(label==='road-loop'?125:24);i++){
  await page.waitForTimeout(1000);if(i%15===0)await page.screenshot({path:`${root}/${label}-${i}s.png`});
 }
 const data=await page.evaluate(()=>{clearInterval(window.captureTimer);return {trace:window.captureRows,audit:window.__drive.audit()};});
 await page.screenshot({path:`${root}/${label}-end.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${label}.webm`);unlinkSync(await video.path());
 const summary={label,errors,elapsed:data.trace.at(-1).elapsed,distance:data.trace.at(-1).distance,offRoad:data.trace.filter(s=>s.offRoad).length,maxSlipDegrees:Math.max(...data.trace.map(s=>Math.abs(s.slipAngle)*180/Math.PI)),maxSkid:Math.max(...data.trace.map(s=>s.audio.skidLevel))};
 writeFileSync(`${root}/${label}.json`,JSON.stringify({...summary,...data},null,2));console.log(JSON.stringify(summary));
}
await browser.close();
writeFileSync(`${root}/review.html`,`<!doctype html><meta charset="utf-8"><title>Analog Arcade Steering & Rescue</title><style>body{background:#12313a;color:#fff4dd;font:16px system-ui;margin:24px}video{width:min(960px,100%);display:block;margin:12px 0}</style><h1>v0.4.1 motion evidence</h1><p>Actual Edge gameplay at default 1.75 pace. Corrections use real keyboard events. Bend and 125-second road traversal use an external test-only analog driver; normal gameplay has no automatic steering. Recordings are silent. Physical Pixel feel and audio listening require human playtesting.</p>${['corrections','touch-correction','drift-release','bend','road-loop'].map(label=>`<h2>${label}</h2><video controls muted loop src="${label}.webm" poster="${label}-end.png"></video>`).join('')}`);

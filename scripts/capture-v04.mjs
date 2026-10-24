import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
const root='docs/evidence/v0.4';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const label of ['tap','hold','drift','rhythm']){
 const context=await browser.newContext({viewport:{width:960,height:432},recordVideo:{dir:root,size:{width:960,height:432}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(async label=>{
  const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),g=window.__drive,driver=scriptedDriver();
  g.reset({distance:label==='drift'?850:0,speed:label==='drift'?55:65});window.v04Trace=[];
  window.v04Timer=setInterval(()=>{const s=g.snapshot();
   if(label==='rhythm'||(label==='drift'&&s.elapsed>1.8))g.controls(driver(s,g.sample(s.distance).curvature,plannedSpeed(s.distance,g.sample,1.75)));
   window.v04Trace.push({...s,wall:performance.now(),frame:g.framing()});
  },50);
 },label);
 if(label!=='rhythm'){
  await page.keyboard.down('Space');await page.keyboard.down('d');await page.waitForTimeout(label==='tap'?180:label==='hold'?1000:1800);await page.keyboard.up('d');
  await page.screenshot({path:`${root}/${label}-peak.png`});await page.waitForTimeout(label==='drift'?6500:1800);await page.keyboard.up('Space');
 }else{
  for(let i=0;i<70;i++){await page.waitForTimeout(1000);const s=await page.evaluate(()=>window.__drive.snapshot());if(i%5===0)await page.screenshot({path:`${root}/rhythm-${i}s.png`});if(s.distance>=3130)break;}
 }
 const data=await page.evaluate(()=>{clearInterval(window.v04Timer);const g=window.__drive,gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {trace:window.v04Trace,audit:g.audit(),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'};});
 await page.screenshot({path:`${root}/${label}-end.png`});const video=page.video();await context.close();await video.saveAs(`${root}/${label}.webm`);unlinkSync(await video.path());
 const summary={label,errors,distance:data.trace.at(-1).distance,time:data.trace.at(-1).elapsed,offRoad:data.trace.filter(s=>s.offRoad).length,maxSlipDegrees:Math.max(...data.trace.map(s=>Math.abs(s.slipAngle)*180/Math.PI)),maxSkid:Math.max(...data.trace.map(s=>s.audio.skidLevel)),final:data.trace.at(-1)};
 writeFileSync(`${root}/${label}.json`,JSON.stringify({...summary,...data},null,2));console.log(JSON.stringify({...summary,final:undefined}));
}
await browser.close();
writeFileSync(`${root}/review.html`,`<!doctype html><meta charset="utf-8"><title>v0.4 driving evidence</title><style>body{background:#12313a;color:#fff4dd;font:16px system-ui;margin:24px}video{width:min(960px,100%);display:block;margin:12px 0}p{max-width:900px}</style><h1>v0.4 Arcade Handling & Rhythm</h1><p>Actual Edge gameplay, default 1.75 pace. Tap/hold/drift start with real Space+D keys; drift recovery and rhythm use the external test driver, not gameplay assistance. Recordings have no audio track; squeal state is captured in JSON. Physical Pixel feel, FPS and sound need human testing.</p>${['tap','hold','drift','rhythm'].map(label=>`<h2>${label}</h2><video controls muted loop src="${label}.webm" poster="${label}-end.png"></video>`).join('')}`);


import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const output=process.argv[2]??'docs/evidence/v0.3';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.OUTRUN_BROWSER==='chromium'?undefined:'msedge'});
for(const [label,speed,seconds] of [['low',16.67,5],['mid',33.33,5],['high',60,5],['acceleration',0,25],['s-bends',65,25]]){
 const context=await browser.newContext({viewport:{width:960,height:432},recordVideo:{dir:output,size:{width:960,height:432}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.locator('#drive').click();
 await page.evaluate(async({speed,label})=>{
  const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts');const driver=scriptedDriver(),g=window.__drive;
  g.reset({distance:label==='acceleration'?0:label==='s-bends'?1500:400,speed});window.motionTrace=[];window.frameDurations=[];
  let previous=performance.now();function frame(now){window.frameDurations.push(now-previous);previous=now;window.motionRaf=requestAnimationFrame(frame);}window.motionRaf=requestAnimationFrame(frame);
  window.motionTimer=setInterval(()=>{
   const s=g.snapshot(),k=g.sample(s.distance).curvature,input=driver(s,k);
   const target=label==='acceleration'||label==='s-bends'?plannedSpeed(s.distance,g.sample):speed;
   input.gas=s.speed<target;input.brake=s.speed>target+2;
   g.controls(input);window.motionTrace.push({...s,framing:g.framing(),controls:input,wall:performance.now()});
  },100);
 },{speed,label});
 await page.waitForTimeout(seconds*1000);
 const evidence=await page.evaluate(()=>{clearInterval(window.motionTimer);cancelAnimationFrame(window.motionRaf);window.__drive.controls();const gl=document.querySelector('canvas').getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):'unavailable',trace:window.motionTrace,frameDurations:window.frameDurations};});
 await page.screenshot({path:`${output}/${label}-end.png`});
 const video=page.video();await context.close();await video.saveAs(`${output}/${label}.webm`);
 const raw=await video.path();if(raw!==`${output}/${label}.webm`){const {unlinkSync}=await import('node:fs');unlinkSync(raw);}
 writeFileSync(`${output}/${label}.json`,JSON.stringify({label,seconds,errors,...evidence},null,2));
 console.log(label,JSON.stringify({errors,start:evidence.trace[0]?.speed,end:evidence.trace.at(-1)?.speed,distance:evidence.trace.at(-1)?.distance-evidence.trace[0]?.distance,offRoad:evidence.trace.filter(s=>s.offRoad).length}));
}
await browser.close();

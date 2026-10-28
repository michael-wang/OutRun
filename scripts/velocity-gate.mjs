import { chromium } from '@playwright/test';
import { mkdirSync,writeFileSync,unlinkSync,readFileSync } from 'node:fs';
const stage=process.argv[2]??'after',output=`docs/evidence/v0.3.1/${stage}`;
if(!['before','after'].includes(stage))throw new Error('Expected before or after.');
if(stage==='before'&&readFileSync('src/world.ts','utf8').includes('#b64b35'))throw new Error('Before evidence requires the original v0.3 world, with audit instrumentation only. Do not relabel the modified scene as baseline.');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const [label,speed,seconds] of [['low',22.22,6],['mid',40,6],['high',65,6],...(stage==='before'?[]:[['launch',0,30]])]){
 const context=await browser.newContext({viewport:{width:960,height:432},recordVideo:{dir:output,size:{width:960,height:432}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173/');await page.locator('#drive').click();
 await page.evaluate(async({label,speed})=>{
  const {scriptedDriver,plannedSpeed}=await import('/tests/driver.ts'),driver=scriptedDriver(),g=window.__drive;
  g.reset({distance:label==='launch'?0:400,speed});window.gateTrace=[];
  const badge=document.createElement('div');badge.id='gate-clock';badge.style.cssText='position:fixed;top:12px;left:32%;padding:6px;background:#123b;color:white;font:12px monospace;pointer-events:none';document.body.append(badge);
  window.gateTimer=setInterval(()=>{
   const s=g.snapshot(),target=label==='launch'?plannedSpeed(s.distance,g.sample):speed;
   const controls=driver(s,g.sample(s.distance).curvature,target);
   controls.gas=s.speed<target;controls.brake=s.speed>target+2;
   if(label==='launch'&&s.elapsed>21&&s.elapsed<23){controls.brake=true;controls.gas=false;}
   g.controls(controls);badge.textContent=`${label.toUpperCase()} · ${s.elapsed.toFixed(1)}s · FIXED CAMERA`;
   window.gateTrace.push({...s,framing:g.framing(),controls,wall:performance.now()});
  },50);
 },{label,speed});
 await page.waitForTimeout(seconds*1000);
 const evidence=await page.evaluate(()=>{clearInterval(window.gateTimer);const g=window.__drive;g.controls();const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {audit:g.audit(),trace:window.gateTrace,renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown'};});
 await page.screenshot({path:`${output}/${label}.png`});
 const video=page.video();await context.close();await video.saveAs(`${output}/${label}.webm`);unlinkSync(await video.path());
 writeFileSync(`${output}/${label}.json`,JSON.stringify({stage,label,errors,...evidence},null,2));
 console.log(label,JSON.stringify({errors,rows:evidence.audit.map(r=>({mps:r.worldMetersPerSecond,widths:r.roadWidthsPerSecond,passes:r.markerPasses,fps:r.fps})),offRoad:evidence.trace.filter(s=>s.offRoad).length,braking:evidence.trace.filter(s=>s.controls.brake).length}));
}
await browser.close();
